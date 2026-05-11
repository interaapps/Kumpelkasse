package de.interaapps.weowe.debt.persistence

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameEntry
import de.interaapps.weowe.debt.domain.GameMode
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.SplitShare
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import java.time.Instant

class DebtEntityMapperTest {
    @Test
    fun `split details rely on maps id instead of prefilled detached key`() {
        val event = DebtEvent(
            id = "event-split-1",
            groupId = "friends",
            type = EventType.SPLIT,
            title = "Pizza",
            createdAt = Instant.parse("2026-05-11T20:00:00Z"),
            lines = listOf(
                LedgerLine(memberId = "alex", amountCents = 500),
                LedgerLine(memberId = "julian", amountCents = -500),
            ),
            splitTotalCents = 1_000,
            splitParticipantIds = listOf("alex", "julian"),
            splitShares = listOf(
                SplitShare(memberId = "alex", amountCents = 500),
                SplitShare(memberId = "julian", amountCents = 500),
            ),
        )

        val entity = event.toEntity()

        assertNotNull(entity.splitDetails)
        assertNull(entity.splitDetails?.eventId)
        assertEquals(entity, entity.splitDetails?.event)
    }

    @Test
    fun `game details rely on maps id instead of prefilled detached key`() {
        val event = DebtEvent(
            id = "event-game-1",
            groupId = "friends",
            type = EventType.GAME,
            title = "Poker",
            createdAt = Instant.parse("2026-05-11T20:00:00Z"),
            lines = listOf(
                LedgerLine(memberId = "alex", amountCents = 500),
                LedgerLine(memberId = "julian", amountCents = -500),
            ),
            gameMode = GameMode.POKER,
            gameEntries = listOf(
                GameEntry(memberId = "alex", buyInCents = 1_000, cashOutCents = 1_500),
                GameEntry(memberId = "julian", buyInCents = 1_000, cashOutCents = 500),
            ),
        )

        val entity = event.toEntity()

        assertNotNull(entity.gameDetails)
        assertNull(entity.gameDetails?.eventId)
        assertEquals(entity, entity.gameDetails?.event)
    }
}
