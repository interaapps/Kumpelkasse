package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.CurrentSessionToken
import de.interaapps.weowe.debt.auth.CurrentUser
import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventDateRange
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.CreateGroupRequest
import de.interaapps.weowe.debt.dto.DashboardResponse
import de.interaapps.weowe.debt.dto.EventPageResponse
import de.interaapps.weowe.debt.dto.GameHistoryResponse
import de.interaapps.weowe.debt.dto.InviteResponse
import de.interaapps.weowe.debt.dto.LoginRequest
import de.interaapps.weowe.debt.dto.LoginResponse
import de.interaapps.weowe.debt.dto.OidcLoginRequest
import de.interaapps.weowe.debt.dto.RegisterRequest
import de.interaapps.weowe.debt.dto.RelationshipHistoryResponse
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.dto.toResponse
import de.interaapps.weowe.debt.service.AccessControlService
import de.interaapps.weowe.debt.service.AuthFacade
import de.interaapps.weowe.debt.service.DashboardService
import de.interaapps.weowe.debt.service.DebtStore
import de.interaapps.weowe.debt.service.EventFeedService
import de.interaapps.weowe.debt.service.InsightsService
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
    private val eventFeedService: EventFeedService,
    private val accessControl: AccessControlService,
    private val insightsService: InsightsService,
    private val auth: AuthFacade,
) {
    @PostMapping("/auth/login")
    fun login(@Valid @RequestBody request: LoginRequest): LoginResponse = auth.login(request)

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest): LoginResponse = auth.register(request)

    @PostMapping("/auth/oidc/interaapps")
    fun loginWithInteraApps(@Valid @RequestBody request: OidcLoginRequest): LoginResponse =
        auth.loginWithInteraApps(request)

    @GetMapping("/auth/session")
    fun getSession(
        @CurrentUser currentUser: Member,
        @CurrentSessionToken sessionToken: String,
    ): LoginResponse = LoginResponse(sessionToken = sessionToken, currentUserId = currentUser.id, member = currentUser)

    @PostMapping("/auth/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(@CurrentSessionToken sessionToken: String) {
        auth.logout(sessionToken)
    }

    @GetMapping("/dashboard")
    fun getDashboard(
        @RequestParam(required = false) groupId: String?,
        @CurrentUser currentUser: Member,
    ): DashboardResponse = dashboardService.getDashboard(groupId, currentUser.id)

    @GetMapping("/events/{eventId}")
    fun getEvent(
        @PathVariable eventId: String,
        @CurrentUser currentUser: Member,
    ): DebtEvent = accessControl.requireAccessibleEvent(currentUser.id, eventId)

    @GetMapping("/events")
    fun getEvents(
        @RequestParam groupId: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false, name = "q") query: String?,
        @RequestParam(required = false) type: String?,
        @RequestParam(defaultValue = "false") mine: Boolean,
        @RequestParam(required = false) range: EventDateRange?,
        @CurrentUser currentUser: Member,
    ): EventPageResponse =
        eventFeedService.getEventPage(
            currentUser = currentUser,
            groupId = groupId,
            page = page,
            size = size,
            query = query,
            type = type?.let(EventType::from),
            mineOnly = mine,
            range = range,
        ).toResponse()

    @GetMapping("/members/{memberId}")
    fun getMember(
        @PathVariable memberId: String,
        @CurrentUser currentUser: Member,
    ): Member = accessControl.requireAccessibleMember(currentUser.id, memberId)

    @GetMapping("/groups/{groupId}/members")
    fun getGroupMembers(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): List<Member> {
        accessControl.requireGroupMember(currentUser.id, groupId)
        return store.getMembersForGroup(groupId)
    }

    @GetMapping("/groups/{groupId}/stats")
    fun getGroupStats(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ) = insightsService.getGroupStats(groupId, currentUser.id)

    @GetMapping("/groups/{groupId}/members/{memberId}/history")
    fun getRelationshipHistory(
        @PathVariable groupId: String,
        @PathVariable memberId: String,
        @CurrentUser currentUser: Member,
    ): RelationshipHistoryResponse =
        insightsService.getRelationshipHistory(groupId, currentUser.id, memberId).toResponse()

    @GetMapping("/groups/{groupId}/games/history")
    fun getGameHistory(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): GameHistoryResponse =
        insightsService.getGameHistory(groupId, currentUser.id).toResponse()

    @PostMapping("/groups")
    @ResponseStatus(HttpStatus.CREATED)
    fun createGroup(
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: CreateGroupRequest,
    ): Group = store.createGroup(currentUser.id, request)

    @PostMapping("/groups/{groupId}/join")
    fun joinGroup(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): Group = store.joinGroup(currentUser.id, groupId)

    @DeleteMapping("/groups/{groupId}/members/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leaveGroup(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ) {
        store.leaveGroup(currentUser.id, groupId)
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    fun createEvent(
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: UpsertDebtEventRequest,
    ): DebtEvent {
        accessControl.requireGroupMember(currentUser.id, request.groupId)
        return store.createEvent(request)
    }

    @PutMapping("/events/{eventId}")
    fun updateEvent(
        @PathVariable eventId: String,
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: UpsertDebtEventRequest,
    ): DebtEvent {
        accessControl.requireAccessibleEvent(currentUser.id, eventId)
        accessControl.requireGroupMember(currentUser.id, request.groupId)
        return store.updateEvent(eventId, request)
    }

    @DeleteMapping("/events/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteEvent(
        @PathVariable eventId: String,
        @CurrentUser currentUser: Member,
    ) {
        accessControl.requireAccessibleEvent(currentUser.id, eventId)
        store.deleteEvent(eventId)
    }

    @PatchMapping("/members/{memberId}")
    fun updateMember(
        @PathVariable memberId: String,
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: UpdateMemberRequest,
    ): Member {
        if (currentUser.id != memberId) {
            throw org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Only your own profile can be edited")
        }
        return store.updateMember(memberId, request)
    }

    @GetMapping("/invites/{groupId}")
    fun getInvite(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): InviteResponse {
        accessControl.requireGroupMember(currentUser.id, groupId)
        return dashboardService.getInvite(groupId)
    }
}
