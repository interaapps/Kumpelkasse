package de.interaapps.weowe.debt.persistence

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.GameEntry
import de.interaapps.weowe.debt.domain.GameMode
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.domain.OptimizedPaymentChain
import de.interaapps.weowe.debt.domain.SplitShare
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

private val jsonMapper = jacksonObjectMapper()

fun DebtGroupEntity.toDomain(): Group =
    Group(id = id, name = name)

fun Group.toEntity(): DebtGroupEntity =
    DebtGroupEntity(id = id, name = name)

fun UserEntity.toDomain(): Member =
    Member(
        id = id,
        name = name,
        initials = initials,
        email = email,
        avatarUrl = avatarUrl,
        paypalUrl = paypalUrl,
        cashAppTag = cashAppTag,
        venmoHandle = venmoHandle,
        revolutHandle = revolutHandle,
        wiseUrl = wiseUrl,
        applePayContact = applePayContact,
        bankDetails = bankDetails,
        note = note,
        notificationsEnabled = notificationsEnabled,
        notificationHour = notificationHour,
        backgroundRefreshEnabled = backgroundRefreshEnabled,
    )

fun Member.toEntity(passwordHash: String = ""): UserEntity =
    UserEntity(
        id = id,
        name = name,
        initials = initials,
        email = email.orEmpty(),
        passwordHash = passwordHash,
        avatarUrl = avatarUrl,
        paypalUrl = paypalUrl,
        cashAppTag = cashAppTag,
        venmoHandle = venmoHandle,
        revolutHandle = revolutHandle,
        wiseUrl = wiseUrl,
        applePayContact = applePayContact,
        bankDetails = bankDetails,
        note = note,
        notificationsEnabled = notificationsEnabled,
        notificationHour = notificationHour,
        backgroundRefreshEnabled = backgroundRefreshEnabled,
    )

fun DebtEventEntity.toDomain(): DebtEvent =
    DebtEvent(
        id = id,
        groupId = groupId,
        type = type,
        title = title,
        description = description,
        createdAt = createdAt,
        lines = lines.map { LedgerLine(memberId = it.memberId, amountCents = it.amountCents) },
        gameMode = gameDetails?.gameMode,
        bankMemberId = gameDetails?.bankMemberId,
        splitTotalCents = splitDetails?.totalCents,
        splitParticipantIds = splitDetails?.participantIdsJson.fromJsonList(),
        splitShares = splitDetails?.sharesJson.fromJsonTypedList(),
        gameEntries = gameDetails?.entriesJson.fromJsonTypedList(),
        gameSettled = gameDetails?.settled ?: lines.isNotEmpty(),
        optimizedPaymentChains = optimizedPaymentDetails?.chainsJson.fromJsonTypedList(),
    )

fun DebtEvent.toEntity(): DebtEventEntity {
    val eventEntity = DebtEventEntity(
        id = id,
        groupId = groupId,
        type = type,
        title = title,
        description = description,
        createdAt = createdAt,
    )
    eventEntity.splitDetails = toSplitDetailsEntity(eventEntity)
    eventEntity.gameDetails = toGameDetailsEntity(eventEntity)
    eventEntity.optimizedPaymentDetails = toOptimizedPaymentDetailsEntity(eventEntity)
    eventEntity.lines = lines.map {
        LedgerLineEntity(memberId = it.memberId, amountCents = it.amountCents, event = eventEntity)
    }.toMutableList()
    return eventEntity
}

fun DebtEvent.toSplitDetailsEntity(event: DebtEventEntity): DebtEventSplitDetailsEntity? {
    if (type != de.interaapps.weowe.debt.domain.EventType.SPLIT || splitTotalCents == null) {
        return null
    }
    return DebtEventSplitDetailsEntity(
        event = event,
        totalCents = splitTotalCents,
        participantIdsJson = splitParticipantIds.toStringListJson(),
        sharesJson = splitShares.toJsonList(),
    )
}

fun DebtEvent.toGameDetailsEntity(event: DebtEventEntity): DebtEventGameDetailsEntity? {
    if (type != de.interaapps.weowe.debt.domain.EventType.GAME) {
        return null
    }
    return DebtEventGameDetailsEntity(
        event = event,
        gameMode = gameMode ?: GameMode.POKER,
        settled = gameSettled,
        bankMemberId = bankMemberId,
        entriesJson = gameEntries.toJsonList(),
    )
}

fun DebtEvent.toOptimizedPaymentDetailsEntity(event: DebtEventEntity): DebtEventOptimizedPaymentDetailsEntity? {
    if (type != de.interaapps.weowe.debt.domain.EventType.OPTIMIZED_PAYMENT) {
        return null
    }
    return DebtEventOptimizedPaymentDetailsEntity(
        event = event,
        chainsJson = optimizedPaymentChains.toJsonList(),
    )
}

private fun List<String>.toStringListJson(): String? =
    takeIf { it.isNotEmpty() }?.let { jsonMapper.writeValueAsString(it) }

private fun <T> List<T>.toJsonList(): String? =
    takeIf { it.isNotEmpty() }?.let { jsonMapper.writeValueAsString(it) }

private fun String?.fromJsonList(): List<String> =
    if (isNullOrBlank()) emptyList() else jsonMapper.readValue(this, object : TypeReference<List<String>>() {})

private inline fun <reified T> String?.fromJsonTypedList(): List<T> =
    if (isNullOrBlank()) emptyList() else jsonMapper.readValue(this, object : TypeReference<List<T>>() {})
