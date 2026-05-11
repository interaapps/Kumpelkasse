package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.CurrentUser
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.InviteResponse
import de.interaapps.weowe.debt.service.AccessControlService
import de.interaapps.weowe.debt.service.DashboardService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/invites")
class InviteController(
    private val accessControl: AccessControlService,
    private val dashboardService: DashboardService,
) {
    @GetMapping("/{groupId}")
    fun getInvite(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): InviteResponse {
        accessControl.requireGroupMember(currentUser.id, groupId)
        return dashboardService.getInvite(groupId)
    }
}
