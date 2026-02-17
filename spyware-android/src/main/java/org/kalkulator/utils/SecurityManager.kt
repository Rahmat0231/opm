package org.kalkulator.utils

import android.content.Context
import android.content.SharedPreferences
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import android.util.Base64

class SecurityManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("vault_prefs", Context.MODE_PRIVATE)

    fun isFirstRun(): Boolean = prefs.getString("vault_pin", null) == null

    fun savePin(pin: String) {
        prefs.edit().putString("vault_pin", hashPin(pin)).apply()
    }

    fun verifyPin(input: String): Boolean {
        val savedPin = prefs.getString("vault_pin", null)
        return savedPin == hashPin(input)
    }

    private fun hashPin(pin: String): String {
        // Simple hashing for now, can be upgraded to PBKDF2
        return Base64.encodeToString(pin.toByteArray(), Base64.DEFAULT).trim()
    }

    fun incrementFailedAttempts() {
        val attempts = prefs.getInt("failed_attempts", 0) + 1
        prefs.edit().putInt("failed_attempts", attempts).apply()
        if (attempts >= 5) {
            prefs.edit().putLong("lock_until", System.currentTimeMillis() + 30000).apply()
        }
    }

    fun resetFailedAttempts() {
        prefs.edit().putInt("failed_attempts", 0).putLong("lock_until", 0).apply()
    }

    fun isLocked(): Boolean {
        val lockUntil = prefs.getLong("lock_until", 0)
        if (System.currentTimeMillis() < lockUntil) return true
        return false
    }
}
