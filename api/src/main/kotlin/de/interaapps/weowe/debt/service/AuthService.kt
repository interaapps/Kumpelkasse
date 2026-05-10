package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.LoginRequest
import de.interaapps.weowe.debt.dto.LoginResponse
import de.interaapps.weowe.debt.dto.RegisterRequest
import de.interaapps.weowe.debt.persistence.UserEntity
import de.interaapps.weowe.debt.persistence.UserRepository
import de.interaapps.weowe.debt.persistence.UserSessionEntity
import de.interaapps.weowe.debt.persistence.UserSessionRepository
import de.interaapps.weowe.debt.persistence.toDomain
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Duration
import java.time.Instant
import java.util.UUID

data class AuthSession(
    val token: String,
    val user: Member,
)

interface AuthFacade {
    fun login(request: LoginRequest): LoginResponse
    fun register(request: RegisterRequest): LoginResponse
    fun logout(token: String)
    fun getSession(token: String): LoginResponse
    fun requireSession(token: String): AuthSession
    fun requireUser(token: String): Member = requireSession(token).user
}

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val sessionRepository: UserSessionRepository,
    private val passwordService: PasswordService,
) : AuthFacade {
    private val sessionDuration: Duration = Duration.ofDays(30)

    @Transactional
    override fun login(request: LoginRequest): LoginResponse {
        val email = normalizeEmail(request.email)
        val password = validatePassword(request.password)

        val user = userRepository.findByEmailIgnoreCase(email)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password")
        if (!passwordService.matches(password, user.passwordHash)) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password")
        }

        return createSession(user)
    }

    @Transactional
    override fun register(request: RegisterRequest): LoginResponse {
        val email = normalizeEmail(request.email)
        val password = validatePassword(request.password)
        val name = request.name.trim().takeIf { it.isNotEmpty() }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required")
        if (userRepository.findByEmailIgnoreCase(email) != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "User already exists")
        }

        return createSession(createUser(email, name, password))
    }

    @Transactional
    override fun logout(token: String) {
        sessionRepository.deleteById(token)
    }

    @Transactional(readOnly = true)
    override fun getSession(token: String): LoginResponse {
        val session = requireSession(token)
        return LoginResponse(
            sessionToken = session.token,
            currentUserId = session.user.id,
            member = session.user,
        )
    }

    @Transactional(readOnly = true)
    override fun requireSession(token: String): AuthSession {
        val session = findValidSession(token)
        return AuthSession(
            token = session.token,
            user = session.user?.toDomain() ?: unauthorized(),
        )
    }

    private fun createUser(email: String, name: String, password: String): UserEntity {
        return userRepository.save(
            UserEntity(
                id = "user-${UUID.randomUUID()}",
                name = name,
                initials = initialsFrom(name),
                email = email,
                passwordHash = passwordService.hash(password),
            ),
        )
    }

    private fun createSession(user: UserEntity): LoginResponse {
        val now = Instant.now()
        val session = sessionRepository.save(
            UserSessionEntity(
                token = UUID.randomUUID().toString(),
                user = user,
                createdAt = now,
                expiresAt = now.plus(sessionDuration),
            ),
        )
        return LoginResponse(sessionToken = session.token, currentUserId = user.id, member = user.toDomain())
    }

    private fun findValidSession(token: String): UserSessionEntity {
        val session = sessionRepository.findByToken(token)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session not found")
        if (session.expiresAt.isBefore(Instant.now())) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired")
        }
        return session
    }

    private fun normalizeEmail(email: String): String =
        email.trim().lowercase().takeIf { it.contains("@") }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid email is required")

    private fun validatePassword(password: String): String =
        password.trim().takeIf { it.length >= 6 }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters")

    private fun initialsFrom(name: String): String =
        name.trim()
            .split(Regex("\\s+"))
            .filter { it.isNotEmpty() }
            .take(2)
            .joinToString("") { it.first().uppercase() }
            .ifBlank { "?" }

    private fun unauthorized(): Nothing = throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid session")
}
