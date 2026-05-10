package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.service.DashboardService
import de.interaapps.weowe.debt.service.DebtCalculationService
import de.interaapps.weowe.debt.service.DebtStore
import org.hamcrest.Matchers.greaterThan
import org.hamcrest.Matchers.hasSize
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

class DebtControllerTest {
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setup() {
        val store = FakeDebtStore()
        val dashboardService = DashboardService(store, DebtCalculationService())
        mockMvc = MockMvcBuilders
            .standaloneSetup(DebtController(store, dashboardService))
            .build()
    }

    @Test
    fun `dashboard returns calculated summary and settlements`() {
        mockMvc.perform(get("/api/dashboard").param("groupId", "friends"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.groups", hasSize<Any>(greaterThan(0))))
            .andExpect(jsonPath("$.events", hasSize<Any>(greaterThan(0))))
            .andExpect(jsonPath("$.summary.netCents").exists())
            .andExpect(jsonPath("$.owedByMe").isArray)
            .andExpect(jsonPath("$.owedToMe").isArray)
    }

    @Test
    fun `create event validates ledger balance`() {
        val body = """
            {
              "groupId": "friends",
              "type": "direct",
              "title": "Unbalanced",
              "lines": [
                { "memberId": "julian", "amountCents": -500 },
                { "memberId": "alex", "amountCents": 400 }
              ]
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/events")
                .contentType("application/json")
                .content(body),
        )
            .andExpect(status().isBadRequest)
    }
}

private class FakeDebtStore : DebtStore {
    private val groups = listOf(Group(id = "friends", name = "Freundesgruppe 1"))
    private val members = listOf(
        Member(id = "julian", name = "Julian", initials = "J"),
        Member(id = "alex", name = "Alex", initials = "A"),
    )
    private val events = mutableMapOf(
        "event-1" to DebtEvent(
            id = "event-1",
            groupId = "friends",
            type = EventType.DIRECT,
            title = "Alex schuldet dir",
            createdAt = Instant.parse("2026-05-09T12:00:00Z"),
            lines = listOf(
                LedgerLine(memberId = "julian", amountCents = 1_000),
                LedgerLine(memberId = "alex", amountCents = -1_000),
            ),
        ),
    )

    override fun getGroups(): List<Group> = groups
    override fun getMembers(): List<Member> = members
    override fun getMember(memberId: String): Member = members.first { it.id == memberId }
    override fun getGroup(groupId: String): Group = groups.first { it.id == groupId }
    override fun getEvent(eventId: String): DebtEvent = events.getValue(eventId)
    override fun getEventsForGroup(groupId: String): List<DebtEvent> = events.values.filter { it.groupId == groupId }

    override fun createEvent(request: UpsertDebtEventRequest): DebtEvent {
        if (request.lines.sumOf { it.amountCents } != 0L) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Ledger lines must sum to 0")
        }
        val event = DebtEvent(
            id = request.id ?: "created",
            groupId = request.groupId,
            type = request.type,
            title = request.title,
            description = request.description,
            createdAt = request.createdAt ?: Instant.now(),
            lines = request.lines,
        )
        events[event.id] = event
        return event
    }

    override fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent =
        createEvent(request.copy(id = eventId))

    override fun deleteEvent(eventId: String) {
        events.remove(eventId)
    }

    override fun updateMember(memberId: String, request: UpdateMemberRequest): Member =
        getMember(memberId).copy(name = request.name)
}
