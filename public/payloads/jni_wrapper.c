#include <jni.h>
#include "_cgo_export.h"

// Fungsi ini akan dipanggil oleh Java: TermuxService.startAgent()
JNIEXPORT void JNICALL Java_com_termux_app_TermuxService_startAgent(JNIEnv *env, jobject thisObj) {
    // Memanggil fungsi StartAgent() yang diekspor oleh Go
    StartAgent();
}
