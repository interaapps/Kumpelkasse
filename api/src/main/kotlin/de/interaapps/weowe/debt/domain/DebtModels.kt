package de.interaapps.weowe.debt.domain

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue
import java.time.Instant

enum class EventType(private val wireName: String) {
    DIRECT("direct"),
    SPLIT("split"),
    SINGLE("single"),
    GAME("game"),
    PAYMENT("payment");

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

data class Group(
    val id: String,
    val name: String,
)

data class Member(
    val id: String,
    val name: String,
    val initials: String,
    val email: String? = null,
    val avatarUrl: String? = null,
    val paypalUrl: String? = null,
    val cashAppTag: String? = null,
    val venmoHandle: String? = null,
    val revolutHandle: String? = null,
    val wiseUrl: String? = null,
    val applePayContact: String? = null,
    val bankDetails: String? = null,
    val note: String? = null,
    val notificationsEnabled: Boolean = false,
    val notificationHour: Int = 20,
    val backgroundRefreshEnabled: Boolean = false,
)

data class SettlementRow(
    val member: Member,
    val amountCents: Long,
    val eventCount: Int,
)

data class SettlementTransfer(
    val from: Member,
    val to: Member,
    val amountCents: Long,
    val eventCount: Int,
    val fromBalanceCents: Long,
    val toBalanceCents: Long,
    val explanationLines: List<SettlementExplanationLine> = emptyList(),
)

data class SettlementExplanationLine(
    val eventId: String,
    val eventTitle: String,
    val member: Member,
    val amountCents: Long,
)

data class Summary(
    val netCents: Long,
    val owedByMeCents: Long,
    val owedToMeCents: Long,
)

data class MemberStat(
    val member: Member,
    val amountCents: Long,
    val eventCount: Int,
)

data class GroupStats(
    val totalEvents: Int,
    val totalVolumeCents: Long,
    val activeMembers: Int,
    val biggestCreditor: MemberStat? = null,
    val biggestDebtor: MemberStat? = null,
    val mostActiveMember: MemberStat? = null,
    val biggestGameWinner: MemberStat? = null,
    val biggestGameLoser: MemberStat? = null,
    val splitEventCount: Int = 0,
    val paymentEventCount: Int = 0,
    val gameEventCount: Int = 0,
)

data class RelationshipSummary(
    val otherMember: Member,
    val eventCount: Int,
    val netCents: Long,
    val youOweCents: Long,
    val owesYouCents: Long,
)

data class RelationshipHistory(
    val summary: RelationshipSummary,
    val events: List<DebtEvent>,
)

data class GameHistory(
    val leaderboard: List<MemberStat>,
    val events: List<DebtEvent>,
)
