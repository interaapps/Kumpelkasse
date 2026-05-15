package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameEntry
import de.interaapps.weowe.debt.domain.GameMode
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
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
    fun `direct home debts keep pairwise payment state even when a third person is involved`() {
        val events = listOf(
            DebtEvent(
                id = "julian-alex",
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
                id = "tim-julian",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Tim schuldet Julian",
                createdAt = Instant.parse("2026-05-09T12:05:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "tim", amountCents = -1_000),
                    LedgerLine(memberId = "julian", amountCents = 1_000),
                ),
            ),
            DebtEvent(
                id = "payment",
                groupId = "friends",
                type = EventType.PAYMENT,
                title = "Julian bezahlt Alex teilweise",
                createdAt = Instant.parse("2026-05-09T12:10:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "julian", amountCents = 500),
                    LedgerLine(memberId = "alex", amountCents = -500),
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

        assertEquals(500, result.summary.owedToMeCents)
        assertEquals(0, result.summary.owedByMeCents)
        assertEquals(500, result.summary.netCents)

        assertEquals(1, result.directOwedByMe.size)
        assertEquals("alex", result.directOwedByMe.single().member.id)
        assertEquals(500, result.directOwedByMe.single().amountCents)

        assertEquals(1, result.directOwedToMe.size)
        assertEquals("tim", result.directOwedToMe.single().member.id)
        assertEquals(1_000, result.directOwedToMe.single().amountCents)
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
        assertEquals(listOf("dinner"), result.directOwedByMe.single().eventIds)
        assertEquals(listOf("Abendessen"), result.directOwedByMe.single().eventTitles)
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

    @Test
    fun `ongoing games are ignored in debt calculation until settled`() {
        val events = listOf(
            DebtEvent(
                id = "live-game",
                groupId = "friends",
                type = EventType.GAME,
                title = "Poker live",
                createdAt = Instant.parse("2026-05-09T12:00:00Z"),
                lines = emptyList(),
                gameMode = GameMode.POKER,
                gameSettled = false,
                gameEntries = listOf(
                    GameEntry(memberId = "julian", buyInCents = 1_000, cashOutCents = 0),
                    GameEntry(memberId = "alex", buyInCents = 1_000, cashOutCents = 0),
                ),
            ),
            DebtEvent(
                id = "direct",
                groupId = "friends",
                type = EventType.DIRECT,
                title = "Alex schuldet Julian",
                createdAt = Instant.parse("2026-05-09T13:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "alex", amountCents = -500),
                    LedgerLine(memberId = "julian", amountCents = 500),
                ),
            ),
        )

        val result = service.calculateSummary(events, members, "julian")

        assertEquals(500, result.summary.owedToMeCents)
        assertEquals(0, result.summary.owedByMeCents)
        assertEquals(1, result.directOwedToMe.size)
        assertEquals("alex", result.directOwedToMe.single().member.id)
    }

    @Test
    fun `provided real world dataset leaves only julian owing liam ten euros`() {
        val events = listOf(
            DebtEvent(
                id = "event-split-1778529868450",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.SPLIT,
                title = "Plane",
                description = "LiamRathai hat bezahlt · 4 Teilnehmer",
                createdAt = Instant.parse("2026-05-11T20:04:28Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-0346468e-a424-434f-abf6-fc29606e4ef6", amountCents = 6_000),
                    LedgerLine(memberId = "user-c773079f-7439-4af6-a06c-a0382b9e417d", amountCents = -2_000),
                    LedgerLine(memberId = "user-9da1e4ec-2dda-45cc-b448-79ac1b20d9e6", amountCents = -2_000),
                    LedgerLine(memberId = "user-0401c230-1173-47a8-a537-c456ac941af3", amountCents = -2_000),
                ),
            ),
            DebtEvent(
                id = "event-direct-1778608682772",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.DIRECT,
                title = "Burgerme",
                description = "Julian schuldet LiamRathai",
                createdAt = Instant.parse("2026-05-12T17:58:02Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-0346468e-a424-434f-abf6-fc29606e4ef6", amountCents = -1_000),
                    LedgerLine(memberId = "user-9da1e4ec-2dda-45cc-b448-79ac1b20d9e6", amountCents = 1_000),
                ),
            ),
            DebtEvent(
                id = "event-game-1778702003256",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.GAME,
                title = "Pokerabend",
                createdAt = Instant.parse("2026-05-13T19:53:23Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-0401c230-1173-47a8-a537-c456ac941af3", amountCents = -600),
                    LedgerLine(memberId = "user-0346468e-a424-434f-abf6-fc29606e4ef6", amountCents = 390),
                    LedgerLine(memberId = "user-9d65d34a-b25a-4467-840d-9dbcda773e08", amountCents = 5_210),
                    LedgerLine(memberId = "user-c773079f-7439-4af6-a06c-a0382b9e417d", amountCents = -5_000),
                ),
            ),
            DebtEvent(
                id = "event-payment-1778608759529",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.PAYMENT,
                title = "Zahlung",
                description = "Koskonrad hat LiamRathai bezahlt",
                createdAt = Instant.parse("2026-05-12T17:59:19Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-0401c230-1173-47a8-a537-c456ac941af3", amountCents = 2_000),
                    LedgerLine(memberId = "user-0346468e-a424-434f-abf6-fc29606e4ef6", amountCents = -2_000),
                ),
            ),
            DebtEvent(
                id = "event-payment-1778710250761",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.PAYMENT,
                title = "Zahlung",
                description = "Koskonrad hat Linus bezahlt",
                createdAt = Instant.parse("2026-05-13T22:10:50Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-0401c230-1173-47a8-a537-c456ac941af3", amountCents = 210),
                    LedgerLine(memberId = "user-9d65d34a-b25a-4467-840d-9dbcda773e08", amountCents = -210),
                ),
            ),
            DebtEvent(
                id = "event-payment-1778770884819",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.PAYMENT,
                title = "Bezahlt Paypal",
                description = "Zahlung",
                createdAt = Instant.parse("2026-05-14T15:01:24Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-c773079f-7439-4af6-a06c-a0382b9e417d", amountCents = 5_000),
                    LedgerLine(memberId = "user-9d65d34a-b25a-4467-840d-9dbcda773e08", amountCents = -5_000),
                ),
            ),
            DebtEvent(
                id = "event-payment-1778770922734",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.PAYMENT,
                title = "Bazahlt Überweisung",
                description = "Zahlung",
                createdAt = Instant.parse("2026-05-14T15:02:02Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-c773079f-7439-4af6-a06c-a0382b9e417d", amountCents = 2_000),
                    LedgerLine(memberId = "user-0346468e-a424-434f-abf6-fc29606e4ef6", amountCents = -2_000),
                ),
            ),
            DebtEvent(
                id = "event-payment-1778771224809",
                groupId = "group-934e710b-67aa-4588-8a27-9b05a7326974",
                type = EventType.PAYMENT,
                title = "Koskonrad hat Liam bezahlt",
                description = "Zahlung",
                createdAt = Instant.parse("2026-05-14T15:07:04Z"),
                lines = listOf(
                    LedgerLine(memberId = "user-0401c230-1173-47a8-a537-c456ac941af3", amountCents = 390),
                    LedgerLine(memberId = "user-0346468e-a424-434f-abf6-fc29606e4ef6", amountCents = -390),
                ),
            ),
        )

        val result = service.calculateSummary(
            events = events,
            members = listOf(
                Member(id = "user-0346468e-a424-434f-abf6-fc29606e4ef6", name = "Liam", initials = "L"),
                Member(id = "user-0401c230-1173-47a8-a537-c456ac941af3", name = "Koskonrad", initials = "K"),
                Member(id = "user-9d65d34a-b25a-4467-840d-9dbcda773e08", name = "Linus", initials = "L"),
                Member(id = "user-9da1e4ec-2dda-45cc-b448-79ac1b20d9e6", name = "Julian", initials = "J"),
                Member(id = "user-c773079f-7439-4af6-a06c-a0382b9e417d", name = "Matti", initials = "M"),
            ),
            currentUserId = "user-9d65d34a-b25a-4467-840d-9dbcda773e08",
        )

        assertEquals(0, result.summary.netCents)
        assertEquals(0, result.summary.owedByMeCents)
        assertEquals(0, result.summary.owedToMeCents)
        assertTrue(result.directOwedByMe.isEmpty())
        assertTrue(result.directOwedToMe.isEmpty())
        assertTrue(result.optimizedOwedByMe.isEmpty())
        assertTrue(result.optimizedOwedToMe.isEmpty())

        val julianView = service.calculateSummary(
            events = events,
            members = listOf(
                Member(id = "user-0346468e-a424-434f-abf6-fc29606e4ef6", name = "Liam", initials = "L"),
                Member(id = "user-0401c230-1173-47a8-a537-c456ac941af3", name = "Koskonrad", initials = "K"),
                Member(id = "user-9d65d34a-b25a-4467-840d-9dbcda773e08", name = "Linus", initials = "L"),
                Member(id = "user-9da1e4ec-2dda-45cc-b448-79ac1b20d9e6", name = "Julian", initials = "J"),
                Member(id = "user-c773079f-7439-4af6-a06c-a0382b9e417d", name = "Matti", initials = "M"),
            ),
            currentUserId = "user-9da1e4ec-2dda-45cc-b448-79ac1b20d9e6",
        )

        assertEquals(-1_000, julianView.summary.netCents)
        assertEquals(1_000, julianView.summary.owedByMeCents)
        assertEquals("user-0346468e-a424-434f-abf6-fc29606e4ef6", julianView.optimizedOwedByMe.single().member.id)
        assertEquals(1_000, julianView.optimizedOwedByMe.single().amountCents)
    }
}
