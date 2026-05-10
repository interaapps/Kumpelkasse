package de.interaapps.weowe.debt.persistence

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface DebtGroupRepository : JpaRepository<DebtGroupEntity, String>

interface UserRepository : JpaRepository<UserEntity, String> {
    fun findByEmailIgnoreCase(email: String): UserEntity?
    fun findByInteraAppsSubject(interaAppsSubject: String): UserEntity?
}

interface DebtEventRepository : JpaRepository<DebtEventEntity, String> {
    fun findByGroupIdOrderByCreatedAtDesc(groupId: String): List<DebtEventEntity>

    @Query(
        value = """
            select e from DebtEventEntity e
            where e.groupId = :groupId
              and (:type is null or e.type = :type)
              and (:queryText is null or lower(e.title) like lower(concat('%', :queryText, '%'))
                or lower(coalesce(e.description, '')) like lower(concat('%', :queryText, '%')))
              and (:memberId is null or exists (
                select line.id from LedgerLineEntity line
                where line.event = e and line.memberId = :memberId
              ))
              and (:createdAfter is null or e.createdAt >= :createdAfter)
            order by e.createdAt desc
        """,
        countQuery = """
            select count(e) from DebtEventEntity e
            where e.groupId = :groupId
              and (:type is null or e.type = :type)
              and (:queryText is null or lower(e.title) like lower(concat('%', :queryText, '%'))
                or lower(coalesce(e.description, '')) like lower(concat('%', :queryText, '%')))
              and (:memberId is null or exists (
                select line.id from LedgerLineEntity line
                where line.event = e and line.memberId = :memberId
              ))
              and (:createdAfter is null or e.createdAt >= :createdAfter)
        """,
    )
    fun searchGroupEvents(
        @Param("groupId") groupId: String,
        @Param("queryText") queryText: String?,
        @Param("type") type: de.interaapps.weowe.debt.domain.EventType?,
        @Param("memberId") memberId: String?,
        @Param("createdAfter") createdAfter: java.time.Instant?,
        pageable: Pageable,
    ): Page<DebtEventEntity>
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
