# Keystore For Release
When building for release, you will need a keystore file to sign the APK or AAB. Follow the standard process of generating a keystore.
The generated keystore file should be placed in the following location relative to the project root:

android/app/

After generating your `release-key.keystore` file and putting it in `android/app/`, open `android/app/build.gradle` and add the `signingConfigs` block inside the `android` block to configure signing using the properties from the keystore you generated.

```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file("release-key.keystore")
            storePassword "your-store-password"
            keyAlias "your-key-alias"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

Once configured, you can build a signed release APK either through Android Studio or by using the gradle command:

```bash
cd android
./gradlew assembleRelease
```
