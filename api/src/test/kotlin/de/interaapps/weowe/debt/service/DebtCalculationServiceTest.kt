package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.Instant

class DebtCalculationServiceTest {
    private val service = DebtCalculationService()
    private val members = listOf(
        Member(id = "julian", name = "Julian", initials = "J"),
        Member(id = "alex", name = "Alex", initials = "A"),
    )

    @Test
    fun `overpaid payment turns into money owed to current user`() {
        val events = listOf(
            DebtEvent(
                id = "debt",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Julian schuldet Alex",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "julian", amountCents = -1_000),
                    LedgerLine(memberId = "alex", amountCents = 1_000),
                ),
            ),
            DebtEvent(
                id = "payment",
                groupId = "friends",
                type = EventType.PAYMENT,
                title = "Julian bezahlt Alex",
                createdAt = Instant.parse("2026-05-09T12:05:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "julian", amountCents = 1_500),
                    LedgerLine(memberId = "alex", amountCents = -1_500),
                ),
            ),
        )

        val result = service.calculateSummary(events, members, "julian")

        assertEquals(0, result.summary.owedByMeCents)
        assertEquals(500, result.summary.owedToMeCents)
        assertEquals(500, result.summary.netCents)
        assertEquals("alex", result.directOwedToMe.single().member.id)
        assertEquals(500, result.directOwedToMe.single().amountCents)
    }

    @Test
    fun `split debt is distributed proportionally to positive ledger lines`() {
        val events = listOf(
            DebtEvent(
                id = "split",
                groupId = "friends",
                type = EventType.SPLIT,
                title = "Essen",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "alex", amountCents = 3_000),
                    LedgerLine(memberId = "julian", amountCents = -1_000),
                    LedgerLine(memberId = "tim", amountCents = -2_000),
                ),
            ),
        )

        val result = service.calculateSummary(
            events = events,
            members = members + Member(id = "tim", name = "Tim", initials = "T"),
            currentUserId = "julian",
        )

        assertEquals(1_000, result.summary.owedByMeCents)
        assertEquals("alex", result.directOwedByMe.single().member.id)
    }

    @Test
    fun `settlements are optimized through current user`() {
        val events = listOf(
            DebtEvent(
                id = "julian-matti",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Julian schuldet Matti",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "julian", amountCents = -2_500),
                    LedgerLine(memberId = "matti", amountCents = 2_500),
                ),
            ),
            DebtEvent(
                id = "konrad-julian",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Konrad schuldet Julian",
                createdAt = Instant.parse("2026-05-09T12:05:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "konrad", amountCents = -2_500),
                    LedgerLine(memberId = "julian", amountCents = 2_500),
                ),
            ),
        )

        val result = service.calculateSummary(
            events = events,
            members = listOf(
                Member(id = "julian", name = "Julian", initials = "J"),
                Member(id = "matti", name = "Matti", initials = "M"),
                Member(id = "konrad", name = "Konrad", initials = "K"),
            ),
            currentUserId = "julian",
        )

        assertEquals(0, result.summary.owedByMeCents)
        assertEquals(0, result.summary.owedToMeCents)
        assertEquals("konrad", result.optimizedTransfers.single().from.id)
        assertEquals("matti", result.optimizedTransfers.single().to.id)
        assertEquals(2_500, result.optimizedTransfers.single().amountCents)
        assertEquals(-2_500, result.optimizedTransfers.single().fromBalanceCents)
        assertEquals(2_500, result.optimizedTransfers.single().toBalanceCents)
        assertEquals(2, result.optimizedTransfers.single().explanationLines.size)
        assertEquals(listOf("konrad", "julian", "matti"), result.optimizedTransfers.single().routeChains.single().memberIds)
    }

    @Test
    fun `complex flow combines split direct debt and payment into minimal transfers`() {
        val events = listOf(
            DebtEvent(
                id = "split",
                groupId = "friends",
                type = EventType.SPLIT,
                title = "Essen",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "alex", amountCents = 2_000),
                    LedgerLine(memberId = "julian", amountCents = -1_000),
                    LedgerLine(memberId = "tim", amountCents = -1_000),
                ),
            ),
            DebtEvent(
                id = "direct",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Tim schuldet Julian",
                createdAt = Instant.parse("2026-05-09T13:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "tim", amountCents = -500),
                    LedgerLine(memberId = "julian", amountCents = 500),
                ),
            ),
            DebtEvent(
                id = "payment",
                groupId = "friends",
                type = EventType.PAYMENT,
                title = "Julian bezahlt Alex",
                createdAt = Instant.parse("2026-05-09T14:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "julian", amountCents = 700),
                    LedgerLine(memberId = "alex", amountCents = -700),
                ),
            ),
        )

        val result = service.calculateSummary(
            events = events,
            members = listOf(
                Member(id = "julian", name = "Julian", initials = "J"),
                Member(id = "alex", name = "Alex", initials = "A"),
                Member(id = "tim", name = "Tim", initials = "T"),
            ),
            currentUserId = "julian",
        )

        assertEquals(0, result.summary.owedByMeCents)
        assertEquals(200, result.summary.owedToMeCents)
        assertEquals(200, result.summary.netCents)
        assertEquals(2, result.optimizedTransfers.size)
        assertEquals("tim", result.optimizedTransfers[0].from.id)
        assertEquals("alex", result.optimizedTransfers[0].to.id)
        assertEquals(1_300, result.optimizedTransfers[0].amountCents)
        assertEquals("tim", result.optimizedTransfers[1].from.id)
        assertEquals("julian", result.optimizedTransfers[1].to.id)
        assertEquals(200, result.optimizedTransfers[1].amountCents)
    }

    @Test
    fun `split where payer also participates keeps original event count and debt size`() {
        val events = listOf(
            DebtEvent(
                id = "dinner",
                groupId = "friends",
                type = EventType.SPLIT,
                title = "Abendessen",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "alex", amountCents = 2_000),
                    LedgerLine(memberId = "julian", amountCents = -1_000),
                    LedgerLine(memberId = "tim", amountCents = -1_000),
                ),
            ),
        )

        val result = service.calculateSummary(
            events = events,
            members = listOf(
                Member(id = "julian", name = "Julian", initials = "J"),
                Member(id = "alex", name = "Alex", initials = "A"),
                Member(id = "tim", name = "Tim", initials = "T"),
            ),
            currentUserId = "julian",
        )

        assertEquals(1_000, result.summary.owedByMeCents)
        assertEquals(0, result.summary.owedToMeCents)
        assertEquals(-1_000, result.summary.netCents)
        assertEquals(1, result.directOwedByMe.single().eventCount)
        assertEquals("alex", result.directOwedByMe.single().member.id)
        assertEquals(1_000, result.directOwedByMe.single().amountCents)
    }

    @Test
    fun `multiple debtors and creditors are reduced to minimal transfer graph`() {
        val events = listOf(
            DebtEvent(
                id = "a-b",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "A schuldet C",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "a", amountCents = -4_000),
                    LedgerLine(memberId = "c", amountCents = 4_000),
                ),
            ),
            DebtEvent(
                id = "a-d",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "A schuldet D",
                createdAt = Instant.parse("2026-05-09T12:05:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "a", amountCents = -1_000),
                    LedgerLine(memberId = "d", amountCents = 1_000),
                ),
            ),
            DebtEvent(
                id = "b-d",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "B schuldet D",
                createdAt = Instant.parse("2026-05-09T12:10:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "b", amountCents = -3_000),
                    LedgerLine(memberId = "d", amountCents = 3_000),
                ),
            ),
        )

        val settlements = service.calculateSettlements(
            events = events,
            members = listOf(
                Member(id = "a", name = "A", initials = "A"),
                Member(id = "b", name = "B", initials = "B"),
                Member(id = "c", name = "C", initials = "C"),
                Member(id = "d", name = "D", initials = "D"),
            ),
            currentUserId = "a",
        )

        assertEquals(3, settlements.optimizedTransfers.size)
        assertEquals(listOf(4_000L, 3_000L, 1_000L), settlements.optimizedTransfers.map { it.amountCents })
        assertEquals("a", settlements.optimizedTransfers[0].from.id)
        assertEquals("c", settlements.optimizedTransfers[0].to.id)
        assertEquals("b", settlements.optimizedTransfers[1].from.id)
        assertEquals("d", settlements.optimizedTransfers[1].to.id)
        assertEquals("a", settlements.optimizedTransfers[2].from.id)
        assertEquals("d", settlements.optimizedTransfers[2].to.id)
    }

    @Test
    fun `optimized explanation only keeps events since the last zero balance`() {
        val events = listOf(
            DebtEvent(
                id = "old-1",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Konrad schuldet Julian alt",
                createdAt = Instant.parse("2026-05-09T10:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "konrad", amountCents = -1_000),
                    LedgerLine(memberId = "julian", amountCents = 1_000),
                ),
            ),
            DebtEvent(
                id = "old-2",
                groupId = "friends",
                type = EventType.PAYMENT,
                title = "Konrad bezahlt Julian alt",
                createdAt = Instant.parse("2026-05-09T11:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "konrad", amountCents = 1_000),
                    LedgerLine(memberId = "julian", amountCents = -1_000),
                ),
            ),
            DebtEvent(
                id = "new-1",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Konrad schuldet Julian neu",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "konrad", amountCents = -2_500),
                    LedgerLine(memberId = "julian", amountCents = 2_500),
                ),
            ),
            DebtEvent(
                id = "new-2",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Julian schuldet Matti neu",
                createdAt = Instant.parse("2026-05-09T12:05:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "julian", amountCents = -2_500),
                    LedgerLine(memberId = "matti", amountCents = 2_500),
                ),
            ),
        )

        val result = service.calculateSummary(
            events = events,
            members = listOf(
                Member(id = "julian", name = "Julian", initials = "J"),
                Member(id = "matti", name = "Matti", initials = "M"),
                Member(id = "konrad", name = "Konrad", initials = "K"),
            ),
            currentUserId = "julian",
        )

        val transfer = result.optimizedTransfers.single()
        assertEquals(2, transfer.explanationLines.size)
        assertEquals(setOf("new-1", "new-2"), transfer.explanationLines.map { it.eventId }.toSet())
        assertEquals(1, transfer.routeChains.size)
        assertEquals(setOf("new-1", "new-2"), transfer.routeChains.single().eventIds.toSet())
    }
}
