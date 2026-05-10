package de.interaapps.weowe.debt.persistence

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.LedgerLine
import de.interaapps.weowe.debt.domain.Member

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
    eventEntity.lines = lines.map {
        LedgerLineEntity(memberId = it.memberId, amountCents = it.amountCents, event = eventEntity)
    }.toMutableList()
    return eventEntity
}
