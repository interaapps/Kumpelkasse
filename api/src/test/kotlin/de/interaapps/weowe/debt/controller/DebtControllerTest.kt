package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.BearerAuthFilter
import de.interaapps.weowe.debt.auth.CurrentSessionTokenArgumentResolver
import de.interaapps.weowe.debt.auth.CurrentUserArgumentResolver
import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.dto.CreateGroupRequest
import de.interaapps.weowe.debt.dto.LoginRequest
import de.interaapps.weowe.debt.dto.LoginResponse
import de.interaapps.weowe.debt.dto.OidcLoginRequest
import de.interaapps.weowe.debt.dto.RegisterRequest
import de.interaapps.weowe.debt.service.AuthSession
import de.interaapps.weowe.debt.service.AccessControlService
import de.interaapps.weowe.debt.service.AuthFacade
import de.interaapps.weowe.debt.service.DashboardService
import de.interaapps.weowe.debt.service.DebtCalculationService
import de.interaapps.weowe.debt.service.DebtStore
import de.interaapps.weowe.debt.service.EventFeedService
import de.interaapps.weowe.debt.service.InsightsService
import jakarta.servlet.Filter
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
import org.springframework.test.web.servlet.setup.StandaloneMockMvcBuilder
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

class DebtControllerTest {
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setup() {
        val store = FakeDebtStore()
        mockMvc = buildMockMvc(store, FakeAuth(Member(id = "julian", name = "Julian", initials = "J", email = "julian@example.com")))
    }

    @Test
    fun `dashboard returns calculated summary and settlements`() {
        mockMvc.perform(
            get("/api/dashboard")
                .param("groupId", "friends")
                .header("Authorization", "Bearer test-session"),
        )
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
                .header("Authorization", "Bearer test-session")
                .contentType("application/json")
                .content(body),
        )
            .andExpect(status().isBadRequest)
    }

    @Test
    fun `event details require group membership`() {
        val store = FakeDebtStore()
        val outsider = Member(id = "outsider", name = "Outsider", initials = "O", email = "outsider@example.com")
        val mvc = buildMockMvc(store, FakeAuth(outsider))

        mvc.perform(
            get("/api/events/event-1")
                .header("Authorization", "Bearer test-session"),
        )
            .andExpect(status().isForbidden)
    }

    @Test
    fun `member profile requires shared group`() {
        val store = FakeDebtStore()
        val outsider = Member(id = "outsider", name = "Outsider", initials = "O", email = "outsider@example.com")
        val mvc = buildMockMvc(store, FakeAuth(outsider))

        mvc.perform(
            get("/api/members/alex")
                .header("Authorization", "Bearer test-session"),
        )
            .andExpect(status().isForbidden)
    }

    private fun buildMockMvc(store: FakeDebtStore, auth: FakeAuth): MockMvc {
        val insightsService = InsightsService(store, AccessControlService(store))
        val dashboardService = DashboardService(store, DebtCalculationService(), insightsService)
        val eventFeedService = EventFeedService(store)
        val accessControl = AccessControlService(store)
        val builder: StandaloneMockMvcBuilder = MockMvcBuilders
            .standaloneSetup(
                AuthController(auth),
                DashboardController(dashboardService),
                EventController(store, eventFeedService, accessControl),
                GroupController(store, accessControl, insightsService),
                MemberController(store, accessControl),
                InviteController(accessControl, dashboardService),
            )
        builder.addFilters<StandaloneMockMvcBuilder>(BearerAuthFilter(auth) as Filter)
        builder.setCustomArgumentResolvers(CurrentUserArgumentResolver(), CurrentSessionTokenArgumentResolver())
        return builder.build()
    }
}

private class FakeDebtStore : DebtStore {
    private val groupsByUserId = mapOf(
        "julian" to listOf(Group(id = "friends", name = "Freundesgruppe 1")),
        "alex" to listOf(Group(id = "friends", name = "Freundesgruppe 1")),
        "outsider" to emptyList(),
    )
    private val members = listOf(
        Member(id = "julian", name = "Julian", initials = "J"),
        Member(id = "alex", name = "Alex", initials = "A"),
        Member(id = "outsider", name = "Outsider", initials = "O"),
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

    override fun getGroupsForMember(memberId: String): List<Group> = groupsByUserId[memberId] ?: emptyList()

    override fun createGroup(ownerMemberId: String, request: CreateGroupRequest): Group =
        Group(id = "group-created", name = request.name)

    override fun joinGroup(memberId: String, groupId: String): Group = getGroup(groupId)

    override fun leaveGroup(memberId: String, groupId: String) = Unit

    override fun getMembersForGroup(groupId: String): List<Member> = members
    override fun getMember(memberId: String): Member = members.first { it.id == memberId }
    override fun getGroup(groupId: String): Group = groupsByUserId.values.flatten().distinctBy { it.id }.first { it.id == groupId }
    override fun getEvent(eventId: String): DebtEvent = events.getValue(eventId)
    override fun getEventsForGroup(groupId: String): List<DebtEvent> = events.values.filter { it.groupId == groupId }
    override fun getEventPageForGroup(
        groupId: String,
        page: Int,
        size: Int,
        query: String?,
        type: EventType?,
        memberId: String?,
        createdAfter: Instant?,
    ): EventPage {
        val filtered = events.values
            .filter { it.groupId == groupId }
            .filter { type == null || it.type == type }
            .filter { query.isNullOrBlank() || it.title.contains(query, ignoreCase = true) || (it.description?.contains(query, ignoreCase = true) == true) }
            .filter { memberId == null || it.lines.any { line -> line.memberId == memberId } }
            .filter { createdAfter == null || !it.createdAt.isBefore(createdAfter) }
            .sortedByDescending { it.createdAt }

        val fromIndex = (page * size).coerceAtMost(filtered.size)
        val toIndex = (fromIndex + size).coerceAtMost(filtered.size)
        val items = filtered.subList(fromIndex, toIndex)

        return EventPage(
            items = items,
            page = page,
            size = size,
            totalCount = filtered.size.toLong(),
            hasMore = toIndex < filtered.size,
        )
    }

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

private class FakeAuth(
    private val currentMember: Member,
) : AuthFacade {

    override fun login(request: LoginRequest): LoginResponse =
        LoginResponse(sessionToken = "test-session", currentUserId = currentMember.id, member = currentMember)

    override fun register(request: RegisterRequest): LoginResponse =
        LoginResponse(sessionToken = "test-session", currentUserId = currentMember.id, member = currentMember)

    override fun loginWithInteraApps(request: OidcLoginRequest): LoginResponse =
        LoginResponse(sessionToken = "test-session", currentUserId = currentMember.id, member = currentMember)

    override fun logout(token: String) = Unit

    override fun getSession(token: String): LoginResponse =
        LoginResponse(sessionToken = token, currentUserId = currentMember.id, member = currentMember)

    override fun requireSession(token: String): AuthSession = AuthSession(token = token, user = currentMember)
}
