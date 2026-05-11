package de.interaapps.weowe.debt.dto

import de.interaapps.weowe.debt.domain.Member
import jakarta.validation.constraints.NotBlank

data class LoginRequest(
    @field:NotBlank
    val email: String,
    @field:NotBlank
    val password: String,
)

data class RegisterRequest(
    @field:NotBlank
    val email: String,
    @field:NotBlank
    val password: String,
    @field:NotBlank
    val name: String,
)

data class OidcLoginRequest(
    @field:NotBlank
    val code: String,
    @field:NotBlank
    val redirectUri: String,
    @field:NotBlank
    val codeVerifier: String,
)

data class LoginResponse(
    val sessionToken: String,
    val currentUserId: String,
    val member: Member,
)
