package de.interaapps.weowe.debt.persistence

import org.springframework.data.jpa.repository.JpaRepository

interface DebtGroupRepository : JpaRepository<DebtGroupEntity, String>

interface UserRepository : JpaRepository<UserEntity, String> {
    fun findByEmailIgnoreCase(email: String): UserEntity?
    fun findByInteraAppsSubject(interaAppsSubject: String): UserEntity?
}

interface DebtEventRepository : JpaRepository<DebtEventEntity, String> {
    fun findByGroupIdOrderByCreatedAtDesc(groupId: String): List<DebtEventEntity>
}

interface GroupMemberRepository : JpaRepository<GroupMemberEntity, Long> {
    fun findByUserId(userId: String): List<GroupMemberEntity>
    fun findByGroupId(groupId: String): List<GroupMemberEntity>
    fun existsByGroupIdAndUserId(groupId: String, userId: String): Boolean
    fun deleteByGroupIdAndUserId(groupId: String, userId: String)
}

interface UserSessionRepository : JpaRepository<UserSessionEntity, String> {
    fun findByToken(token: String): UserSessionEntity?
}
