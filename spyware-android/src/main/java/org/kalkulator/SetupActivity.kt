package org.kalkulator

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import org.kalkulator.utils.SecurityManager

class SetupActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val securityManager = SecurityManager(this)
        
        if (!securityManager.isFirstRun()) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_setup)

        findViewById<Button>(R.id.btnStart).setOnClickListener {
            val pin = findViewById<TextInputEditText>(R.id.etPin).text.toString()
            if (pin.length >= 4) {
                securityManager.savePin(pin)
                Toast.makeText(this, "Calculator Initialized", Toast.LENGTH_SHORT).show()
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            } else {
                Toast.makeText(this, "PIN must be at least 4 digits", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
