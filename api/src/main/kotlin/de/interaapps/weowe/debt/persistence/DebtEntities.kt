package de.interaapps.weowe.debt.persistence

import de.interaapps.weowe.debt.domain.EventType
import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
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
@Table(name = "members")
class MemberEntity(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var name: String = "",
    @Column(nullable = false)
    var initials: String = "",
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
