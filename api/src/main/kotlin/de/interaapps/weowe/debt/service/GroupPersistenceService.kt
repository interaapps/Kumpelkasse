package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.dto.CreateGroupRequest
import de.interaapps.weowe.debt.persistence.DebtGroupEntity
import de.interaapps.weowe.debt.persistence.DebtGroupRepository
import de.interaapps.weowe.debt.persistence.GroupMemberEntity
import de.interaapps.weowe.debt.persistence.GroupMemberRepository
import de.interaapps.weowe.debt.persistence.UserRepository
import de.interaapps.weowe.debt.persistence.toDomain
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class GroupPersistenceService(
    private val groupRepository: DebtGroupRepository,
    private val userRepository: UserRepository,
    private val groupMemberRepository: GroupMemberRepository,
) {
    @Transactional(readOnly = true)
    fun getGroupsForMember(memberId: String): List<Group> {
        getMemberEntity(memberId)
        return groupMemberRepository.findByUserId(memberId)
            .mapNotNull { it.group?.toDomain() }
            .sortedBy { it.name.lowercase() }
    }

    @Transactional
    fun createGroup(ownerMemberId: String, request: CreateGroupRequest): Group {
        val owner = getMemberEntity(ownerMemberId)
        val group = groupRepository.save(
            DebtGroupEntity(
                id = "group-${UUID.randomUUID()}",
                name = request.name.trim(),
            ),
        )
        groupMemberRepository.save(GroupMemberEntity(group = group, user = owner))
        return group.toDomain()
    }

    @Transactional
    fun joinGroup(memberId: String, groupId: String): Group {
        val user = getMemberEntity(memberId)
        val group = getGroupEntity(groupId)
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, memberId)) {
            groupMemberRepository.save(GroupMemberEntity(group = group, user = user))
        }
        return group.toDomain()
    }

    @Transactional
    fun leaveGroup(memberId: String, groupId: String) {
        getGroup(groupId)
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, memberId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Group membership not found")
        }
        groupMemberRepository.deleteByGroupIdAndUserId(groupId, memberId)
    }

    @Transactional(readOnly = true)
    fun getGroup(groupId: String): Group = getGroupEntity(groupId).toDomain()

    private fun getGroupEntity(groupId: String) =
        groupRepository.findById(groupId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found: $groupId") }

    private fun getMemberEntity(memberId: String) =
        userRepository.findById(memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: $memberId") }
}
