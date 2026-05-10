package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest

interface DebtStore {
    fun getGroups(): List<Group>
    fun getMembers(): List<Member>
    fun getMember(memberId: String): Member
    fun getGroup(groupId: String): Group
    fun getEvent(eventId: String): DebtEvent
    fun getEventsForGroup(groupId: String): List<DebtEvent>
    fun createEvent(request: UpsertDebtEventRequest): DebtEvent
    fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent
    fun deleteEvent(eventId: String)
    fun updateMember(memberId: String, request: UpdateMemberRequest): Member
}
