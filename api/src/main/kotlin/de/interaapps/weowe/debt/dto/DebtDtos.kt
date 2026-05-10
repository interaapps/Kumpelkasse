package de.interaapps.weowe.debt.dto

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameHistory
import de.interaapps.weowe.debt.domain.GameMode
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.GroupStats
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.domain.RelationshipHistory
import de.interaapps.weowe.debt.domain.SettlementRow
import de.interaapps.weowe.debt.domain.SettlementTransfer
import de.interaapps.weowe.debt.domain.Summary
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import java.time.Instant

data class DashboardResponse(
    val currentUserId: String,
    val selectedGroupId: String?,
    val inviteLink: String?,
    val groups: List<Group>,
    val members: List<Member>,
    val events: List<DebtEvent>,
    val summary: Summary,
    val stats: GroupStats,
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
    val optimizedTransfers: List<SettlementTransfer>,
)

data class RelationshipHistoryResponse(
    val summary: de.interaapps.weowe.debt.domain.RelationshipSummary,
    val events: List<DebtEvent>,
)

data class GameHistoryResponse(
    val leaderboard: List<de.interaapps.weowe.debt.domain.MemberStat>,
    val events: List<DebtEvent>,
)

data class EventPageResponse(
    val items: List<DebtEvent>,
    val page: Int,
    val size: Int,
    val totalCount: Long,
    val hasMore: Boolean,
)

data class LoginRequest(
    @field:NotBlank
    val email: String,
    @field:NotBlank
    val password: String,
)

data class RegisterRequest(
    @field:NotBlank
    val email: String,
    @field:NotBlank
    val password: String,
    @field:NotBlank
    val name: String,
)

data class OidcLoginRequest(
    @field:NotBlank
    val code: String,
    @field:NotBlank
    val redirectUri: String,
    @field:NotBlank
    val codeVerifier: String,
)

data class LoginResponse(
    val sessionToken: String,
    val currentUserId: String,
    val member: Member,
)

data class CreateGroupRequest(
    @field:NotBlank
    val name: String,
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
    @field:NotEmpty
    val lines: List<LedgerLine>,
    val gameMode: GameMode? = null,
    val bankMemberId: String? = null,
)

data class UpdateMemberRequest(
    @field:NotBlank
    val name: String,
    val email: String? = null,
    val initials: String? = null,
    val paypalUrl: String? = null,
    val cashAppTag: String? = null,
    val venmoHandle: String? = null,
    val revolutHandle: String? = null,
    val wiseUrl: String? = null,
    val applePayContact: String? = null,
    val bankDetails: String? = null,
    val note: String? = null,
    val notificationsEnabled: Boolean? = null,
    val notificationHour: Int? = null,
    val backgroundRefreshEnabled: Boolean? = null,
)

data class InviteResponse(
    val groupId: String,
    val inviteLink: String,
)

fun EventPage.toResponse(): EventPageResponse =
    EventPageResponse(
        items = items,
        page = page,
        size = size,
        totalCount = totalCount,
        hasMore = hasMore,
    )

fun RelationshipHistory.toResponse(): RelationshipHistoryResponse =
    RelationshipHistoryResponse(summary = summary, events = events)

fun GameHistory.toResponse(): GameHistoryResponse =
    GameHistoryResponse(leaderboard = leaderboard, events = events)
