package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.persistence.DebtGroupRepository
import de.interaapps.weowe.debt.persistence.GroupMemberRepository
import de.interaapps.weowe.debt.persistence.UserRepository
import de.interaapps.weowe.debt.persistence.toDomain
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class MemberPersistenceService(
    private val groupRepository: DebtGroupRepository,
    private val groupMemberRepository: GroupMemberRepository,
    private val userRepository: UserRepository,
) {
    @Transactional(readOnly = true)
    fun getMembersForGroup(groupId: String): List<Member> {
        getGroupOrThrow(groupId)
        return groupMemberRepository.findByGroupId(groupId)
            .mapNotNull { it.user?.toDomain() }
            .sortedBy { it.name.lowercase() }
    }

    @Transactional(readOnly = true)
    fun getMember(memberId: String): Member =
        userRepository.findById(memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: $memberId") }
            .toDomain()

    @Transactional
    fun updateMember(memberId: String, request: UpdateMemberRequest): Member {
        val existing = userRepository.findById(memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: $memberId") }

        existing.name = request.name.trim()
        request.email.blankToNull()?.lowercase()?.let { existing.email = it }
        existing.initials = request.initials?.takeIf { it.isNotBlank() } ?: initialsFrom(request.name)
        existing.paypalUrl = request.paypalUrl.blankToNull()
        existing.cashAppTag = request.cashAppTag.blankToNull()
        existing.venmoHandle = request.venmoHandle.blankToNull()
        existing.revolutHandle = request.revolutHandle.blankToNull()
        existing.wiseUrl = request.wiseUrl.blankToNull()
        existing.applePayContact = request.applePayContact.blankToNull()
        existing.bankDetails = request.bankDetails.blankToNull()
        existing.note = request.note.blankToNull()
        existing.notificationsEnabled = request.notificationsEnabled ?: existing.notificationsEnabled
        existing.notificationHour = request.notificationHour?.coerceIn(0, 23) ?: existing.notificationHour
        existing.backgroundRefreshEnabled = request.backgroundRefreshEnabled ?: existing.backgroundRefreshEnabled

        return userRepository.save(existing).toDomain()
    }

    private fun getGroupOrThrow(groupId: String) {
        if (!groupRepository.existsById(groupId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found: $groupId")
        }
    }
}
