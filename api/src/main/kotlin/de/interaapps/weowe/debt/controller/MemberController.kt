package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.CurrentUser
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.service.AccessControlService
import de.interaapps.weowe.debt.service.DebtStore
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/members")
class MemberController(
    private val store: DebtStore,
    private val accessControl: AccessControlService,
) {
    @GetMapping("/{memberId}")
    fun getMember(
        @PathVariable memberId: String,
        @CurrentUser currentUser: Member,
    ): Member = accessControl.requireAccessibleMember(currentUser.id, memberId)

    @PatchMapping("/{memberId}")
    fun updateMember(
        @PathVariable memberId: String,
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: UpdateMemberRequest,
    ): Member {
        if (currentUser.id != memberId) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "Only your own profile can be edited")
        }
        return store.updateMember(memberId, request)
    }
}
