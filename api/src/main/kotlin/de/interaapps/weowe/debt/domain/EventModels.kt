package de.interaapps.weowe.debt.domain

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue
import java.time.Instant

enum class EventType(private val wireName: String) {
    DIRECT("direct"),
    SPLIT("split"),
    SINGLE("single"),
    GAME("game"),
    PAYMENT("payment"),
    OPTIMIZED_PAYMENT("optimized_payment");

    @JsonValue
    fun toJson(): String = wireName

    companion object {
        @JsonCreator
        @JvmStatic
        fun from(value: String): EventType =
            entries.firstOrNull { it.wireName == value.lowercase() }
                ?: throw IllegalArgumentException("Unknown event type: $value")
    }
}

enum class GameMode(private val wireName: String) {
    POKER("poker"),
    BANK("bank");

    @JsonValue
    fun toJson(): String = wireName

    companion object {
        @JsonCreator
        @JvmStatic
        fun from(value: String): GameMode =
            entries.firstOrNull { it.wireName == value.lowercase() }
                ?: throw IllegalArgumentException("Unknown game mode: $value")
    }
}

data class LedgerLine(
    val memberId: String,
    val amountCents: Long,
)

data class SplitShare(
    val memberId: String,
    val amountCents: Long,
)

data class GameEntry(
    val memberId: String,
    val buyInCents: Long,
    val cashOutCents: Long,
)

data class OptimizedPaymentChain(
    val memberIds: List<String>,
    val amountCents: Long,
    val eventIds: List<String> = emptyList(),
    val eventTitles: List<String> = emptyList(),
)

data class DebtEvent(
    val id: String,
    val groupId: String,
    val type: EventType,
    val title: String,
    val description: String? = null,
    val createdAt: Instant,
    val lines: List<LedgerLine>,
    val gameMode: GameMode? = null,
    val bankMemberId: String? = null,
    val splitTotalCents: Long? = null,
    val splitParticipantIds: List<String> = emptyList(),
    val splitShares: List<SplitShare> = emptyList(),
    val gameEntries: List<GameEntry> = emptyList(),
    val optimizedPaymentChains: List<OptimizedPaymentChain> = emptyList(),
)

data class EventPage(
    val items: List<DebtEvent>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
    val hasMore: Boolean,
)

enum class EventDateRange {
    LAST_7_DAYS,
    LAST_30_DAYS,
    THIS_YEAR,
    ALL,
}
