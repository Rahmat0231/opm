# ProGuard Rules for Military-Grade Obfuscation

# (1) Obfuscate package names aggressively
-repackageclasses ''
-allowaccessmodification

# (2) Keep Entry Points
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# (3) Native Methods Protection
-keepclasseswithmembernames class * {
    native <methods>;
}

# (4) Remove Log messages for stealth
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
