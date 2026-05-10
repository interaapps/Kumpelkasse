package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.domain.SettlementRow
import de.interaapps.weowe.debt.domain.Summary
import org.springframework.stereotype.Service
import kotlin.math.abs
import kotlin.math.roundToLong

@Service
class DebtCalculationService {
    fun calculateSummary(
        events: List<DebtEvent>,
        members: List<Member>,
        currentUserId: String,
    ): DashboardCalculation {
        val settlements = calculateSettlements(events, members, currentUserId)
        val owedByMeCents = settlements.owedByMe.sumOf { it.amountCents }
        val owedToMeCents = settlements.owedToMe.sumOf { it.amountCents }

        return DashboardCalculation(
            summary = Summary(
                netCents = owedToMeCents - owedByMeCents,
                owedByMeCents = owedByMeCents,
                owedToMeCents = owedToMeCents,
            ),
            owedByMe = settlements.owedByMe,
            owedToMe = settlements.owedToMe,
        )
    }

    fun calculateSettlements(
        events: List<DebtEvent>,
        members: List<Member>,
        currentUserId: String,
    ): Settlements {
        val memberMap = members.associateBy { it.id }
        val owedByMe = mutableMapOf<String, SettlementAccumulator>()
        val owedToMe = mutableMapOf<String, SettlementAccumulator>()

        events.forEach { event ->
            val currentUserAmount = event.amountFor(currentUserId)

            if (currentUserAmount < 0) {
                val totalPositive = event.lines
                    .filter { it.amountCents > 0 }
                    .sumOf { it.amountCents }

                event.lines
                    .filter { it.memberId != currentUserId && it.amountCents > 0 && totalPositive > 0 }
                    .forEach { line ->
                        val amountCents = ((line.amountCents.toDouble() / totalPositive) * abs(currentUserAmount)).roundToLong()
                        owedByMe.add(line.memberId, amountCents, event.id)
                    }
            }

            if (currentUserAmount > 0) {
                val totalNegative = event.lines
                    .filter { it.amountCents < 0 }
                    .sumOf { abs(it.amountCents) }

                event.lines
                    .filter { it.memberId != currentUserId && it.amountCents < 0 && totalNegative > 0 }
                    .forEach { line ->
                        val amountCents = ((abs(line.amountCents).toDouble() / totalNegative) * currentUserAmount).roundToLong()
                        owedToMe.add(line.memberId, amountCents, event.id)
                    }
            }
        }

        return netSettlements(owedByMe, owedToMe, memberMap)
    }

    private fun DebtEvent.amountFor(memberId: String): Long =
        lines.firstOrNull { it.memberId == memberId }?.amountCents ?: 0

    private fun MutableMap<String, SettlementAccumulator>.add(memberId: String, amountCents: Long, eventId: String) {
        val current = getOrPut(memberId) { SettlementAccumulator() }
        current.amountCents += amountCents
        current.eventIds += eventId
    }

    private fun netSettlements(
        owedByMe: Map<String, SettlementAccumulator>,
        owedToMe: Map<String, SettlementAccumulator>,
        memberMap: Map<String, Member>,
    ): Settlements {
        val owedByMeRows = mutableListOf<SettlementRow>()
        val owedToMeRows = mutableListOf<SettlementRow>()
        val memberIds = owedByMe.keys + owedToMe.keys

        memberIds.forEach { memberId ->
            val member = memberMap[memberId] ?: return@forEach
            val byMe = owedByMe[memberId]
            val toMe = owedToMe[memberId]
            val netCents = (toMe?.amountCents ?: 0) - (byMe?.amountCents ?: 0)
            val eventCount = ((byMe?.eventIds ?: emptySet()) + (toMe?.eventIds ?: emptySet())).size

            if (netCents > 0) {
                owedToMeRows += SettlementRow(member = member, amountCents = netCents, eventCount = eventCount)
            }

            if (netCents < 0) {
                owedByMeRows += SettlementRow(member = member, amountCents = abs(netCents), eventCount = eventCount)
            }
        }

        return Settlements(
            owedByMe = owedByMeRows.sortedByDescending { it.amountCents },
            owedToMe = owedToMeRows.sortedByDescending { it.amountCents },
        )
    }
}

data class DashboardCalculation(
    val summary: Summary,
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
)

data class Settlements(
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
)

private data class SettlementAccumulator(
    var amountCents: Long = 0,
    val eventIds: MutableSet<String> = mutableSetOf(),
)
