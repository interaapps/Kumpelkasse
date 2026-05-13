package de.interaapps.weowe.debt.dto

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.GroupStats
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.domain.SettlementRow
import de.interaapps.weowe.debt.domain.SettlementTransfer
import de.interaapps.weowe.debt.domain.Summary

data class DashboardResponse(
    val currentUserId: String,
    val selectedGroupId: String?,
    val inviteLink: String?,
    val groups: List<Group>,
    val members: List<Member>,
    val events: List<DebtEvent>,
    val summary: Summary,
    val stats: GroupStats,
    val directOwedByMe: List<SettlementRow>,
    val directOwedToMe: List<SettlementRow>,
    val optimizedOwedByMe: List<SettlementRow>,
    val optimizedOwedToMe: List<SettlementRow>,
    val owedByMe: List<SettlementRow>,
    val owedToMe: List<SettlementRow>,
    val optimizedTransfers: List<SettlementTransfer>,
)
