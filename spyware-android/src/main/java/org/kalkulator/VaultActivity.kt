package org.kalkulator

import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class VaultActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_vault)

        findViewById<Button>(R.id.btnHidePictures).setOnClickListener {
            Toast.makeText(this, "Picture Hiding Module Initialized", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnHideFiles).setOnClickListener {
            Toast.makeText(this, "File Hiding Module Initialized", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnHideApps).setOnClickListener {
            Toast.makeText(this, "App Hiding requires System Privileges", Toast.LENGTH_LONG).show()
        }
    }
}
