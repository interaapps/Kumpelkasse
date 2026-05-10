package de.interaapps.weowe.debt.auth

import de.interaapps.weowe.debt.service.AuthFacade
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class BearerAuthFilter(
    private val auth: AuthFacade,
) : OncePerRequestFilter() {
    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        request.servletPath == "/api/auth/login" || request.servletPath == "/api/auth/register"

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val token = request.getHeader(HttpHeaders.AUTHORIZATION)?.bearerToken()
        if (token == null) {
            filterChain.doFilter(request, response)
            return
        }

        val session = try {
            auth.requireSession(token)
        } catch (_: RuntimeException) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired session")
            return
        }

        request.setAttribute(AuthRequestAttributes.CURRENT_USER, session.user)
        request.setAttribute(AuthRequestAttributes.SESSION_TOKEN, session.token)
        filterChain.doFilter(request, response)
    }

    private fun String.bearerToken(): String? =
        takeIf { it.startsWith("Bearer ", ignoreCase = true) }
            ?.substringAfter(" ")
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
}
