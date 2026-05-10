package de.interaapps.weowe.debt.service

import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.LoginRequest
import de.interaapps.weowe.debt.dto.LoginResponse
import de.interaapps.weowe.debt.dto.OidcLoginRequest
import de.interaapps.weowe.debt.dto.RegisterRequest
import de.interaapps.weowe.debt.persistence.UserEntity
import de.interaapps.weowe.debt.persistence.UserRepository
import de.interaapps.weowe.debt.persistence.UserSessionEntity
import de.interaapps.weowe.debt.persistence.UserSessionRepository
import de.interaapps.weowe.debt.persistence.toDomain
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import org.springframework.http.HttpStatus
import org.springframework.beans.factory.annotation.Value
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
    fun loginWithInteraApps(request: OidcLoginRequest): LoginResponse
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
    private val objectMapper: ObjectMapper,
    @Value("\${interaapps.oidc.client-id:weowe}")
    private val interaAppsClientId: String,
    @Value("\${interaapps.oidc.client-secret:}")
    private val interaAppsClientSecret: String,
) : AuthFacade {
    private val sessionDuration: Duration = Duration.ofDays(90)
    private val http = OkHttpClient()
    private val tokenEndpoint = "https://accounts.interaapps.de/api/v2/authorization/oauth2/access_token"
    private val userInfoEndpoint = "https://accounts.interaapps.de/api/v2/oidc/userinfo"

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
    override fun loginWithInteraApps(request: OidcLoginRequest): LoginResponse {
        val tokenResponse = exchangeAuthorizationCode(request)
        val profile = fetchUserInfo(tokenResponse.accessToken)

        val existingBySubject = userRepository.findByInteraAppsSubject(profile.subject)
        if (existingBySubject != null) {
            updateUserFromOidc(existingBySubject, profile)
            return createSession(userRepository.save(existingBySubject))
        }

        val existingByEmail = userRepository.findByEmailIgnoreCase(profile.email)
        if (existingByEmail != null) {
            existingByEmail.interaAppsSubject = profile.subject
            updateUserFromOidc(existingByEmail, profile)
            return createSession(userRepository.save(existingByEmail))
        }

        return createSession(
            userRepository.save(
                UserEntity(
                    id = "user-${UUID.randomUUID()}",
                    name = profile.name,
                    initials = initialsFrom(profile.name),
                    email = profile.email,
                    passwordHash = "oidc:${UUID.randomUUID()}",
                    interaAppsSubject = profile.subject,
                    avatarUrl = profile.picture,
                ),
            ),
        )
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

    private fun updateUserFromOidc(user: UserEntity, profile: InteraAppsProfile) {
        user.name = profile.name
        user.initials = initialsFrom(profile.name)
        user.email = profile.email
        user.avatarUrl = profile.picture
    }

    private fun exchangeAuthorizationCode(request: OidcLoginRequest): InteraAppsTokenResponse {
        val formBuilder = FormBody.Builder()
            .add("grant_type", "authorization_code")
            .add("client_id", interaAppsClientId)
            .add("code", request.code)
            .add("redirect_uri", request.redirectUri)
            .add("code_verifier", request.codeVerifier)

        if (interaAppsClientSecret.isNotBlank()) {
            formBuilder.add("client_secret", interaAppsClientSecret)
        }

        val httpRequest = Request.Builder()
            .url(tokenEndpoint)
            .post(formBuilder.build())
            .build()

        http.newCall(httpRequest).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "OIDC token exchange failed")
            }

            val json = objectMapper.readTree(body)
            val accessToken = json["access_token"]?.asText()?.takeIf { it.isNotBlank() }
                ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "OIDC access token missing")
            return InteraAppsTokenResponse(accessToken = accessToken)
        }
    }

    private fun fetchUserInfo(accessToken: String): InteraAppsProfile {
        val httpRequest = Request.Builder()
            .url(userInfoEndpoint)
            .header("Authorization", "Bearer $accessToken")
            .build()

        http.newCall(httpRequest).execute().use { response ->
            val body = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "OIDC userinfo failed")
            }

            val json = objectMapper.readTree(body)
            val subject = json.requiredText("sub", "OIDC subject missing")
            val email = json.requiredText("email", "OIDC email missing").lowercase()
            val name = json["name"]?.asText()?.takeIf { it.isNotBlank() } ?: email.substringBefore("@")
            val picture = json["picture"]?.asText()?.takeIf { it.isNotBlank() }
            return InteraAppsProfile(subject = subject, email = email, name = name, picture = picture)
        }
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

    private fun JsonNode.requiredText(field: String, message: String): String =
        this[field]?.asText()?.takeIf { it.isNotBlank() }
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, message)
}

private data class InteraAppsTokenResponse(
    val accessToken: String,
)

private data class InteraAppsProfile(
    val subject: String,
    val email: String,
    val name: String,
    val picture: String?,
)
