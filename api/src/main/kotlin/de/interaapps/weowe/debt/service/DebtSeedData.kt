package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import java.time.Instant

object DebtSeedData {
    const val CURRENT_USER_ID = "julian"

    val groups = listOf(
        Group(id = "friends", name = "Freundesgruppe 1"),
        Group(id = "wg", name = "WG"),
        Group(id = "poker", name = "Pokerabend"),
        Group(id = "spain", name = "Urlaub Spanien"),
    )

    val members = listOf(
        Member(
            id = "julian",
            name = "Julian",
            initials = "J",
            paypalUrl = "paypal.me/julian",
            cashAppTag = "\$julian",
            revolutHandle = "@julian",
            wiseUrl = "wise.com/pay/me/julian",
            applePayContact = "+49 151 12345678",
            bankDetails = "DE89 3704 0044 0532 0130 00",
            note = "Am liebsten Paypal oder Uberweisung.",
        ),
        Member(id = "matti", name = "Matti", initials = "M", paypalUrl = "paypal.me/matti", revolutHandle = "@matti"),
        Member(id = "max", name = "Max", initials = "M", cashAppTag = "\$max", venmoHandle = "@max"),
        Member(id = "tim", name = "Tim", initials = "T"),
        Member(
            id = "alex",
            name = "Alex",
            initials = "A",
            paypalUrl = "paypal.me/alex",
            wiseUrl = "wise.com/pay/me/alex",
            bankDetails = "DE12 1002 0500 0000 1234 56",
        ),
        Member(id = "jonas", name = "Jonas", initials = "J"),
    )

    val events = listOf(
        DebtEvent(
            id = "event-poker-1",
            groupId = "friends",
            type = EventType.GAME,
            title = "Pokerabend",
            description = "Julian +20€, Tim -20€",
            createdAt = Instant.parse("2026-05-09T22:15:00Z"),
            lines = listOf(
                LedgerLine(memberId = "julian", amountCents = 2_000),
                LedgerLine(memberId = "tim", amountCents = -2_000),
                LedgerLine(memberId = "matti", amountCents = -1_000),
                LedgerLine(memberId = "jonas", amountCents = 1_000),
            ),
        ),
        DebtEvent(
            id = "event-food-1",
            groupId = "friends",
            type = EventType.SPLIT,
            title = "Burgerme Bestellung",
            description = "Max hat bezahlt · 4 Teilnehmer",
            createdAt = Instant.parse("2026-05-09T19:40:00Z"),
            lines = listOf(
                LedgerLine(memberId = "max", amountCents = 5_400),
                LedgerLine(memberId = "julian", amountCents = -1_800),
                LedgerLine(memberId = "matti", amountCents = -1_800),
                LedgerLine(memberId = "tim", amountCents = -1_800),
            ),
        ),
        DebtEvent(
            id = "event-direct-1",
            groupId = "friends",
            type = EventType.DIRECT,
            title = "Matti schuldet dir",
            description = "Direkte Schuld",
            createdAt = Instant.parse("2026-05-08T16:20:00Z"),
            lines = listOf(
                LedgerLine(memberId = "julian", amountCents = 3_200),
                LedgerLine(memberId = "matti", amountCents = -3_200),
            ),
        ),
        DebtEvent(
            id = "event-small-1",
            groupId = "friends",
            type = EventType.PAYMENT,
            title = "Kleine Zahlung",
            description = "Julian hat Alex bezahlt",
            createdAt = Instant.parse("2026-05-07T12:05:00Z"),
            lines = listOf(
                LedgerLine(memberId = "julian", amountCents = 1_000),
                LedgerLine(memberId = "alex", amountCents = -1_000),
            ),
        ),
        DebtEvent(
            id = "event-wg-1",
            groupId = "wg",
            type = EventType.SPLIT,
            title = "Wocheneinkauf",
            description = "Julian hat bezahlt · WG Split",
            createdAt = Instant.parse("2026-05-06T18:10:00Z"),
            lines = listOf(
                LedgerLine(memberId = "julian", amountCents = 4_500),
                LedgerLine(memberId = "max", amountCents = -2_250),
                LedgerLine(memberId = "alex", amountCents = -2_250),
            ),
        ),
        DebtEvent(
            id = "event-poker-group-1",
            groupId = "poker",
            type = EventType.GAME,
            title = "Cash Game",
            description = "Tim +80€, Jonas -80€",
            createdAt = Instant.parse("2026-05-05T23:30:00Z"),
            lines = listOf(
                LedgerLine(memberId = "tim", amountCents = 8_000),
                LedgerLine(memberId = "jonas", amountCents = -8_000),
            ),
        ),
        DebtEvent(
            id = "event-spain-1",
            groupId = "spain",
            type = EventType.SPLIT,
            title = "Tapas Abend",
            description = "Jonas hat bezahlt · 5 Teilnehmer",
            createdAt = Instant.parse("2026-05-04T21:00:00Z"),
            lines = listOf(
                LedgerLine(memberId = "jonas", amountCents = 12_400),
                LedgerLine(memberId = "julian", amountCents = -3_100),
                LedgerLine(memberId = "matti", amountCents = -3_100),
                LedgerLine(memberId = "tim", amountCents = -3_100),
                LedgerLine(memberId = "alex", amountCents = -3_100),
            ),
        ),
    )
}
