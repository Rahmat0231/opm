package org.kalkulator.security

import android.content.Context
import java.io.File

class NativeSecurity {
    init {
        System.loadLibrary("native-security")
    }

    external fun verifyEnvironment(): Boolean
    external fun decryptResource(encryptedData: String): String

    /**
     * (2) Dynamic Code Loading (DCL)
     * Memuat modul tambahan secara dinamis dari folder internal aplikasi.
     */
    fun loadModule(context: Context, moduleName: String) {
        val moduleFile = File(context.filesDir, "modules/$moduleName")
        if (moduleFile.exists()) {
            System.load(moduleFile.absolutePath)
        }
    }
}
