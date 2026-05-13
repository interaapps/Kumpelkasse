package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.domain.OptimizedPaymentChain
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
        val balances = calculateBalances(events)
        val directTransfers = calculateDirectTransfers(events)
        val optimizedTransfers = calculateOptimizedTransfers(events, members, balances, directTransfers)
        val directRows = toUserRows(currentUserId, directTransfers, members)
        val optimizedRows = toUserRows(currentUserId, optimizedTransfers.map { it.toPartyTransfer() }, members)
        val currentBalance = balances[currentUserId] ?: 0L

        return DashboardCalculation(
            summary = Summary(
                netCents = currentBalance,
                owedByMeCents = if (currentBalance < 0) abs(currentBalance) else 0,
                owedToMeCents = if (currentBalance > 0) currentBalance else 0,
            ),
            directOwedByMe = directRows.owedByMe,
            directOwedToMe = directRows.owedToMe,
            optimizedOwedByMe = optimizedRows.owedByMe,
            optimizedOwedToMe = optimizedRows.owedToMe,
            optimizedTransfers = optimizedTransfers,
        )
    }

    fun calculateSettlements(
        events: List<DebtEvent>,
        members: List<Member>,
        currentUserId: String,
    ): Settlements {
        val balances = calculateBalances(events)
        val directTransfers = calculateDirectTransfers(events)
        val optimizedTransfers = calculateOptimizedTransfers(events, members, balances, directTransfers)
        val directRows = toUserRows(currentUserId, directTransfers, members)
        val optimizedRows = toUserRows(currentUserId, optimizedTransfers.map { it.toPartyTransfer() }, members)

        return Settlements(
            directOwedByMe = directRows.owedByMe,
            directOwedToMe = directRows.owedToMe,
            optimizedOwedByMe = optimizedRows.owedByMe,
            optimizedOwedToMe = optimizedRows.owedToMe,
            optimizedTransfers = optimizedTransfers,
        )
    }

    private fun calculateBalances(events: List<DebtEvent>): Map<String, Long> =
        buildMap {
            events.forEach { event ->
                event.lines.forEach { line ->
                    put(line.memberId, (get(line.memberId) ?: 0L) + line.amountCents)
                }
            }
        }

    private fun calculateDirectTransfers(events: List<DebtEvent>): List<DirectTransfer> {
        val aggregated = linkedMapOf<Pair<String, String>, MutableDirectTransfer>()

        events.forEach { event ->
            val debtors = event.lines
                .filter { it.amountCents < 0 }
                .map { MutablePartyBalance(it.memberId, abs(it.amountCents)) }
                .sortedWith(compareByDescending<MutablePartyBalance> { it.amountCents }.thenBy { it.memberId })
                .toMutableList()
            val creditors = event.lines
                .filter { it.amountCents > 0 }
                .map { MutablePartyBalance(it.memberId, it.amountCents) }
                .sortedWith(compareByDescending<MutablePartyBalance> { it.amountCents }.thenBy { it.memberId })
                .toMutableList()
            var debtorIndex = 0
            var creditorIndex = 0

            while (debtorIndex < debtors.size && creditorIndex < creditors.size) {
                val debtor = debtors[debtorIndex]
                val creditor = creditors[creditorIndex]
                val amount = minOf(debtor.amountCents, creditor.amountCents)
                val key = debtor.memberId to creditor.memberId
                val transfer = aggregated.getOrPut(key) {
                    MutableDirectTransfer(
                        fromMemberId = debtor.memberId,
                        toMemberId = creditor.memberId,
                    )
                }
                transfer.amountCents += amount
                transfer.eventIds += event.id
                transfer.eventTitles += event.title

                debtor.amountCents -= amount
                creditor.amountCents -= amount
                if (debtor.amountCents == 0L) debtorIndex += 1
                if (creditor.amountCents == 0L) creditorIndex += 1
            }
        }

        val pairwiseNet = linkedMapOf<Set<String>, MutableDirectTransfer>()

        aggregated.values
            .map { it.toImmutable() }
            .filter { it.amountCents > 0 }
            .forEach { transfer ->
                val pairKey = setOf(transfer.fromMemberId, transfer.toMemberId)
                val existing = pairwiseNet[pairKey]
                if (existing == null) {
                    pairwiseNet[pairKey] = MutableDirectTransfer(
                        fromMemberId = transfer.fromMemberId,
                        toMemberId = transfer.toMemberId,
                        amountCents = transfer.amountCents,
                        eventIds = transfer.eventIds.toMutableSet(),
                        eventTitles = transfer.eventTitles.toMutableSet(),
                    )
                    return@forEach
                }

                if (existing.fromMemberId == transfer.fromMemberId && existing.toMemberId == transfer.toMemberId) {
                    existing.amountCents += transfer.amountCents
                } else {
                    existing.amountCents -= transfer.amountCents
                    if (existing.amountCents < 0) {
                        existing.amountCents = abs(existing.amountCents)
                        val previousFrom = existing.fromMemberId
                        existing.fromMemberId = existing.toMemberId
                        existing.toMemberId = previousFrom
                    }
                }
                existing.eventIds += transfer.eventIds
                existing.eventTitles += transfer.eventTitles
            }

        return pairwiseNet.values
            .filter { it.amountCents > 0 }
            .map { it.toImmutable() }
            .sortedWith(
                compareByDescending<DirectTransfer> { it.amountCents }
                    .thenBy { it.fromMemberId }
                    .thenBy { it.toMemberId },
            )
    }

    private fun calculateOptimizedTransfers(
        events: List<DebtEvent>,
        members: List<Member>,
        balances: Map<String, Long>,
        directTransfers: List<DirectTransfer>,
    ): List<SettlementTransfer> {
        val memberMap = members.associateBy { it.id }
        val accumulators = buildAccumulators(events, memberMap)
        val debtors = balances.entries
            .filter { it.value < 0 && memberMap[it.key] != null }
            .map {
                OpenBalance(
                    memberId = it.key,
                    amountCents = abs(it.value),
                    originalBalanceCents = it.value,
                    eventIds = accumulators[it.key]?.eventIds ?: emptySet(),
                    explanationLines = accumulators[it.key]?.explanationLines ?: emptyList(),
                )
            }
            .sortedWith(compareByDescending<OpenBalance> { it.amountCents }.thenBy { it.memberId })
            .toMutableList()
        val creditors = balances.entries
            .filter { it.value > 0 && memberMap[it.key] != null }
            .map {
                OpenBalance(
                    memberId = it.key,
                    amountCents = it.value,
                    originalBalanceCents = it.value,
                    eventIds = accumulators[it.key]?.eventIds ?: emptySet(),
                    explanationLines = accumulators[it.key]?.explanationLines ?: emptyList(),
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
            val routeChains = findRouteChains(
                fromMemberId = debtor.memberId,
                toMemberId = creditor.memberId,
                amountCents = amountCents,
                directTransfers = directTransfers,
            )

            transfers += SettlementTransfer(
                from = memberMap.getValue(debtor.memberId),
                to = memberMap.getValue(creditor.memberId),
                amountCents = amountCents,
                eventCount = (debtor.eventIds + creditor.eventIds).size,
                fromBalanceCents = debtor.originalBalanceCents,
                toBalanceCents = creditor.originalBalanceCents,
                explanationLines = (debtor.explanationLines + creditor.explanationLines).sortedBy { it.eventTitle },
                routeChains = routeChains,
            )

            debtor.amountCents -= amountCents
            creditor.amountCents -= amountCents
            if (debtor.amountCents == 0L) debtorIndex += 1
            if (creditor.amountCents == 0L) creditorIndex += 1
        }

        return transfers.sortedByDescending { it.amountCents }
    }

    private fun buildAccumulators(
        events: List<DebtEvent>,
        memberMap: Map<String, Member>,
    ): Map<String, SettlementAccumulator> {
        val accumulators = mutableMapOf<String, SettlementAccumulator>()
        events.forEach { event ->
            event.lines.forEach { line ->
                val accumulator = accumulators.getOrPut(line.memberId) { SettlementAccumulator() }
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
        return accumulators
    }

    private fun toUserRows(
        currentUserId: String,
        transfers: List<PartyTransfer>,
        members: List<Member>,
    ): UserSettlementRows {
        val memberMap = members.associateBy { it.id }
        val owedByMe = mutableListOf<SettlementRow>()
        val owedToMe = mutableListOf<SettlementRow>()

        transfers.forEach { transfer ->
            if (transfer.fromMemberId == currentUserId) {
                memberMap[transfer.toMemberId]?.let { member ->
                    owedByMe += SettlementRow(
                        member = member,
                        amountCents = transfer.amountCents,
                        eventCount = transfer.eventIds.size,
                    )
                }
            }
            if (transfer.toMemberId == currentUserId) {
                memberMap[transfer.fromMemberId]?.let { member ->
                    owedToMe += SettlementRow(
                        member = member,
                        amountCents = transfer.amountCents,
                        eventCount = transfer.eventIds.size,
                    )
                }
            }
        }

        return UserSettlementRows(
            owedByMe = owedByMe.sortedByDescending { it.amountCents },
            owedToMe = owedToMe.sortedByDescending { it.amountCents },
        )
    }

    private fun findRouteChains(
        fromMemberId: String,
        toMemberId: String,
        amountCents: Long,
        directTransfers: List<DirectTransfer>,
    ): List<OptimizedPaymentChain> {
        val residualEdges = directTransfers
            .associateBy { it.fromMemberId to it.toMemberId }
            .mapValues { (_, transfer) ->
                MutableResidualEdge(
                    fromMemberId = transfer.fromMemberId,
                    toMemberId = transfer.toMemberId,
                    amountCents = transfer.amountCents,
                    eventIds = transfer.eventIds.toMutableSet(),
                    eventTitles = transfer.eventTitles.toMutableSet(),
                )
            }
            .toMutableMap()

        val chains = mutableListOf<OptimizedPaymentChain>()
        var remaining = amountCents

        while (remaining > 0) {
            val path = findResidualPath(fromMemberId, toMemberId, residualEdges) ?: break
            val transferable = minOf(remaining, path.minOf { it.amountCents })
            val memberIds = buildList {
                add(path.first().fromMemberId)
                path.forEach { add(it.toMemberId) }
            }
            val eventIds = linkedSetOf<String>()
            val eventTitles = linkedSetOf<String>()
            path.forEach { edge ->
                edge.amountCents -= transferable
                eventIds += edge.eventIds
                eventTitles += edge.eventTitles
            }
            chains += OptimizedPaymentChain(
                memberIds = memberIds,
                amountCents = transferable,
                eventIds = eventIds.toList(),
                eventTitles = eventTitles.toList(),
            )
            residualEdges.entries.removeIf { it.value.amountCents == 0L }
            remaining -= transferable
        }

        return chains
    }

    private fun findResidualPath(
        fromMemberId: String,
        toMemberId: String,
        residualEdges: Map<Pair<String, String>, MutableResidualEdge>,
    ): List<MutableResidualEdge>? {
        if (fromMemberId == toMemberId) {
            return emptyList()
        }

        val queue = ArrayDeque<String>()
        val visited = mutableSetOf(fromMemberId)
        val previous = mutableMapOf<String, MutableResidualEdge>()
        queue.add(fromMemberId)

        while (queue.isNotEmpty()) {
            val current = queue.removeFirst()
            if (current == toMemberId) {
                break
            }

            residualEdges.values
                .filter { it.fromMemberId == current && it.amountCents > 0 }
                .sortedWith(compareBy<MutableResidualEdge> { it.toMemberId })
                .forEach { edge ->
                    if (visited.add(edge.toMemberId)) {
                        previous[edge.toMemberId] = edge
                        queue.add(edge.toMemberId)
                    }
                }
        }

        if (!visited.contains(toMemberId)) {
            return null
        }

        val path = mutableListOf<MutableResidualEdge>()
        var cursor = toMemberId
        while (cursor != fromMemberId) {
            val edge = previous[cursor] ?: return null
            path += edge
            cursor = edge.fromMemberId
        }

        return path.asReversed()
    }
}

data class DashboardCalculation(
    val summary: Summary,
    val directOwedByMe: List<SettlementRow>,
    val directOwedToMe: List<SettlementRow>,
    val optimizedOwedByMe: List<SettlementRow>,
    val optimizedOwedToMe: List<SettlementRow>,
    val optimizedTransfers: List<SettlementTransfer>,
)

data class Settlements(
    val directOwedByMe: List<SettlementRow>,
    val directOwedToMe: List<SettlementRow>,
    val optimizedOwedByMe: List<SettlementRow>,
    val optimizedOwedToMe: List<SettlementRow>,
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

private data class MutablePartyBalance(
    val memberId: String,
    var amountCents: Long,
)

private data class MutableDirectTransfer(
    var fromMemberId: String,
    var toMemberId: String,
    var amountCents: Long = 0,
    val eventIds: MutableSet<String> = linkedSetOf(),
    val eventTitles: MutableSet<String> = linkedSetOf(),
) {
    fun toImmutable(): DirectTransfer =
        DirectTransfer(
            fromMemberId = fromMemberId,
            toMemberId = toMemberId,
            amountCents = amountCents,
            eventIds = eventIds.toSet(),
            eventTitles = eventTitles.toSet(),
        )
}

private interface PartyTransfer {
    val fromMemberId: String
    val toMemberId: String
    val amountCents: Long
    val eventIds: Set<String>
}

private data class DirectTransfer(
    override val fromMemberId: String,
    override val toMemberId: String,
    override val amountCents: Long,
    override val eventIds: Set<String>,
    val eventTitles: Set<String>,
) : PartyTransfer

private data class UserSettlementRows(
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
)

private data class MutableResidualEdge(
    val fromMemberId: String,
    val toMemberId: String,
    var amountCents: Long,
    val eventIds: MutableSet<String>,
    val eventTitles: MutableSet<String>,
)

private val SettlementTransfer.eventIds: Set<String>
    get() = explanationLines.mapTo(linkedSetOf()) { it.eventId }

private fun SettlementTransfer.toPartyTransfer(): PartyTransfer =
    object : PartyTransfer {
        override val fromMemberId: String = from.id
        override val toMemberId: String = to.id
        override val amountCents: Long = this@toPartyTransfer.amountCents
        override val eventIds: Set<String> = this@toPartyTransfer.eventIds
    }
