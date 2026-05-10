package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.EventDateRange
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Member
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset

@Service
class EventFeedService(
    private val store: DebtStore,
) {
    internal var clock: Clock = Clock.systemUTC()

    fun getEventPage(
        currentUser: Member,
        groupId: String,
        page: Int,
        size: Int,
        query: String?,
        type: EventType?,
        mineOnly: Boolean,
        range: EventDateRange?,
    ): EventPage {
        val knownGroup = store.getGroupsForMember(currentUser.id).any { it.id == groupId }
        if (!knownGroup) {
            throw org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN,
                "You are not part of this group",
            )
        }

        return store.getEventPageForGroup(
            groupId = groupId,
            page = page.coerceAtLeast(0),
            size = size.coerceIn(1, 50),
            query = query?.trim()?.takeIf { it.isNotEmpty() },
            type = type,
            memberId = currentUser.id.takeIf { mineOnly },
            createdAfter = resolveCreatedAfter(range),
        )
    }

    internal fun resolveCreatedAfter(range: EventDateRange?): Instant? {
        val now = Instant.now(clock)
        return when (range ?: EventDateRange.ALL) {
            EventDateRange.LAST_7_DAYS -> now.minusSeconds(7 * 24 * 60 * 60L)
            EventDateRange.LAST_30_DAYS -> now.minusSeconds(30 * 24 * 60 * 60L)
            EventDateRange.THIS_YEAR -> now.atZone(ZoneOffset.UTC).withDayOfYear(1).toInstant()
            EventDateRange.ALL -> null
        }
    }
}
