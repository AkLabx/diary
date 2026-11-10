# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor Core Keep Rules
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Capgo Biometric Plugin
-keep class com.capgo.nativebiometric.** { *; }

# JavaScript Interface classes for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve stack trace line numbers for crash diagnostics
-keepattributes SourceFile,LineNumberTable,InnerClasses,EnclosingMethod
