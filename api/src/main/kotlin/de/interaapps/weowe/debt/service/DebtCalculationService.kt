package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.domain.SettlementExplanationLine
import de.interaapps.weowe.debt.domain.SettlementRow
import de.interaapps.weowe.debt.domain.SettlementTransfer
import de.interaapps.weowe.debt.domain.Summary
import org.springframework.stereotype.Service
import kotlin.math.abs

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
            optimizedTransfers = settlements.optimizedTransfers,
        )
    }

    fun calculateSettlements(
        events: List<DebtEvent>,
        members: List<Member>,
        currentUserId: String,
    ): Settlements {
        val transfers = calculateOptimizedTransfers(events, members)
        val owedByMeRows = mutableListOf<SettlementRow>()
        val owedToMeRows = mutableListOf<SettlementRow>()

        transfers.forEach { transfer ->
            if (transfer.from.id == currentUserId) {
                owedByMeRows += SettlementRow(
                    member = transfer.to,
                    amountCents = transfer.amountCents,
                    eventCount = transfer.eventCount,
                )
            }
            if (transfer.to.id == currentUserId) {
                owedToMeRows += SettlementRow(
                    member = transfer.from,
                    amountCents = transfer.amountCents,
                    eventCount = transfer.eventCount,
                )
            }
        }

        return Settlements(
            owedByMe = owedByMeRows.sortedByDescending { it.amountCents },
            owedToMe = owedToMeRows.sortedByDescending { it.amountCents },
            optimizedTransfers = transfers,
        )
    }

    private fun calculateOptimizedTransfers(events: List<DebtEvent>, members: List<Member>): List<SettlementTransfer> {
        val memberMap = members.associateBy { it.id }
        val balances = mutableMapOf<String, SettlementAccumulator>()

        events.forEach { event ->
            event.lines.forEach { line ->
                val accumulator = balances.getOrPut(line.memberId) { SettlementAccumulator() }
                accumulator.amountCents += line.amountCents
                accumulator.eventIds += event.id
                memberMap[line.memberId]?.let { member ->
                    accumulator.explanationLines += SettlementExplanationLine(
                        eventId = event.id,
                        eventTitle = event.title,
                        member = member,
                        amountCents = line.amountCents,
                    )
                }
            }
        }

        val debtors = balances
            .filter { it.value.amountCents < 0 && memberMap[it.key] != null }
            .map {
                OpenBalance(
                    memberId = it.key,
                    amountCents = abs(it.value.amountCents),
                    originalBalanceCents = it.value.amountCents,
                    eventIds = it.value.eventIds.toSet(),
                    explanationLines = it.value.explanationLines,
                )
            }
            .sortedWith(compareByDescending<OpenBalance> { it.amountCents }.thenBy { it.memberId })
            .toMutableList()
        val creditors = balances
            .filter { it.value.amountCents > 0 && memberMap[it.key] != null }
            .map {
                OpenBalance(
                    memberId = it.key,
                    amountCents = it.value.amountCents,
                    originalBalanceCents = it.value.amountCents,
                    eventIds = it.value.eventIds.toSet(),
                    explanationLines = it.value.explanationLines,
                )
            }
            .sortedWith(compareByDescending<OpenBalance> { it.amountCents }.thenBy { it.memberId })
            .toMutableList()
        val transfers = mutableListOf<SettlementTransfer>()
        var debtorIndex = 0
        var creditorIndex = 0

        while (debtorIndex < debtors.size && creditorIndex < creditors.size) {
            val debtor = debtors[debtorIndex]
            val creditor = creditors[creditorIndex]
            val amountCents = minOf(debtor.amountCents, creditor.amountCents)

            transfers += SettlementTransfer(
                from = memberMap.getValue(debtor.memberId),
                to = memberMap.getValue(creditor.memberId),
                amountCents = amountCents,
                eventCount = (debtor.eventIds + creditor.eventIds).size,
                fromBalanceCents = debtor.originalBalanceCents,
                toBalanceCents = creditor.originalBalanceCents,
                explanationLines = (debtor.explanationLines + creditor.explanationLines).sortedBy { it.eventTitle },
            )

            debtor.amountCents -= amountCents
            creditor.amountCents -= amountCents
            if (debtor.amountCents == 0L) debtorIndex += 1
            if (creditor.amountCents == 0L) creditorIndex += 1
        }

        return transfers.sortedByDescending { it.amountCents }
    }
}

data class DashboardCalculation(
    val summary: Summary,
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
    val optimizedTransfers: List<SettlementTransfer>,
)

data class Settlements(
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
    val optimizedTransfers: List<SettlementTransfer>,
)

private data class SettlementAccumulator(
    var amountCents: Long = 0,
    val eventIds: MutableSet<String> = mutableSetOf(),
    val explanationLines: MutableList<SettlementExplanationLine> = mutableListOf(),
)

private data class OpenBalance(
    val memberId: String,
    var amountCents: Long,
    val originalBalanceCents: Long,
    val eventIds: Set<String>,
    val explanationLines: List<SettlementExplanationLine>,
)
