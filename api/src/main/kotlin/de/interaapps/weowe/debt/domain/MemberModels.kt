package de.interaapps.weowe.debt.domain

data class Member(
    val id: String,
    val name: String,
    val initials: String,
    val email: String? = null,
    val avatarUrl: String? = null,
    val paypalUrl: String? = null,
    val cashAppTag: String? = null,
    val venmoHandle: String? = null,
    val revolutHandle: String? = null,
    val wiseUrl: String? = null,
    val applePayContact: String? = null,
    val bankDetails: String? = null,
    val note: String? = null,
    val notificationsEnabled: Boolean = false,
    val notificationHour: Int = 20,
    val backgroundRefreshEnabled: Boolean = false,
)
