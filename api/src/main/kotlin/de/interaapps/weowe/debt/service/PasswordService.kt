package de.interaapps.weowe.debt.service

import org.springframework.stereotype.Service
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

@Service
class PasswordService {
    private val random = SecureRandom()
    private val iterations = 120_000
    private val keyLength = 256

    fun hash(password: String): String {
        val salt = ByteArray(16)
        random.nextBytes(salt)
        val hash = pbkdf2(password, salt, iterations)
        return listOf(
            "pbkdf2",
            iterations.toString(),
            Base64.getEncoder().encodeToString(salt),
            Base64.getEncoder().encodeToString(hash),
        ).joinToString("$")
    }

    fun matches(password: String, encoded: String): Boolean {
        val parts = encoded.split("$")
        if (parts.size != 4 || parts[0] != "pbkdf2") {
            return false
        }

        val encodedIterations = parts[1].toIntOrNull() ?: return false
        val salt = Base64.getDecoder().decode(parts[2])
        val expected = Base64.getDecoder().decode(parts[3])
        val actual = pbkdf2(password, salt, encodedIterations)
        return actual.contentEquals(expected)
    }

    private fun pbkdf2(password: String, salt: ByteArray, iterations: Int): ByteArray {
        val spec = PBEKeySpec(password.toCharArray(), salt, iterations, keyLength)
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
    }
}
