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
        assertEquals("alex", result.owedToMe.single().member.id)
        assertEquals(500, result.owedToMe.single().amountCents)
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
        assertEquals("alex", result.owedByMe.single().member.id)
    }
}
