package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.CurrentUser
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.DashboardResponse
import de.interaapps.weowe.debt.service.DashboardService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class DashboardController(
    private val dashboardService: DashboardService,
) {
    @GetMapping("/dashboard")
    fun getDashboard(
        @RequestParam(required = false) groupId: String?,
        @CurrentUser currentUser: Member,
    ): DashboardResponse = dashboardService.getDashboard(groupId, currentUser.id)
}
