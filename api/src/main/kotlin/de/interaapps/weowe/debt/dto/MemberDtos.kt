package de.interaapps.weowe.debt.dto

import jakarta.validation.constraints.NotBlank

data class UpdateMemberRequest(
    @field:NotBlank
    val name: String,
    val email: String? = null,
    val initials: String? = null,
    val paypalUrl: String? = null,
    val cashAppTag: String? = null,
    val venmoHandle: String? = null,
    val revolutHandle: String? = null,
    val wiseUrl: String? = null,
    val applePayContact: String? = null,
    val bankDetails: String? = null,
    val note: String? = null,
    val notificationsEnabled: Boolean? = null,
    val notificationHour: Int? = null,
    val backgroundRefreshEnabled: Boolean? = null,
)
