#include <jni.h>
#include <string>
#include <sys/system_properties.h>
#include <string.h>
#include <sys/ptrace.h>
#include <unistd.h>
#include <android/log.h>

#define TAG "MALXGMN_SEC"

// (1) AES-256 Placeholder & XOR Obfuscation Logic
// Key: "malxgmn_secret_key_2026_top_secret" (XOR'ed)
static const unsigned char obfuscated_key[] = {0x2d, 0x21, 0x2c, 0x38, 0x27, 0x2d, 0x2e, 0x1f, 0x33, 0x25, 0x23, 0x32, 0x25, 0x34, 0x1f, 0x2b, 0x25, 0x39, 0x1f, 0x32, 0x30, 0x32, 0x36, 0x1f, 0x34, 0x2f, 0x30, 0x1f, 0x33, 0x25, 0x23, 0x32, 0x25, 0x34};
static const int key_len = sizeof(obfuscated_key);

void deobfuscate(unsigned char* out) {
    for(int i = 0; i < key_len; i++) {
        out[i] = obfuscated_key[i] ^ 0x40; // XOR with 0x40
    }
}

extern "C" JNIEXPORT jboolean JNICALL
Java_org_kalkulator_security_NativeSecurity_checkDebugging(JNIEnv* env, jobject /* this */) {
    // (2) Anti-Analysis: Ptrace check
    if (ptrace(PTRACE_TRACEME, 0, 1, 0) < 0) {
        return JNI_FALSE; // Debugger detected
    }
    return JNI_TRUE;
}

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
    unsigned char key[key_len];
    deobfuscate(key);
    
    // Implementasi AES-256 CBC/GCM sesungguhnya biasanya membutuhkan library seperti OpenSSL/mbedTLS.
    // Sebagai demonstrasi "Military-Grade", hamba menyiapkan skeleton dekripsi tingkat native.
    const char* input = env->GetStringUTFChars(encryptedData, nullptr);
    std::string decrypted = "DECRYPTED_LOGIC_SKELETON_"; 
    decrypted += input; // Placeholder for actual AES logic

    env->ReleaseStringUTFChars(encryptedData, input);
    return env->NewStringUTF(decrypted.c_str());
}
