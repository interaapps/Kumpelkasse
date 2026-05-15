package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventPage
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameMode
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.persistence.DebtEventRepository
import de.interaapps.weowe.debt.persistence.GroupMemberRepository
import de.interaapps.weowe.debt.persistence.LedgerLineEntity
import de.interaapps.weowe.debt.persistence.toDomain
import de.interaapps.weowe.debt.persistence.toEntity
import de.interaapps.weowe.debt.persistence.toGameDetailsEntity
import de.interaapps.weowe.debt.persistence.toOptimizedPaymentDetailsEntity
import de.interaapps.weowe.debt.persistence.toSplitDetailsEntity
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class EventPersistenceService(
    private val groupQueries: GroupPersistenceService,
    private val eventRepository: DebtEventRepository,
    private val groupMemberRepository: GroupMemberRepository,
) {
    @Transactional(readOnly = true)
    fun getEvent(eventId: String): DebtEvent =
        eventRepository.findById(eventId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found: $eventId") }
            .toDomain()

    @Transactional(readOnly = true)
    fun getEventsForGroup(groupId: String): List<DebtEvent> {
        groupQueries.getGroup(groupId)
        return eventRepository.findByGroupIdOrderByCreatedAtDesc(groupId).map { it.toDomain() }
    }

    @Transactional(readOnly = true)
    fun getEventPageForGroup(
        groupId: String,
        page: Int,
        size: Int,
        query: String?,
        type: EventType?,
        memberId: String?,
        createdAfter: Instant?,
    ): EventPage {
        groupQueries.getGroup(groupId)
        val pageable = PageRequest.of(page, size)
        val result = eventRepository.searchGroupEvents(groupId, query, type, memberId, createdAfter, pageable)
        return EventPage(
            items = result.content.map { it.toDomain() },
            page = result.number,
            size = result.size,
            totalCount = result.totalElements,
            hasMore = result.hasNext(),
        )
    }

    @Transactional
    fun createEvent(request: UpsertDebtEventRequest): DebtEvent {
        val event = request.toDebtEvent(id = request.id ?: "event-${UUID.randomUUID()}")
        validateEvent(event)
        return eventRepository.save(event.toEntity()).toDomain()
    }

    @Transactional
    fun updateEvent(eventId: String, request: UpsertDebtEventRequest): DebtEvent {
        val existing = eventRepository.findById(eventId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found: $eventId") }
        val event = request.toDebtEvent(id = eventId)
        validateEvent(event)

        existing.groupId = event.groupId
        existing.type = event.type
        existing.title = event.title
        existing.description = event.description
        existing.createdAt = event.createdAt
        syncSplitDetails(existing, event)
        syncGameDetails(existing, event)
        syncOptimizedPaymentDetails(existing, event)
        existing.lines.clear()
        existing.lines += event.lines.map {
            LedgerLineEntity(
                memberId = it.memberId,
                amountCents = it.amountCents,
                event = existing,
            )
        }

        return eventRepository.save(existing).toDomain()
    }

    private fun syncSplitDetails(
        existing: de.interaapps.weowe.debt.persistence.DebtEventEntity,
        event: DebtEvent,
    ) {
        val desired = event.toSplitDetailsEntity(existing)
        when {
            desired == null -> existing.splitDetails = null
            existing.splitDetails == null -> existing.splitDetails = desired
            else -> {
                existing.splitDetails?.apply {
                    this.event = existing
                    this.totalCents = desired.totalCents
                    this.participantIdsJson = desired.participantIdsJson
                    this.sharesJson = desired.sharesJson
                }
            }
        }
    }

    private fun syncGameDetails(
        existing: de.interaapps.weowe.debt.persistence.DebtEventEntity,
        event: DebtEvent,
    ) {
        val desired = event.toGameDetailsEntity(existing)
        when {
            desired == null -> existing.gameDetails = null
            existing.gameDetails == null -> existing.gameDetails = desired
            else -> {
                existing.gameDetails?.apply {
                    this.event = existing
                    this.gameMode = desired.gameMode
                    this.settled = desired.settled
                    this.bankMemberId = desired.bankMemberId
                    this.entriesJson = desired.entriesJson
                }
            }
        }
    }

    private fun syncOptimizedPaymentDetails(
        existing: de.interaapps.weowe.debt.persistence.DebtEventEntity,
        event: DebtEvent,
    ) {
        val desired = event.toOptimizedPaymentDetailsEntity(existing)
        when {
            desired == null -> existing.optimizedPaymentDetails = null
            existing.optimizedPaymentDetails == null -> existing.optimizedPaymentDetails = desired
            else -> {
                existing.optimizedPaymentDetails?.apply {
                    this.event = existing
                    this.chainsJson = desired.chainsJson
                }
            }
        }
    }

    @Transactional
    fun deleteEvent(eventId: String) {
        if (!eventRepository.existsById(eventId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found: $eventId")
        }
        eventRepository.deleteById(eventId)
    }

    private fun validateEvent(event: DebtEvent) {
        groupQueries.getGroup(event.groupId)

        if (event.title.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Event title is required")
        }
        if (event.type != EventType.GAME && event.lines.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Event needs at least one ledger line")
        }

        val knownMemberIds = groupMemberRepository.findByGroupId(event.groupId)
            .mapNotNull { it.user?.id }
            .toSet()

        event.lines.forEach { line ->
            if (line.memberId !in knownMemberIds) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown member: ${line.memberId}")
            }
        }

        val total = event.lines.sumOf { it.amountCents }
        if (event.type != EventType.GAME && total != 0L) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Ledger lines must sum to 0")
        }

        if (event.type == EventType.GAME && event.gameMode == GameMode.BANK) {
            val bankMemberId = event.bankMemberId
                ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Bank games need a bank member")
            if (bankMemberId !in knownMemberIds) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown bank member: $bankMemberId")
            }
        }

        if (event.type == EventType.SPLIT) {
            val splitTotalCents = event.splitTotalCents
                ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Split events need the original total")
            if (splitTotalCents <= 0) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Split total must be positive")
            }
            if (event.splitParticipantIds.isEmpty()) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Split events need participant ids")
            }
            if (event.splitParticipantIds.any { it !in knownMemberIds }) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Split contains unknown participants")
            }
            val splitShareTotal = event.splitShares.sumOf { it.amountCents }
            if (event.splitShares.isEmpty() || splitShareTotal != splitTotalCents) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Split shares must sum to the original total")
            }
        }

        if (event.type == EventType.GAME) {
            if (event.gameEntries.any { it.memberId !in knownMemberIds }) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Game contains unknown players")
            }
            if (event.gameEntries.isEmpty()) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Game needs at least one player entry")
            }
            if (event.gameSettled) {
                if (event.lines.isEmpty()) {
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed games need ledger lines")
                }
                if (total != 0L) {
                    throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed game ledger lines must sum to 0")
                }
            }
        }

        if (event.type == EventType.OPTIMIZED_PAYMENT) {
            if (event.optimizedPaymentChains.isEmpty()) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Optimized payments need shortcut chains")
            }
            if (event.optimizedPaymentChains.any { chain ->
                    chain.memberIds.size < 2 || chain.memberIds.any { it !in knownMemberIds }
                }
            ) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Optimized payment chain contains unknown members")
            }
            val chainTotal = event.optimizedPaymentChains.sumOf { it.amountCents }
            val paidAmount = event.lines.filter { it.amountCents > 0 }.sumOf { it.amountCents }
            if (chainTotal != paidAmount) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Optimized payment chains must sum to the paid amount")
            }
        }
    }
}
