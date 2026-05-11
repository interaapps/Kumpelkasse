package de.interaapps.weowe.debt.domain

data class MemberStat(
    val member: Member,
    val amountCents: Long,
    val eventCount: Int,
)

data class GroupStats(
    val totalEvents: Int,
    val totalVolumeCents: Long,
    val activeMembers: Int,
    val biggestCreditor: MemberStat? = null,
    val biggestDebtor: MemberStat? = null,
    val mostActiveMember: MemberStat? = null,
    val biggestGameWinner: MemberStat? = null,
    val biggestGameLoser: MemberStat? = null,
    val splitEventCount: Int = 0,
    val paymentEventCount: Int = 0,
    val gameEventCount: Int = 0,
)

data class RelationshipSummary(
    val otherMember: Member,
    val eventCount: Int,
    val netCents: Long,
    val youOweCents: Long,
    val owesYouCents: Long,
)

data class RelationshipHistory(
    val summary: RelationshipSummary,
    val events: List<DebtEvent>,
)

data class GameHistory(
    val leaderboard: List<MemberStat>,
    val events: List<DebtEvent>,
)
