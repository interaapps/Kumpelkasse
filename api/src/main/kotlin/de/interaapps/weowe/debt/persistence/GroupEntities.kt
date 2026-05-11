package de.interaapps.weowe.debt.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint

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
