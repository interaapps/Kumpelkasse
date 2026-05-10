package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.CreateGroupRequest
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import java.time.Instant

interface DebtStore {
    fun getGroupsForMember(memberId: String): List<Group>
    fun createGroup(ownerMemberId: String, request: CreateGroupRequest): Group
    fun joinGroup(memberId: String, groupId: String): Group
    fun leaveGroup(memberId: String, groupId: String)
    fun getMembersForGroup(groupId: String): List<Member>
    fun getMember(memberId: String): Member
    fun getGroup(groupId: String): Group
    fun getEvent(eventId: String): DebtEvent
    fun getEventsForGroup(groupId: String): List<DebtEvent>
    fun getEventPageForGroup(
        groupId: String,
        page: Int,
        size: Int,
        query: String?,
        type: EventType?,
        memberId: String?,
        createdAfter: Instant?,
    ): EventPage
    fun createEvent(request: UpsertDebtEventRequest): DebtEvent
    fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent
    fun deleteEvent(eventId: String)
    fun updateMember(memberId: String, request: UpdateMemberRequest): Member
}
