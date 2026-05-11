package de.interaapps.weowe.debt.persistence

import de.interaapps.weowe.debt.domain.EventType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant

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
        @Param("type") type: EventType?,
        @Param("memberId") memberId: String?,
        @Param("createdAfter") createdAfter: Instant?,
        pageable: Pageable,
    ): Page<DebtEventEntity>
}
