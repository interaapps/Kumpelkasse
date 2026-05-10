package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Member
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class AccessControlService(
    private val store: DebtStore,
) {
    fun requireGroupMember(userId: String, groupId: String) {
        if (store.getGroupsForMember(userId).none { it.id == groupId }) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You are not part of this group")
        }
    }

    fun requireAccessibleEvent(userId: String, eventId: String): DebtEvent {
        val event = store.getEvent(eventId)
        requireGroupMember(userId, event.groupId)
        return event
    }

    fun requireAccessibleMember(userId: String, memberId: String): Member {
        val member = store.getMember(memberId)
        if (userId == memberId) {
            return member
        }

        val currentUserGroupIds = store.getGroupsForMember(userId).map { it.id }.toSet()
        val targetUserGroupIds = store.getGroupsForMember(memberId).map { it.id }.toSet()
        if (currentUserGroupIds.intersect(targetUserGroupIds).isEmpty()) {
            throw ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this profile")
        }

        return member
    }
}
