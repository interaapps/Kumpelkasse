package de.interaapps.weowe.debt.controller

import de.interaapps.weowe.debt.auth.CurrentSessionToken
import de.interaapps.weowe.debt.auth.CurrentUser
import de.interaapps.weowe.debt.domain.Member
import de.interaapps.weowe.debt.dto.LoginRequest
import de.interaapps.weowe.debt.dto.LoginResponse
import de.interaapps.weowe.debt.dto.OidcLoginRequest
import de.interaapps.weowe.debt.dto.RegisterRequest
import de.interaapps.weowe.debt.service.AuthFacade
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val auth: AuthFacade,
) {
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): LoginResponse = auth.login(request)

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest): LoginResponse = auth.register(request)

    @PostMapping("/oidc/interaapps")
    fun loginWithInteraApps(@Valid @RequestBody request: OidcLoginRequest): LoginResponse =
        auth.loginWithInteraApps(request)

    @GetMapping("/session")
    fun getSession(
        @CurrentUser currentUser: Member,
        @CurrentSessionToken sessionToken: String,
    ): LoginResponse = LoginResponse(sessionToken = sessionToken, currentUserId = currentUser.id, member = currentUser)

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun logout(@CurrentSessionToken sessionToken: String) {
        auth.logout(sessionToken)
    }
}
