package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameHistory
import de.interaapps.weowe.debt.domain.GroupStats
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.domain.MemberStat
import de.interaapps.weowe.debt.domain.RelationshipHistory
import de.interaapps.weowe.debt.domain.RelationshipSummary
import org.springframework.stereotype.Service
import kotlin.math.abs

@Service
class InsightsService(
    private val store: DebtStore,
    private val accessControl: AccessControlService,
) {
    fun getGroupStats(groupId: String, currentUserId: String): GroupStats {
        accessControl.requireGroupMember(currentUserId, groupId)
        val members = store.getMembersForGroup(groupId)
        val events = store.getEventsForGroup(groupId)
        return calculateGroupStats(events, members)
    }

    fun getRelationshipHistory(groupId: String, currentUserId: String, otherMemberId: String): RelationshipHistory {
        accessControl.requireGroupMember(currentUserId, groupId)
        val otherMember = accessControl.requireAccessibleMember(currentUserId, otherMemberId)
        val events = store.getEventsForGroup(groupId)
            .filter { event ->
                val memberIds = event.lines.map { it.memberId }.toSet()
                currentUserId in memberIds && otherMemberId in memberIds
            }

        var netCents = 0L
        var youOweCents = 0L
        var owesYouCents = 0L
        events.forEach { event ->
            val yourLine = event.lines.firstOrNull { it.memberId == currentUserId }?.amountCents ?: 0
            val otherLine = event.lines.firstOrNull { it.memberId == otherMemberId }?.amountCents ?: 0
            netCents += yourLine
            if (yourLine < 0 && otherLine > 0) {
                youOweCents += minOf(abs(yourLine), otherLine)
            }
            if (yourLine > 0 && otherLine < 0) {
                owesYouCents += minOf(yourLine, abs(otherLine))
            }
        }

        return RelationshipHistory(
            summary = RelationshipSummary(
                otherMember = otherMember,
                eventCount = events.size,
                netCents = netCents,
                youOweCents = youOweCents,
                owesYouCents = owesYouCents,
            ),
            events = events.sortedByDescending { it.createdAt },
        )
    }

    fun getGameHistory(groupId: String, currentUserId: String): GameHistory {
        accessControl.requireGroupMember(currentUserId, groupId)
        val members = store.getMembersForGroup(groupId)
        val games = store.getEventsForGroup(groupId)
            .filter { it.type == EventType.GAME }
            .sortedByDescending { it.createdAt }
        val memberMap = members.associateBy { it.id }
        val totals = mutableMapOf<String, Long>()
        val counts = mutableMapOf<String, Int>()

        games.forEach { event ->
            event.lines.forEach { line ->
                if (memberMap.containsKey(line.memberId)) {
                    totals[line.memberId] = (totals[line.memberId] ?: 0L) + line.amountCents
                    counts[line.memberId] = (counts[line.memberId] ?: 0) + 1
                }
            }
        }

        val leaderboard = totals.entries
            .mapNotNull { (memberId, amountCents) ->
                memberMap[memberId]?.let { member ->
                    MemberStat(member = member, amountCents = amountCents, eventCount = counts[memberId] ?: 0)
                }
            }
            .sortedByDescending { it.amountCents }

        return GameHistory(
            leaderboard = leaderboard,
            events = games,
        )
    }

    private fun calculateGroupStats(events: List<DebtEvent>, members: List<Member>): GroupStats {
        val memberMap = members.associateBy { it.id }
        val balances = mutableMapOf<String, Long>()
        val eventCounts = mutableMapOf<String, Int>()
        val gameBalances = mutableMapOf<String, Long>()
        var totalVolume = 0L

        events.forEach { event ->
            totalVolume += event.lines.filter { it.amountCents > 0 }.sumOf { it.amountCents }
            val involvedIds = event.lines.map { it.memberId }.distinct()
            involvedIds.forEach { memberId ->
                eventCounts[memberId] = (eventCounts[memberId] ?: 0) + 1
            }

            event.lines.forEach { line ->
                balances[line.memberId] = (balances[line.memberId] ?: 0L) + line.amountCents
                if (event.type == EventType.GAME) {
                    gameBalances[line.memberId] = (gameBalances[line.memberId] ?: 0L) + line.amountCents
                }
            }
        }

        fun statFor(memberId: String?, amount: Long?, sourceCounts: Map<String, Int>): MemberStat? {
            if (memberId == null || amount == null) {
                return null
            }
            val member = memberMap[memberId] ?: return null
            return MemberStat(member = member, amountCents = amount, eventCount = sourceCounts[memberId] ?: 0)
        }

        val biggestCreditorEntry = balances.maxByOrNull { it.value }
        val biggestDebtorEntry = balances.minByOrNull { it.value }
        val mostActiveEntry = eventCounts.maxByOrNull { it.value }
        val biggestGameWinnerEntry = gameBalances.maxByOrNull { it.value }
        val biggestGameLoserEntry = gameBalances.minByOrNull { it.value }

        return GroupStats(
            totalEvents = events.size,
            totalVolumeCents = totalVolume,
            activeMembers = eventCounts.keys.size,
            biggestCreditor = biggestCreditorEntry?.takeIf { it.value > 0 }?.let { statFor(it.key, it.value, eventCounts) },
            biggestDebtor = biggestDebtorEntry?.takeIf { it.value < 0 }?.let { statFor(it.key, abs(it.value), eventCounts) },
            mostActiveMember = mostActiveEntry?.let { statFor(it.key, it.value.toLong(), eventCounts) },
            biggestGameWinner = biggestGameWinnerEntry?.takeIf { it.value > 0 }?.let { statFor(it.key, it.value, eventCounts) },
            biggestGameLoser = biggestGameLoserEntry?.takeIf { it.value < 0 }?.let { statFor(it.key, abs(it.value), eventCounts) },
            splitEventCount = events.count { it.type == EventType.SPLIT },
            paymentEventCount = events.count { it.type == EventType.PAYMENT },
            gameEventCount = events.count { it.type == EventType.GAME },
        )
    }
}
