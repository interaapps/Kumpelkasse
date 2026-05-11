package de.interaapps.weowe.debt.domain

data class SettlementRow(
    val member: Member,
    val amountCents: Long,
    val eventCount: Int,
)

data class SettlementTransfer(
    val from: Member,
    val to: Member,
    val amountCents: Long,
    val eventCount: Int,
    val fromBalanceCents: Long,
    val toBalanceCents: Long,
    val explanationLines: List<SettlementExplanationLine> = emptyList(),
)

data class SettlementExplanationLine(
    val eventId: String,
    val eventTitle: String,
    val member: Member,
    val amountCents: Long,
)

data class Summary(
    val netCents: Long,
    val owedByMeCents: Long,
    val owedToMeCents: Long,
)
