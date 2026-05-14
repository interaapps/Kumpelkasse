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
import jakarta.persistence.MapsId
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "debt_events")
class DebtEventEntity(
    @Id
    var id: String = "",
    @Column(nullable = false)
    var groupId: String = "",
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var type: EventType = EventType.DIRECT,
    @Column(nullable = false)
    var title: String = "",
    @Column(length = 1_000)
    var description: String? = null,
    @Column(nullable = false)
    var createdAt: Instant = Instant.now(),
    @OneToOne(mappedBy = "event", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    var splitDetails: DebtEventSplitDetailsEntity? = null,
    @OneToOne(mappedBy = "event", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    var gameDetails: DebtEventGameDetailsEntity? = null,
    @OneToOne(mappedBy = "event", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    var optimizedPaymentDetails: DebtEventOptimizedPaymentDetailsEntity? = null,
    @OneToMany(mappedBy = "event", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    var lines: MutableList<LedgerLineEntity> = mutableListOf(),
)

@Entity
@Table(name = "debt_event_split_details")
class DebtEventSplitDetailsEntity(
    @Id
    var eventId: String? = null,
    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    var event: DebtEventEntity? = null,
    @Column(nullable = false)
    var totalCents: Long = 0,
    @Column(length = 4_000)
    var participantIdsJson: String? = null,
    @Column(length = 8_000)
    var sharesJson: String? = null,
)

@Entity
@Table(name = "debt_event_game_details")
class DebtEventGameDetailsEntity(
    @Id
    var eventId: String? = null,
    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    var event: DebtEventEntity? = null,
    @Enumerated(EnumType.STRING)
    var gameMode: GameMode? = null,
    @Column(nullable = false)
    var settled: Boolean = true,
    var bankMemberId: String? = null,
    @Column(length = 8_000)
    var entriesJson: String? = null,
)

@Entity
@Table(name = "debt_event_optimized_payment_details")
class DebtEventOptimizedPaymentDetailsEntity(
    @Id
    var eventId: String? = null,
    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    var event: DebtEventEntity? = null,
    @Column(length = 12_000)
    var chainsJson: String? = null,
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
    @jakarta.persistence.ManyToOne(fetch = FetchType.LAZY)
    var event: DebtEventEntity? = null,
)
