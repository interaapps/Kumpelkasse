package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.dto.DashboardResponse
import de.interaapps.weowe.debt.dto.InviteResponse
import de.interaapps.weowe.debt.domain.Summary
import org.springframework.stereotype.Service

@Service
class DashboardService(
    private val store: DebtStore,
    private val calculationService: DebtCalculationService,
) {
    fun getDashboard(groupId: String?, currentUserId: String): DashboardResponse {
        val groups = store.getGroupsForMember(currentUserId)
        if (groups.isEmpty()) {
            return DashboardResponse(
                currentUserId = currentUserId,
                selectedGroupId = null,
                inviteLink = null,
                groups = emptyList(),
                members = listOf(store.getMember(currentUserId)),
                events = emptyList(),
                summary = Summary(netCents = 0, owedByMeCents = 0, owedToMeCents = 0),
                owedByMe = emptyList(),
                owedToMe = emptyList(),
                optimizedTransfers = emptyList(),
            )
        }

        val selectedGroupId = groupId?.takeIf { candidate -> groups.any { it.id == candidate } } ?: groups.first().id
        val selectedGroup = store.getGroup(selectedGroupId)
        val members = store.getMembersForGroup(selectedGroup.id)
        val events = store.getEventsForGroup(selectedGroup.id)
        val calculation = calculationService.calculateSummary(events, members, currentUserId)

        return DashboardResponse(
            currentUserId = currentUserId,
            selectedGroupId = selectedGroup.id,
            inviteLink = inviteLinkFor(selectedGroup.id),
            groups = groups,
            members = members,
            events = events,
            summary = calculation.summary,
            owedByMe = calculation.owedByMe,
            owedToMe = calculation.owedToMe,
            optimizedTransfers = calculation.optimizedTransfers,
        )
    }

    fun getInvite(groupId: String): InviteResponse {
        store.getGroup(groupId)
        return InviteResponse(groupId = groupId, inviteLink = inviteLinkFor(groupId))
    }

    private fun inviteLinkFor(groupId: String): String =
        "https://owe.interaapps.de/invite/$groupId"
}
