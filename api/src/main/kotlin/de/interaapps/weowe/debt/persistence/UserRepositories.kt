package de.interaapps.weowe.debt.persistence

import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<UserEntity, String> {
    fun findByEmailIgnoreCase(email: String): UserEntity?
    fun findByInteraAppsSubject(interaAppsSubject: String): UserEntity?
}

interface UserSessionRepository : JpaRepository<UserSessionEntity, String> {
    fun findByToken(token: String): UserSessionEntity?
}
