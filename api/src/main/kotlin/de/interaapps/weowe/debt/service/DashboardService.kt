package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.dto.DashboardResponse
import de.interaapps.weowe.debt.dto.InviteResponse
import org.springframework.stereotype.Service

@Service
class DashboardService(
    private val store: DebtStore,
    private val calculationService: DebtCalculationService,
) {
    fun getDashboard(groupId: String?, currentUserId: String): DashboardResponse {
        val groups = store.getGroups()
        val selectedGroupId = groupId ?: groups.first().id
        val selectedGroup = store.getGroup(selectedGroupId)
        val members = store.getMembers()
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
        )
    }

    fun getInvite(groupId: String): InviteResponse {
        store.getGroup(groupId)
        return InviteResponse(groupId = groupId, inviteLink = inviteLinkFor(groupId))
    }

    private fun inviteLinkFor(groupId: String): String =
        "https://wir-schulden.app/invite/$groupId"
}
