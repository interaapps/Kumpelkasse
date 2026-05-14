package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
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
import java.time.Instant

class InsightsServiceTest {
    private val members = listOf(
        Member(id = "julian", name = "Julian", initials = "J"),
        Member(id = "alex", name = "Alex", initials = "A"),
        Member(id = "matti", name = "Matti", initials = "M"),
    )

    @Test
    fun `group stats expose signed member balances for all members`() {
        val service = InsightsService(
            store = FakeInsightsDebtStore(
                members = members,
                events = listOf(
                    event(
                        id = "event-1",
                        lines = listOf(
                            LedgerLine(memberId = "julian", amountCents = -1_000),
                            LedgerLine(memberId = "alex", amountCents = 1_000),
                        ),
                    ),
                ),
            ),
            accessControl = AccessControlService(
                FakeInsightsDebtStore(
                    members = members,
                    events = emptyList(),
                ),
            ),
        )

        val stats = service.getGroupStats("friends", "julian")

        assertEquals(-1_000, stats.memberBalances.first { it.member.id == "julian" }.amountCents)
        assertEquals(1_000, stats.memberBalances.first { it.member.id == "alex" }.amountCents)
        assertEquals(0, stats.memberBalances.first { it.member.id == "matti" }.amountCents)
    }

    @Test
    fun `group stats biggest creditor and debtor keep correct direction`() {
        val store = FakeInsightsDebtStore(
            members = members,
            events = listOf(
                event(
                    id = "event-1",
                    lines = listOf(
                        LedgerLine(memberId = "julian", amountCents = -1_000),
                        LedgerLine(memberId = "alex", amountCents = 1_000),
                    ),
                ),
                event(
                    id = "event-2",
                    lines = listOf(
                        LedgerLine(memberId = "matti", amountCents = -500),
                        LedgerLine(memberId = "alex", amountCents = 500),
                    ),
                ),
            ),
        )
        val service = InsightsService(store, AccessControlService(store))

        val stats = service.getGroupStats("friends", "julian")

        assertEquals("alex", stats.biggestCreditor?.member?.id)
        assertEquals(1_500, stats.biggestCreditor?.amountCents)
        assertEquals("julian", stats.biggestDebtor?.member?.id)
        assertEquals(1_000, stats.biggestDebtor?.amountCents)
    }

    @Test
    fun `group stats stay empty when there are no events`() {
        val store = FakeInsightsDebtStore(members = members, events = emptyList())
        val service = InsightsService(store, AccessControlService(store))

        val stats = service.getGroupStats("friends", "julian")

        assertEquals(0, stats.totalEvents)
        assertEquals(3, stats.memberBalances.size)
        assertEquals(0, stats.memberBalances.sumOf { it.amountCents })
        assertNull(stats.biggestCreditor)
        assertNull(stats.biggestDebtor)
    }

    private fun event(
        id: String,
        lines: List<LedgerLine>,
    ) = DebtEvent(
        id = id,
        groupId = "friends",
        type = EventType.DIRECT,
        title = id,
        createdAt = Instant.parse("2026-05-14T10:00:00Z"),
        lines = lines,
    )
}

private class FakeInsightsDebtStore(
    private val members: List<Member>,
    private val events: List<DebtEvent>,
) : DebtStore {
    override fun getGroupsForMember(memberId: String): List<Group> =
        if (members.any { it.id == memberId }) listOf(Group(id = "friends", name = "Freundesgruppe 1")) else emptyList()

    override fun createGroup(ownerMemberId: String, request: CreateGroupRequest): Group = Group(id = "friends", name = request.name)

    override fun joinGroup(memberId: String, groupId: String): Group = Group(id = groupId, name = "Freundesgruppe 1")

    override fun leaveGroup(memberId: String, groupId: String) = Unit

    override fun getMembersForGroup(groupId: String): List<Member> = members

    override fun getMember(memberId: String): Member = members.first { it.id == memberId }

    override fun getGroup(groupId: String): Group = Group(id = groupId, name = "Freundesgruppe 1")

    override fun getEvent(eventId: String): DebtEvent = events.first { it.id == eventId }

    override fun getEventsForGroup(groupId: String): List<DebtEvent> = events.filter { it.groupId == groupId }

    override fun getEventPageForGroup(
        groupId: String,
        page: Int,
        size: Int,
        query: String?,
        type: EventType?,
        memberId: String?,
        createdAfter: Instant?,
    ): EventPage = EventPage(items = emptyList(), page = page, size = size, totalCount = 0, hasMore = false)

    override fun createEvent(request: UpsertDebtEventRequest): DebtEvent = throw UnsupportedOperationException()

    override fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent = throw UnsupportedOperationException()

    override fun deleteEvent(eventId: String) = Unit

    override fun updateMember(memberId: String, request: UpdateMemberRequest): Member = getMember(memberId)
}
