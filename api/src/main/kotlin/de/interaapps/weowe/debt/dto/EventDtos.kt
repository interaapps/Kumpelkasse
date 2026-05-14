package de.interaapps.weowe.debt.dto

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameEntry
import de.interaapps.weowe.debt.domain.GameMode
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.OptimizedPaymentChain
import de.interaapps.weowe.debt.domain.SplitShare
import jakarta.validation.constraints.NotBlank
import java.time.Instant

data class EventPageResponse(
    val items: List<DebtEvent>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
    val hasMore: Boolean,
)

data class UpsertDebtEventRequest(
    val id: String? = null,
    @field:NotBlank
    val groupId: String,
    val type: EventType,
    @field:NotBlank
    val title: String,
    val description: String? = null,
    val createdAt: Instant? = null,
    val lines: List<LedgerLine>,
    val gameMode: GameMode? = null,
    val bankMemberId: String? = null,
    val splitTotalCents: Long? = null,
    val splitParticipantIds: List<String> = emptyList(),
    val splitShares: List<SplitShare> = emptyList(),
    val gameEntries: List<GameEntry> = emptyList(),
    val gameSettled: Boolean = true,
    val optimizedPaymentChains: List<OptimizedPaymentChain> = emptyList(),
)

fun EventPage.toResponse(): EventPageResponse =
    EventPageResponse(
        items = items,
        page = page,
        size = size,
        totalCount = totalCount,
        hasMore = hasMore,
    )
