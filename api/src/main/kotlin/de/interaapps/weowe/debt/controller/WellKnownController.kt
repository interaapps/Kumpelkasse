package de.interaapps.weowe.debt.controller

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
class WellKnownController(
    @Value("\${app.ios.team-id:}")
    private val appleTeamId: String,
    @Value("\${app.ios.bundle-id:de.interaapps.kumpelkasse}")
    private val iosBundleId: String,
    @Value("\${app.android.package-name:de.interaapps.kumpelkasse}")
    private val androidPackageName: String,
    @Value("\${app.android.sha256-cert-fingerprints:}")
    private val androidSha256Fingerprints: String,
) {
    @GetMapping(
        "/.well-known/apple-app-site-association",
        "/apple-app-site-association",
        produces = [MediaType.APPLICATION_JSON_VALUE],
    )
    fun appleAppSiteAssociation(): Map<String, Any> {
        val appIds = appleTeamId
            .trim()
            .takeIf { it.isNotEmpty() }
            ?.let { listOf("$it.$iosBundleId") }
            ?: emptyList<String>()

        return mapOf(
            "applinks" to mapOf(
                "details" to listOf(
                    mapOf(
                        "appIDs" to appIds,
                        "components" to listOf(
                            mapOf(
                                "/" to "/invite/*",
                                "comment" to "Kumpelkasse invite links",
                            ),
                        ),
                    ),
                ),
            ),
        )
    }

    @GetMapping(
        "/.well-known/assetlinks.json",
        produces = [MediaType.APPLICATION_JSON_VALUE],
    )
    fun androidAssetLinks(): List<Map<String, Any>> {
        val fingerprints = androidSha256Fingerprints
            .split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() }

        if (fingerprints.isEmpty()) {
            return emptyList()
        }

        return listOf(
            mapOf(
                "relation" to listOf("delegate_permission/common.handle_all_urls"),
                "target" to mapOf(
                    "namespace" to "android_app",
                    "package_name" to androidPackageName,
                    "sha256_cert_fingerprints" to fingerprints,
                ),
            ),
        )
    }
}
