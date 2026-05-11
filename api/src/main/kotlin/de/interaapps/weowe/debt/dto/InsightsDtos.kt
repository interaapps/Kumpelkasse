package de.interaapps.weowe.debt.dto

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.GameHistory
import de.interaapps.weowe.debt.domain.MemberStat
import de.interaapps.weowe.debt.domain.RelationshipHistory
import de.interaapps.weowe.debt.domain.RelationshipSummary

data class RelationshipHistoryResponse(
    val summary: RelationshipSummary,
    val events: List<DebtEvent>,
)

data class GameHistoryResponse(
    val leaderboard: List<MemberStat>,
    val events: List<DebtEvent>,
)

fun RelationshipHistory.toResponse(): RelationshipHistoryResponse =
    RelationshipHistoryResponse(summary = summary, events = events)

fun GameHistory.toResponse(): GameHistoryResponse =
    GameHistoryResponse(leaderboard = leaderboard, events = events)
