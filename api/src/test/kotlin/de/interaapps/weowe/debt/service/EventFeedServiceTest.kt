package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventDateRange
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.CreateGroupRequest
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

class EventFeedServiceTest {
    @Test
    fun `mine filter forwards current user id and clamps page size`() {
        val store = FakeDebtStore()
        val service = EventFeedService(store)
        val currentUser = member("user-1")

        service.getEventPage(
            currentUser = currentUser,
            groupId = "group-1",
            page = -3,
            size = 999,
            query = "  pizza  ",
            type = EventType.SPLIT,
            mineOnly = true,
            range = EventDateRange.ALL,
        )

        assertEquals("group-1", store.lastGroupId)
        assertEquals(0, store.lastPage)
        assertEquals(50, store.lastSize)
        assertEquals("pizza", store.lastQuery)
        assertEquals(EventType.SPLIT, store.lastType)
        assertEquals("user-1", store.lastMemberId)
        assertNull(store.lastCreatedAfter)
    }

    @Test
    fun `date range resolves relative createdAfter`() {
        val store = FakeDebtStore()
        val service = EventFeedService(store)
        service.clock = Clock.fixed(Instant.parse("2026-05-10T12:00:00Z"), ZoneOffset.UTC)

        service.getEventPage(
            currentUser = member("user-1"),
            groupId = "group-1",
            page = 0,
            size = 20,
            query = null,
            type = null,
            mineOnly = false,
            range = EventDateRange.LAST_7_DAYS,
        )

        assertEquals(Instant.parse("2026-05-03T12:00:00Z"), store.lastCreatedAfter)
        assertNull(store.lastMemberId)
    }

    @Test
    fun `users outside the group are rejected`() {
        val store = FakeDebtStore(groups = emptyList())
        val service = EventFeedService(store)

        val error = assertThrows<ResponseStatusException> {
            service.getEventPage(
                currentUser = member("user-1"),
                groupId = "group-404",
                page = 0,
                size = 20,
                query = null,
                type = null,
                mineOnly = false,
                range = null,
            )
        }

        assertEquals(HttpStatus.FORBIDDEN, error.statusCode)
    }

    private fun member(id: String) = Member(id = id, name = "Julian", initials = "J")

    private class FakeDebtStore(
        private val groups: List<Group> = listOf(Group(id = "group-1", name = "WG")),
    ) : DebtStore {
        var lastGroupId: String? = null
        var lastPage: Int? = null
        var lastSize: Int? = null
        var lastQuery: String? = null
        var lastType: EventType? = null
        var lastMemberId: String? = null
        var lastCreatedAfter: Instant? = null

        override fun getGroupsForMember(memberId: String): List<Group> = groups
        override fun createGroup(ownerMemberId: String, request: CreateGroupRequest): Group = groups.first()
        override fun joinGroup(memberId: String, groupId: String): Group = groups.first()
        override fun leaveGroup(memberId: String, groupId: String) = Unit
        override fun getMembersForGroup(groupId: String): List<Member> = emptyList()
        override fun getMember(memberId: String): Member = testMember(memberId)
        override fun getGroup(groupId: String): Group = groups.first()
        override fun getEvent(eventId: String): DebtEvent = sampleEvent()
        override fun getEventsForGroup(groupId: String): List<DebtEvent> = listOf(sampleEvent())

        override fun getEventPageForGroup(
            groupId: String,
            page: Int,
            size: Int,
            query: String?,
            type: EventType?,
            memberId: String?,
            createdAfter: Instant?,
        ): EventPage {
            lastGroupId = groupId
            lastPage = page
            lastSize = size
            lastQuery = query
            lastType = type
            lastMemberId = memberId
            lastCreatedAfter = createdAfter
            return EventPage(items = listOf(sampleEvent()), page = page, size = size, totalCount = 1, hasMore = false)
        }

        override fun createEvent(request: UpsertDebtEventRequest): DebtEvent = sampleEvent()
        override fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent = sampleEvent()
        override fun deleteEvent(eventId: String) = Unit
        override fun updateMember(memberId: String, request: UpdateMemberRequest): Member = testMember(memberId)

        private fun sampleEvent() = DebtEvent(
            id = "event-1",
            groupId = "group-1",
            type = EventType.SPLIT,
            title = "Pizza",
            createdAt = Instant.parse("2026-05-10T12:00:00Z"),
            lines = listOf(
                LedgerLine(memberId = "user-1", amountCents = 500),
                LedgerLine(memberId = "user-2", amountCents = -500),
            ),
        )

        private fun testMember(id: String) = Member(id = id, name = "Julian", initials = "J")
    }
}
