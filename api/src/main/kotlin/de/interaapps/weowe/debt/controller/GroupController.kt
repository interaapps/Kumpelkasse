package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.CurrentUser
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.CreateGroupRequest
import de.interaapps.weowe.debt.dto.GameHistoryResponse
import de.interaapps.weowe.debt.dto.RelationshipHistoryResponse
import de.interaapps.weowe.debt.dto.toResponse
import de.interaapps.weowe.debt.service.AccessControlService
import de.interaapps.weowe.debt.service.DebtStore
import de.interaapps.weowe.debt.service.InsightsService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/groups")
class GroupController(
    private val store: DebtStore,
    private val accessControl: AccessControlService,
    private val insightsService: InsightsService,
) {
    @GetMapping("/{groupId}/members")
    fun getGroupMembers(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): List<Member> {
        accessControl.requireGroupMember(currentUser.id, groupId)
        return store.getMembersForGroup(groupId)
    }

    @GetMapping("/{groupId}/stats")
    fun getGroupStats(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ) = insightsService.getGroupStats(groupId, currentUser.id)

    @GetMapping("/{groupId}/members/{memberId}/history")
    fun getRelationshipHistory(
        @PathVariable groupId: String,
        @PathVariable memberId: String,
        @CurrentUser currentUser: Member,
    ): RelationshipHistoryResponse =
        insightsService.getRelationshipHistory(groupId, currentUser.id, memberId).toResponse()

    @GetMapping("/{groupId}/games/history")
    fun getGameHistory(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): GameHistoryResponse =
        insightsService.getGameHistory(groupId, currentUser.id).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createGroup(
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: CreateGroupRequest,
    ): Group = store.createGroup(currentUser.id, request)

    @PostMapping("/{groupId}/join")
    fun joinGroup(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ): Group = store.joinGroup(currentUser.id, groupId)

    @DeleteMapping("/{groupId}/members/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun leaveGroup(
        @PathVariable groupId: String,
        @CurrentUser currentUser: Member,
    ) {
        store.leaveGroup(currentUser.id, groupId)
    }
}
