package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.CreateGroupRequest
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class JpaDebtStore(
    private val groupPersistence: GroupPersistenceService,
    private val memberPersistence: MemberPersistenceService,
    private val eventPersistence: EventPersistenceService,
) : DebtStore {
    override fun getGroupsForMember(memberId: String): List<Group> = groupPersistence.getGroupsForMember(memberId)
    override fun createGroup(ownerMemberId: String, request: CreateGroupRequest): Group = groupPersistence.createGroup(ownerMemberId, request)
    override fun joinGroup(memberId: String, groupId: String): Group = groupPersistence.joinGroup(memberId, groupId)
    override fun leaveGroup(memberId: String, groupId: String) = groupPersistence.leaveGroup(memberId, groupId)
    override fun getMembersForGroup(groupId: String): List<Member> = memberPersistence.getMembersForGroup(groupId)
    override fun getMember(memberId: String): Member = memberPersistence.getMember(memberId)
    override fun getGroup(groupId: String): Group = groupPersistence.getGroup(groupId)
    override fun getEvent(eventId: String): DebtEvent = eventPersistence.getEvent(eventId)
    override fun getEventsForGroup(groupId: String): List<DebtEvent> = eventPersistence.getEventsForGroup(groupId)

    override fun getEventPageForGroup(
        groupId: String,
        page: Int,
        size: Int,
        query: String?,
        type: EventType?,
        memberId: String?,
        createdAfter: Instant?,
    ): EventPage = eventPersistence.getEventPageForGroup(groupId, page, size, query, type, memberId, createdAfter)

    override fun createEvent(request: UpsertDebtEventRequest): DebtEvent = eventPersistence.createEvent(request)
    override fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent = eventPersistence.updateEvent(eventId, request)
    override fun deleteEvent(eventId: String) = eventPersistence.deleteEvent(eventId)
    override fun updateMember(memberId: String, request: UpdateMemberRequest): Member = memberPersistence.updateMember(memberId, request)
}
