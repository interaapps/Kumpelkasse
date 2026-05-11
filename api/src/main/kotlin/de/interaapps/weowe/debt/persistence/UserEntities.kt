package de.interaapps.weowe.debt.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant

@Entity
@Table(
    name = "users",
    uniqueConstraints = [
        UniqueConstraint(name = "uk_users_email", columnNames = ["email"]),
        UniqueConstraint(name = "uk_users_interaapps_subject", columnNames = ["interaapps_subject"]),
    ],
)
class UserEntity(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var name: String = "",
    @Column(nullable = false)
    var initials: String = "",
    @Column(nullable = false)
    var email: String = "",
    @Column(nullable = false, length = 512)
    var passwordHash: String = "",
    @Column(name = "interaapps_subject")
    var interaAppsSubject: String? = null,
    var avatarUrl: String? = null,
    var paypalUrl: String? = null,
    var cashAppTag: String? = null,
    var venmoHandle: String? = null,
    var revolutHandle: String? = null,
    var wiseUrl: String? = null,
    var applePayContact: String? = null,
    @Column(length = 1_000)
    var bankDetails: String? = null,
    @Column(length = 1_000)
    var note: String? = null,
    @Column(nullable = false)
    var notificationsEnabled: Boolean = false,
    @Column(nullable = false)
    var notificationHour: Int = 20,
    @Column(nullable = false)
    var backgroundRefreshEnabled: Boolean = false,
)

@Entity
@Table(name = "user_sessions")
class UserSessionEntity(
    @Id
    var token: String = "",
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: UserEntity? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(nullable = false)
    var expiresAt: Instant = Instant.now(),
)
