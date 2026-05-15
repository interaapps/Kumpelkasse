package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameEntry
import de.interaapps.weowe.debt.domain.GameMode
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.persistence.DebtEventEntity
import de.interaapps.weowe.debt.persistence.DebtEventGameDetailsEntity
import de.interaapps.weowe.debt.persistence.DebtEventRepository
import de.interaapps.weowe.debt.persistence.GroupMemberEntity
import de.interaapps.weowe.debt.persistence.GroupMemberRepository
import de.interaapps.weowe.debt.persistence.UserEntity
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.doAnswer
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.time.Instant
import java.util.Optional

class EventPersistenceServiceTest {
    @Test
    fun `updating a game persists the settled flag`() {
        val groupQueries = mock(GroupPersistenceService::class.java)
        val eventRepository = mock(DebtEventRepository::class.java)
        val groupMemberRepository = mock(GroupMemberRepository::class.java)

        val existing = DebtEventEntity(
            id = "game-1",
            groupId = "friends",
            type = EventType.GAME,
            title = "Pokerabend",
            createdAt = Instant.parse("2026-05-15T10:00:00Z"),
        ).apply {
            gameDetails = DebtEventGameDetailsEntity(
                event = this,
                gameMode = GameMode.POKER,
                settled = false,
            )
        }

        `when`(groupQueries.getGroup("friends")).thenReturn(Group(id = "friends", name = "Friends"))
        `when`(eventRepository.findById("game-1")).thenReturn(Optional.of(existing))
        doAnswer { it.arguments[0] }.`when`(eventRepository).save(existing)
        `when`(groupMemberRepository.findByGroupId("friends")).thenReturn(
            listOf(
                GroupMemberEntity(user = UserEntity(id = "alex", name = "Alex", initials = "A", email = "a@example.com", passwordHash = "x")),
                GroupMemberEntity(user = UserEntity(id = "julian", name = "Julian", initials = "J", email = "j@example.com", passwordHash = "x")),
            ),
        )

        val service = EventPersistenceService(groupQueries, eventRepository, groupMemberRepository)

        assertFalse(existing.gameDetails?.settled ?: true)

        service.updateEvent(
            "game-1",
            UpsertDebtEventRequest(
                groupId = "friends",
                type = EventType.GAME,
                title = "Pokerabend",
                createdAt = Instant.parse("2026-05-15T10:00:00Z"),
                lines = listOf(
                    LedgerLine(memberId = "alex", amountCents = 500),
                    LedgerLine(memberId = "julian", amountCents = -500),
                ),
                gameMode = GameMode.POKER,
                gameSettled = true,
                gameEntries = listOf(
                    GameEntry(memberId = "alex", buyInCents = 1_000, cashOutCents = 1_500),
                    GameEntry(memberId = "julian", buyInCents = 1_000, cashOutCents = 500),
                ),
            ),
        )

        assertTrue(existing.gameDetails?.settled ?: false)
    }
}
