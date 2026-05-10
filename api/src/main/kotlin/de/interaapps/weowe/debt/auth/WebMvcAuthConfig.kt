package de.interaapps.weowe.debt.auth

import org.springframework.context.annotation.Configuration
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebMvcAuthConfig(
    private val currentUserArgumentResolver: CurrentUserArgumentResolver,
    private val currentSessionTokenArgumentResolver: CurrentSessionTokenArgumentResolver,
) : WebMvcConfigurer {
    override fun addArgumentResolvers(resolvers: MutableList<HandlerMethodArgumentResolver>) {
        resolvers += currentUserArgumentResolver
        resolvers += currentSessionTokenArgumentResolver
    }
}
