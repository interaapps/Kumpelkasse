package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.Group
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.UpdateMemberRequest
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.persistence.DebtEventRepository
import de.interaapps.weowe.debt.persistence.DebtGroupRepository
import de.interaapps.weowe.debt.persistence.MemberRepository
import de.interaapps.weowe.debt.persistence.toDomain
import de.interaapps.weowe.debt.persistence.toEntity
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class JpaDebtStore(
    private val groupRepository: DebtGroupRepository,
    private val memberRepository: MemberRepository,
    private val eventRepository: DebtEventRepository,
) : DebtStore {
    @Transactional(readOnly = true)
    override fun getGroups(): List<Group> = groupRepository.findAll().map { it.toDomain() }

    @Transactional(readOnly = true)
    override fun getMembers(): List<Member> = memberRepository.findAll().map { it.toDomain() }

    @Transactional(readOnly = true)
    override fun getMember(memberId: String): Member =
        memberRepository.findById(memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: $memberId") }
            .toDomain()

    @Transactional(readOnly = true)
    override fun getGroup(groupId: String): Group =
        groupRepository.findById(groupId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found: $groupId") }
            .toDomain()

    @Transactional(readOnly = true)
    override fun getEvent(eventId: String): DebtEvent =
        eventRepository.findById(eventId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found: $eventId") }
            .toDomain()

    @Transactional(readOnly = true)
    override fun getEventsForGroup(groupId: String): List<DebtEvent> {
        getGroup(groupId)
        return eventRepository.findByGroupIdOrderByCreatedAtDesc(groupId).map { it.toDomain() }
    }

    @Transactional
    override fun createEvent(request: UpsertDebtEventRequest): DebtEvent {
        val event = request.toEvent(id = request.id ?: "event-${UUID.randomUUID()}")
        validateEvent(event)
        return eventRepository.save(event.toEntity()).toDomain()
    }

    @Transactional
    override fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent {
        val existing = eventRepository.findById(eventId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found: $eventId") }
        val event = request.toEvent(id = eventId)
        validateEvent(event)

        existing.groupId = event.groupId
        existing.type = event.type
        existing.title = event.title
        existing.description = event.description
        existing.createdAt = event.createdAt
        existing.lines.clear()
        existing.lines += event.lines.map {
            de.interaapps.weowe.debt.persistence.LedgerLineEntity(
                memberId = it.memberId,
                amountCents = it.amountCents,
                event = existing,
            )
        }

        return eventRepository.save(existing).toDomain()
    }

    @Transactional
    override fun deleteEvent(eventId: String) {
        if (!eventRepository.existsById(eventId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found: $eventId")
        }
        eventRepository.deleteById(eventId)
    }

    @Transactional
    override fun updateMember(memberId: String, request: UpdateMemberRequest): Member {
        val existing = memberRepository.findById(memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: $memberId") }

        existing.name = request.name.trim()
        existing.initials = request.initials?.takeIf { it.isNotBlank() } ?: initialsFrom(request.name)
        existing.paypalUrl = request.paypalUrl.blankToNull()
        existing.cashAppTag = request.cashAppTag.blankToNull()
        existing.venmoHandle = request.venmoHandle.blankToNull()
        existing.revolutHandle = request.revolutHandle.blankToNull()
        existing.wiseUrl = request.wiseUrl.blankToNull()
        existing.applePayContact = request.applePayContact.blankToNull()
        existing.bankDetails = request.bankDetails.blankToNull()
        existing.note = request.note.blankToNull()

        return memberRepository.save(existing).toDomain()
    }

    private fun UpsertDebtEventRequest.toEvent(id: String): DebtEvent =
        DebtEvent(
            id = id,
            groupId = groupId,
            type = type,
            title = title.trim(),
            description = description.blankToNull(),
            createdAt = createdAt ?: Instant.now(),
            lines = lines,
        )

    private fun validateEvent(event: DebtEvent) {
        getGroup(event.groupId)

        if (event.title.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Event title is required")
        }

        if (event.lines.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Event needs at least one ledger line")
        }

        val knownMemberIds = memberRepository.findAll().map { it.id }.toSet()
        event.lines.forEach { line ->
            if (line.memberId !in knownMemberIds) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown member: ${line.memberId}")
            }
        }

        val total = event.lines.sumOf { it.amountCents }
        if (total != 0L) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Ledger lines must sum to 0")
        }
    }

    private fun String?.blankToNull(): String? = this?.trim()?.takeIf { it.isNotEmpty() }

    private fun initialsFrom(name: String): String =
        name.trim()
            .split(Regex("\\s+"))
            .filter { it.isNotEmpty() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
            .ifBlank { "?" }
}
