package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.DashboardResponse
import de.interaapps.weowe.debt.dto.InviteResponse
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.service.DashboardService
import de.interaapps.weowe.debt.service.DebtSeedData
import de.interaapps.weowe.debt.service.DebtStore
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class DebtController(
    private val store: DebtStore,
    private val dashboardService: DashboardService,
) {
    @GetMapping("/dashboard")
    fun getDashboard(
        @RequestParam(required = false) groupId: String?,
        @RequestParam(defaultValue = DebtSeedData.CURRENT_USER_ID) currentUserId: String,
    ): DashboardResponse = dashboardService.getDashboard(groupId, currentUserId)

    @GetMapping("/events/{eventId}")
    fun getEvent(@PathVariable eventId: String): DebtEvent = store.getEvent(eventId)

    @GetMapping("/members")
    fun getMembers(): List<Member> = store.getMembers()

    @GetMapping("/members/{memberId}")
    fun getMember(@PathVariable memberId: String): Member = store.getMember(memberId)

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    fun createEvent(@Valid @RequestBody request: UpsertDebtEventRequest): DebtEvent =
        store.createEvent(request)

    @PutMapping("/events/{eventId}")
    fun updateEvent(
        @PathVariable eventId: String,
        @Valid @RequestBody request: UpsertDebtEventRequest,
    ): DebtEvent = store.updateEvent(eventId, request)

    @DeleteMapping("/events/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteEvent(@PathVariable eventId: String) {
        store.deleteEvent(eventId)
    }

    @PatchMapping("/members/{memberId}")
    fun updateMember(
        @PathVariable memberId: String,
        @Valid @RequestBody request: UpdateMemberRequest,
    ): Member = store.updateMember(memberId, request)

    @GetMapping("/invites/{groupId}")
    fun getInvite(@PathVariable groupId: String): InviteResponse = dashboardService.getInvite(groupId)
}
