package de.interaapps.weowe.debt.dto

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
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
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
    val optimizedTransfers: List<SettlementTransfer>,
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
)

data class InviteResponse(
    val groupId: String,
    val inviteLink: String,
)
