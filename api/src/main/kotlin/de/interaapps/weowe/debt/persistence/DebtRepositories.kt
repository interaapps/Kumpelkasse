package de.interaapps.weowe.debt.persistence

import org.springframework.data.jpa.repository.JpaRepository

interface DebtGroupRepository : JpaRepository<DebtGroupEntity, String>

interface MemberRepository : JpaRepository<MemberEntity, String>

interface DebtEventRepository : JpaRepository<DebtEventEntity, String> {
    fun findByGroupIdOrderByCreatedAtDesc(groupId: String): List<DebtEventEntity>
}
