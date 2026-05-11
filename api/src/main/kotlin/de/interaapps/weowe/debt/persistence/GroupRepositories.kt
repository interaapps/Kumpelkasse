package de.interaapps.weowe.debt.persistence

import org.springframework.data.jpa.repository.JpaRepository

interface DebtGroupRepository : JpaRepository<DebtGroupEntity, String>

interface GroupMemberRepository : JpaRepository<GroupMemberEntity, Long> {
    fun findByUserId(userId: String): List<GroupMemberEntity>
    fun findByGroupId(groupId: String): List<GroupMemberEntity>
    fun existsByGroupIdAndUserId(groupId: String, userId: String): Boolean
    fun deleteByGroupIdAndUserId(groupId: String, userId: String)
}
