package de.interaapps.weowe.debt.service

import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service

@Service
class SchemaCompatibilityService(
    private val jdbcTemplate: JdbcTemplate,
) {
    @EventListener(ApplicationReadyEvent::class)
    fun ensureSchemaCompatibility() {
        widenDebtEventTypeColumnIfNeeded()
    }

    private fun widenDebtEventTypeColumnIfNeeded() {
        val columnLength = jdbcTemplate.queryForObject(
            """
            SELECT CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'debt_events'
              AND COLUMN_NAME = 'type'
            """.trimIndent(),
            Int::class.java,
        )

        if (columnLength != null && columnLength < 32) {
            jdbcTemplate.execute("ALTER TABLE debt_events MODIFY COLUMN type VARCHAR(32) NOT NULL")
        }
    }
}
