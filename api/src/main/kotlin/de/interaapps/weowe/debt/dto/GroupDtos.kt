package de.interaapps.weowe.debt.dto

import jakarta.validation.constraints.NotBlank

data class CreateGroupRequest(
    @field:NotBlank
    val name: String,
)
