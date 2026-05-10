package de.interaapps.weowe.debt.service

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class PasswordServiceTest {
    private val passwordService = PasswordService()

    @Test
    fun `hashes password with salt and verifies it`() {
        val firstHash = passwordService.hash("super-secret")
        val secondHash = passwordService.hash("super-secret")

        assertNotEquals(firstHash, secondHash)
        assertTrue(passwordService.matches("super-secret", firstHash))
        assertFalse(passwordService.matches("wrong-secret", firstHash))
    }
}
