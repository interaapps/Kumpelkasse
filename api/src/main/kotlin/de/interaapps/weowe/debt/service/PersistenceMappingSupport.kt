package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import java.time.Instant

internal fun UpsertDebtEventRequest.toDebtEvent(id: String): DebtEvent =
    DebtEvent(
        id = id,
        groupId = groupId,
        type = type,
        title = title.trim(),
        description = description.blankToNull(),
        createdAt = createdAt ?: Instant.now(),
        lines = lines,
        gameMode = gameMode,
        bankMemberId = bankMemberId.blankToNull(),
        splitTotalCents = splitTotalCents,
        splitParticipantIds = splitParticipantIds.distinct(),
        splitShares = splitShares,
        gameEntries = gameEntries,
        gameSettled = gameSettled,
        optimizedPaymentChains = optimizedPaymentChains,
    )

internal fun String?.blankToNull(): String? = this?.trim()?.takeIf { it.isNotEmpty() }

internal fun initialsFrom(name: String): String =
    name.trim()
        .split(Regex("\\s+"))
        .filter { it.isNotEmpty() }
        .take(2)
        .joinToString("") { it.first().uppercase() }
        .ifBlank { "?" }
