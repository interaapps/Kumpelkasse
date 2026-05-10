package de.interaapps.weowe.debt.persistence

import de.interaapps.weowe.debt.domain.EventType
import de.interaapps.weowe.debt.domain.GameMode
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant

@Entity
@Table(name = "debt_groups")
class DebtGroupEntity(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var name: String = "",
)

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
@Table(
    name = "group_members",
    uniqueConstraints = [UniqueConstraint(name = "uk_group_user", columnNames = ["group_id", "user_id"])],
)
class GroupMemberEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    var group: DebtGroupEntity? = null,
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: UserEntity? = null,
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

@Entity
@Table(name = "debt_events")
class DebtEventEntity(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var groupId: String = "",
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var type: EventType = EventType.DIRECT,
    @Column(nullable = false)
    var title: String = "",
    @Column(length = 1_000)
    var description: String? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @Enumerated(EnumType.STRING)
    var gameMode: GameMode? = null,
    var bankMemberId: String? = null,
    @OneToMany(mappedBy = "event", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    var lines: MutableList<LedgerLineEntity> = mutableListOf(),
)

@Entity
@Table(name = "ledger_lines")
class LedgerLineEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,
    @Column(nullable = false)
    var memberId: String = "",
    @Column(nullable = false)
    var amountCents: Long = 0,
    @ManyToOne(fetch = FetchType.LAZY)
    var event: DebtEventEntity? = null,
)
