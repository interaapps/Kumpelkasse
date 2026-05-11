package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.CurrentUser
import de.interaapps.weowe.debt.domain.DebtEvent
import de.interaapps.weowe.debt.domain.EventDateRange
import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.EventPageResponse
import de.interaapps.weowe.debt.dto.UpsertDebtEventRequest
import de.interaapps.weowe.debt.dto.toResponse
import de.interaapps.weowe.debt.service.AccessControlService
import de.interaapps.weowe.debt.service.DebtStore
import de.interaapps.weowe.debt.service.EventFeedService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/events")
class EventController(
    private val store: DebtStore,
    private val eventFeedService: EventFeedService,
    private val accessControl: AccessControlService,
) {
    @GetMapping("/{eventId}")
    fun getEvent(
        @PathVariable eventId: String,
        @CurrentUser currentUser: Member,
    ): DebtEvent = accessControl.requireAccessibleEvent(currentUser.id, eventId)

    @GetMapping
    fun getEvents(
        @RequestParam groupId: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false, name = "q") query: String?,
        @RequestParam(required = false) type: String?,
        @RequestParam(defaultValue = "false") mine: Boolean,
        @RequestParam(required = false) range: EventDateRange?,
        @CurrentUser currentUser: Member,
    ): EventPageResponse =
        eventFeedService.getEventPage(
            currentUser = currentUser,
            groupId = groupId,
            page = page,
            size = size,
            query = query,
            type = type?.let(EventType::from),
            mineOnly = mine,
            range = range,
        ).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createEvent(
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: UpsertDebtEventRequest,
    ): DebtEvent {
        accessControl.requireGroupMember(currentUser.id, request.groupId)
        return store.createEvent(request)
    }

    @PutMapping("/{eventId}")
    fun updateEvent(
        @PathVariable eventId: String,
        @CurrentUser currentUser: Member,
        @Valid @RequestBody request: UpsertDebtEventRequest,
    ): DebtEvent {
        accessControl.requireAccessibleEvent(currentUser.id, eventId)
        accessControl.requireGroupMember(currentUser.id, request.groupId)
        return store.updateEvent(eventId, request)
    }

    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun deleteEvent(
        @PathVariable eventId: String,
        @CurrentUser currentUser: Member,
    ) {
        accessControl.requireAccessibleEvent(currentUser.id, eventId)
        store.deleteEvent(eventId)
    }
}
