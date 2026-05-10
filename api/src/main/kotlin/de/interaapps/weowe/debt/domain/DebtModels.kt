package de.interaapps.weowe.debt.domain

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue
import java.time.Instant

enum class EventType(private val wireName: String) {
    DIRECT("direct"),
    SPLIT("split"),
    SINGLE("single"),
    GAME("game"),
    PAYMENT("payment");

    @JsonValue
    fun toJson(): String = wireName

    companion object {
        @JsonCreator
        @JvmStatic
        fun from(value: String): EventType =
            entries.firstOrNull { it.wireName == value.lowercase() }
                ?: throw IllegalArgumentException("Unknown event type: $value")
    }
}

data class LedgerLine(
    val memberId: String,
    val amountCents: Long,
)

data class DebtEvent(
    val id: String,
    val groupId: String,
    val type: EventType,
    val title: String,
    val description: String? = null,
    val createdAt: Instant,
    val lines: List<LedgerLine>,
)

data class Group(
    val id: String,
    val name: String,
)

data class Member(
    val id: String,
    val name: String,
    val initials: String,
    val paypalUrl: String? = null,
    val cashAppTag: String? = null,
    val venmoHandle: String? = null,
    val revolutHandle: String? = null,
    val wiseUrl: String? = null,
    val applePayContact: String? = null,
    val bankDetails: String? = null,
    val note: String? = null,
)

data class SettlementRow(
    val member: Member,
    val amountCents: Long,
    val eventCount: Int,
)

data class Summary(
    val netCents: Long,
    val owedByMeCents: Long,
    val owedToMeCents: Long,
)
