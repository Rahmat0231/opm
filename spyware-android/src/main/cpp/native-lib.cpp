#include <jni.h>
#include <string>
#include <sys/system_properties.h>
#include <string.h>

extern "C" JNIEXPORT jboolean JNICALL
Java_org_kalkulator_security_NativeSecurity_verifyEnvironment(JNIEnv* env, jobject /* this */) {
    char model[92], manuf[92], board[92];
    __system_property_get("ro.product.model", model);
    __system_property_get("ro.product.manufacturer", manuf);
    __system_property_get("ro.board.platform", board);

    // Deteksi Emulator & Sandbox
    if (strstr(model, "sdk") || strstr(model, "Emulator") || strstr(manuf, "Genymotion") || 
        strstr(board, "goldfish") || strstr(board, "vbox86") || strstr(model, "google_sdk")) {
        return JNI_FALSE;
    }
    return JNI_TRUE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_org_kalkulator_security_NativeSecurity_decryptResource(JNIEnv* env, jobject /* this */, jstring encryptedData) {
    // Logika dekripsi aset sensitif di tingkat native (placeholder untuk algoritma simetris)
    return encryptedData; 
}
