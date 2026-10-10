# @capgo/capacitor-social-login

Add Google, Apple, Facebook and other social sign-ins to your Capacitor app with one plugin and one API across iOS, Android and the web.

<a href="https://capgo.app/?ref=plugin_social_login"><img src="https://capgo.app/readme-banner.svg?repo=Cap-go/capacitor-social-login" alt="Capgo - Instant updates for Capacitor" /></a>

<div align="center">
  <p><b>Capgo</b>: push fixes to your Capacitor users in minutes, build signed iOS and Android apps without a Mac, and roll back in one click.</p>
  <h2><a href="https://capgo.app/register/?ref=plugin_social_login">➡️ Get started for free</a></h2>
  <p>14-day unlimited free trial. No credit card required</p>
  <p><a href="https://capgo.app/consulting/?ref=plugin_social_login">Missing a feature? We'll build the plugin for you 💪</a></p>
</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/Cap-go/capacitor-social-login/main/assets/github-social-preview.png" alt="@capgo/capacitor-social-login for Capacitor apps" width="300" />
</p>

## Key features

- **Many providers**: Google, Apple, Facebook, Twitter (X), LinkedIn, TikTok, Telegram and generic OAuth2.
- **One API**: `initialize()`, `login()`, `logout()`, `isLoggedIn()` and `getAuthorizationCode()`.
- **Tokens**: `refresh()`, `refreshToken()`, `decodeIdToken()` and expiry helpers.
- **Native sign-in**: Sign in with Apple, Google Sign-In and the Facebook SDK on iOS, Credential Manager on Android.
- **Web OAuth**: `handleRedirectCallback()` and `openSecureWindow()` for redirect and popup flows.
- **Platforms**: iOS, Android and Web. Check the docs for each provider's setup on each platform.

## Fork Information
This plugin is a fork of [@codetrix-studio/capacitor-google-auth](https://github.com/CodetrixStudio/CapacitorGoogleAuth). We created this fork because the original plugin is "virtually" archived with no way to reach the maintainer in any medium, and only one person (@reslear) has write rights but doesn't handle native code.

If you're currently using `@codetrix-studio/capacitor-google-auth`, we recommend migrating to this plugin. You can follow our [migration guide here](https://github.com/Cap-go/capacitor-social-login/blob/main/MIGRATION_CODETRIX.md).

## About
All social logins in one plugin

This plugin implements social auth for:
- Google (with credential manager)
- Apple (with OAuth on android)
- Facebook (with latest SDK)
- Twitter/X (OAuth 2.0)
- Telegram (Login Widget)
- LinkedIn (OAuth 2.0 / OpenID Connect)
- TikTok (Login Kit / OAuth2)
- Generic OAuth2 (supports multiple providers: GitHub, Azure AD, Auth0, Okta, and any OAuth2-compliant server)

This plugin is the all-in-one solution for social authentication on Web, iOS, and Android.
It is our official alternative to the Appflow Social Login plugin.

## Ionic Auth Connect compatibility

This plugin is designed to be compatible with Ionic Auth Connect provider names using the built-in OAuth2 engine.
Use the Auth Connect preset wrapper (`SocialLoginAuthConnect`) to log in with `auth0`, `azure`, `cognito`, `okta`, and `onelogin`.

- Compatibility guide: https://github.com/Cap-go/capacitor-social-login/blob/main/docs/auth_connect_compatibility.md
- Migration guide: https://github.com/Cap-go/capacitor-social-login/blob/main/MIGRATION_AUTH_CONNECT.md
- Keycloak setup: https://github.com/Cap-go/capacitor-social-login/blob/main/docs/setup_keycloak.md

## Documentation

Best experience to read the doc here:

https://capgo.app/docs/plugins/social-login/getting-started/

## Compatibility

| Plugin version | Capacitor compatibility | Maintained |
| -------------- | ----------------------- | ---------- |
| v8.\*.\*       | v8.\*.\*                | ✅          |
| v7.\*.\*       | v7.\*.\*                | On demand   |
| v6.\*.\*       | v6.\*.\*                | ❌          |
| v5.\*.\*       | v5.\*.\*                | ❌          |

> **Note:** The major version of this plugin follows the major version of Capacitor. Use the version that matches your Capacitor installation (e.g., plugin v8 for Capacitor 8). Only the latest major version is actively maintained.

## Install

You can use our AI-Assisted Setup to install the plugin. Add the Capgo skills to your AI tool using the following command:

```bash
npx skills add https://github.com/cap-go/capacitor-skills --skill capacitor-plugins
```

Then use the following prompt:

```text
Use the `capacitor-plugins` skill from `cap-go/capacitor-skills` to install the `@capgo/capacitor-social-login` plugin in my project.
```

If you prefer Manual Setup, install the plugin by running the following commands and follow the platform-specific instructions below:

```bash
npm install @capgo/capacitor-social-login
npx cap sync
```

## Dynamic Provider Dependencies

You can configure which providers to include to reduce app size. This is especially useful if you only need specific providers.

### Configuration

Add provider configuration to your `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'MyApp',
  webDir: 'dist',
  plugins: {
    SocialLogin: {
      providers: {
        google: true,      // true = enabled (bundled), false = disabled (not bundled)
        facebook: true,   // Use false to reduce app size
        apple: true,      // Apple uses system APIs only (no third-party networking dependency)
        twitter: false   // false = disabled (not bundled)
      },
      logLevel: 1 // Warnings and errors only
    }
  }
};

export default config;
```

### Provider Configuration

- **`true`** (default): Provider is enabled - dependencies are bundled in final APK/IPA
- **`false`**: Provider is disabled - dependencies are not bundled in final APK/IPA

### Notes

- Changes require running `npx cap sync` to take effect
- If configuration is not provided, all providers default to `true` (enabled, backward compatible)
- **Important**: Disabling a provider (`false`) will make it unavailable at runtime, regardless of whether it actually adds any dependencies. The provider will be disabled even if it uses only system APIs.
- This configuration only affects iOS and Android platforms; it does not affect the web platform.
- **Important**: Using `false` means the dependency won't be bundled, but the plugin code still compiles against it. Ensure the consuming app includes the dependency if needed.
- **Facebook**: When `facebook: false`, the Facebook SDK is omitted and the plugin compiles a provider stub in its own package, no `com.facebook.*` classes are shipped (avoids privacy-scanner false positives).
- **Apple (iOS)**: `apple: true` enables Sign in with Apple (AuthenticationServices). Redirect URL and backend token exchange use Foundation URLSession, so no third-party networking library is required. `apple: false` disables Apple authentication at runtime, including basic Sign in with Apple, consistent with the rule above that `false` providers are unavailable at runtime.
- Apple Sign-In on Android uses OAuth flow without external SDK dependencies
- Twitter uses standard OAuth 2.0 flow without external SDK dependencies

### Example: Reduce App Size

To only include Google Sign-In and disable others:

```typescript
plugins: {
  SocialLogin: {
    providers: {
      google: true,      // Enabled
      facebook: false,   // Disabled (not bundled)
      apple: true,       // Enabled
      twitter: false     // Disabled (not bundled)
    }
  }
}
```

## Apple

[How to get the credentials](https://github.com/Cap-go/capacitor-social-login/blob/main/docs/setup_apple.md)
[How to setup redirect url](https://github.com/Cap-go/capacitor-social-login/blob/main/docs/apple_redirect_url.png)

### Android configuration

For android you need a server to get the callback from the apple login. As we use the web SDK .

Call the `initialize` method with the `apple` provider

```typescript
await SocialLogin.initialize({
  apple: {
    clientId: 'your-client-id',
    redirectUrl: 'your-redirect-url',
  },
});
const res = await SocialLogin.login({
  provider: 'apple',
  options: {
    scopes: ['email', 'name'],
  },
});
```

### iOS configuration

call the `initialize` method with the `apple` provider

```typescript
await SocialLogin.initialize({
  apple: {
    clientId: 'your-client-id', // it not used at os level only in plugin to know which provider initialize
  },
});
const res = await SocialLogin.login({
  provider: 'apple',
  options: {
    scopes: ['email', 'name'],
  },
});
```

## Facebook

Docs: [How to setup facebook login](https://capgo.app/docs/plugins/social-login/facebook/)

📘 **[Complete Facebook Business Login Guide](./docs/facebook_business_login.md)** - Learn how to access Instagram, Pages, and business features

### Facebook Business Login

This plugin fully supports Facebook Business Login for accessing business-related features and permissions. Business accounts can request additional permissions beyond standard consumer login, including Instagram and Pages management.

Works on **iOS**, **Android**, and **Web**. After login, use `providerSpecificCall` to fetch business fields (e.g., `instagram_business_account`, Pages) on every platform.

**Supported Business Permissions:**
- `instagram_basic` - Access to Instagram Basic Display API
- `instagram_manage_insights` - Access to Instagram Insights
- `pages_show_list` - List of Pages the person manages
- `pages_read_engagement` - Read engagement data from Pages
- `pages_manage_posts` - Manage posts on Pages
- `business_management` - Manage business assets
- And many more - see [Facebook Permissions Reference](https://developers.facebook.com/docs/permissions/reference)

**Configuration Requirements:**
1. Your Facebook app must be configured as a Business app in the Facebook Developer Console
2. Business permissions may require Facebook's App Review before production use
3. Your app must comply with Facebook's Business Use Case policies

**Example - Instagram Basic Access:**
```typescript
await SocialLogin.initialize({
  facebook: {
    appId: 'your-business-app-id',
    clientToken: 'your-client-token',
  },
});

const res = await SocialLogin.login({
  provider: 'facebook',
  options: {
    permissions: [
      'email',
      'public_profile',
      'instagram_basic',           // Instagram account info
      'pages_show_list',           // List of managed Pages
      'pages_read_engagement'      // Page engagement data
    ],
  },
});

// Access Instagram data through Facebook Graph API
const profile = await SocialLogin.providerSpecificCall({
  call: 'facebook#getProfile',
  options: {
    fields: ['id', 'name', 'email', 'instagram_business_account'],
  },
});
```

**Example - Pages Management:**
```typescript
const res = await SocialLogin.login({
  provider: 'facebook',
  options: {
    permissions: [
      'email',
      'pages_show_list',
      'pages_manage_posts',
      'pages_read_engagement',
    ],
  },
});

// Fetch user's managed pages with Instagram accounts
const profile = await SocialLogin.providerSpecificCall({
  call: 'facebook#getProfile',
  options: {
    fields: ['id', 'name', 'accounts{id,name,instagram_business_account}'],
  },
});
```

**Important Notes:**
- Testing: You can test business permissions with test users and development apps without App Review
- Production: Most business permissions require Facebook App Review before going live
- Rate Limits: Business APIs have different rate limits - review Facebook's documentation
- Setup: Follow [Facebook Business Integration Guide](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/business-integrations)

### Android configuration

More information can be found here: https://developers.facebook.com/docs/android/getting-started

Then call the `initialize` method with the `facebook` provider

```typescript
await SocialLogin.initialize({
  facebook: {
    appId: 'your-app-id',
    clientToken: 'your-client-token',
  },
});
const res = await SocialLogin.login({
  provider: 'facebook',
  options: {
    permissions: ['email', 'public_profile'],
  },
});
```

### iOS configuration

In file `ios/App/App/AppDelegate.swift` add or replace the following:

```swift
import UIKit
import Capacitor
import FBSDKCoreKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        FBSDKCoreKit.ApplicationDelegate.shared.application(
            application,
            didFinishLaunchingWithOptions: launchOptions
        )

        return true
    }

    ...

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        if (FBSDKCoreKit.ApplicationDelegate.shared.application(
            app,
            open: url,
            sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as? String,
            annotation: options[UIApplication.OpenURLOptionsKey.annotation]
        )) {
            return true;
        } else {
            return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
        }
    }
}

```

Add the following in the `ios/App/App/info.plist` file inside of the outermost `<dict>`:

```xml

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>fb[APP_ID]</string>
        </array>
    </dict>
</array>
<key>FacebookAppID</key>
<string>[APP_ID]</string>
<key>FacebookClientToken</key>
<string>[CLIENT_TOKEN]</string>
<key>FacebookDisplayName</key>
<string>[APP_NAME]</string>
<key>LSApplicationQueriesSchemes</key>
<array>
    <string>fbapi</string>
    <string>fbauth</string>
    <string>fb-messenger-share-api</string>
    <string>fbauth2</string>
    <string>fbshareextension</string>
</array>
```

More information can be found here: https://developers.facebook.com/docs/facebook-login/ios


Then call the `initialize` method with the `facebook` provider

```typescript
await SocialLogin.initialize({
  facebook: {
    appId: 'your-app-id',
  },
});
const res = await SocialLogin.login({
  provider: 'facebook',
  options: {
    permissions: ['email', 'public_profile'],
  },
});
```

## Google

[How to get the credentials](https://github.com/Cap-go/capacitor-social-login/blob/main/docs/setup_google.md)

### Complete Configuration Example

For Google login to work properly across all platforms, you need different client IDs and must understand the requirements for each mode:

```typescript
await SocialLogin.initialize({
  google: {
    webClientId: 'YOUR_WEB_CLIENT_ID',        // Required for Android and Web
    iOSClientId: 'YOUR_IOS_CLIENT_ID',        // Required for iOS
    iOSServerClientId: 'YOUR_WEB_CLIENT_ID',  // Required for iOS offline mode and server authorization (same as webClientId)
    mode: 'online',  // 'online' or 'offline'
  }
});
```

**Important Notes:**
- `webClientId`: Required for Android and Web platforms
- `iOSClientId`: Required for iOS platform
- `iOSServerClientId`: Required when using `mode: 'offline'` on iOS or when you need to verify the token on the server (should be the same value as `webClientId`)
- `mode: 'offline'`: Returns only `serverAuthCode` for backend authentication, no user profile data, and `refresh()` is not available in-app. Exchange `serverAuthCode` on your backend and refresh there.
- `mode: 'online'`: Returns user profile data and access tokens (default)

### Android configuration

The implementation use the new library of Google who use Google account at Os level, make sure your device does have at least one google account connected

Call the `initialize` method with the `google` provider:

```typescript
await SocialLogin.initialize({
  google: {
    webClientId: 'your-web-client-id', // Required: the web client id for Android and Web
  },
});
const res = await SocialLogin.login({
  provider: 'google',
  options: {
    scopes: ['email', 'profile'],
  },
});
```

#### Android troubleshooting (Credential Manager, SHA-1, and Firebase)

On Android this plugin uses **Google Credential Manager** (`androidx.credentials` + Sign in with Google), not the legacy `GoogleSignInClient` API. Logcat errors such as `GetCredentialCustomException: [28444] Developer console is not set up correctly` come from that stack.

Filter Logcat with `GoogleProvider` or `CapgoSocialLogin` after a failed login. The plugin logs your **package name**, **signing SHA-1**, and a masked **webClientId** to help compare against Google Cloud Console.

##### Required Google Cloud setup (all in the same project)

You need **two kinds** of OAuth 2.0 client IDs:

| Client type | Used for | Where it goes |
|-------------|----------|---------------|
| **Web application** | Server / ID token audience | `webClientId` in `SocialLogin.initialize()` |
| **Android** (one per signing key) | Proves your APK is allowed to call Google | Google Cloud Console only, **do not** pass this ID to `webClientId` |

Common mistake: using the **Android** client ID as `webClientId`. Credential Manager requires the **Web** client ID there. The Android client only needs the correct **package name + SHA-1** registered in the console.

Create one Android OAuth client for **each** certificate that signs builds you test:

- **Debug**, from `./gradlew signingReport` (debug variant)
- **Release**, from the APK/AAB you actually install (see below)
- **Play App Signing**, from Play Console → **App integrity** → **App signing key certificate** (required for Play Store builds even if your upload key SHA-1 is already registered)

The `applicationId` in `android/app/build.gradle` must match the Android OAuth client package name exactly (including any `.debug` suffix if you use one).

If the OAuth consent screen is in **Testing** mode, add every Google account you test with under **Audience → Test users**. Publishing the app to Production is **not** required for `email` / `profile` scopes. **Digital Asset Links** (`assetlinks.json`) are **not** required for Sign in with Google via Credential Manager.

Google Cloud changes can take **up to a few hours** to propagate; a device restart alone may not be enough.

##### Error `[28444] Developer console is not set up correctly`

This almost always means Google rejected the combination of **installed APK signing certificate**, **package name**, and **webClientId`. Work through this checklist:

1. Confirm `webClientId` is the **Web application** client ID (ends with `.apps.googleusercontent.com`).
2. Run the app, reproduce the failure, and read Logcat (`GoogleProvider`) for `signingSha1=` and `package=`.
3. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), open your **Android** OAuth client and verify that **exact** package name and SHA-1 are listed.
4. If testing a **release** build, register the SHA-1 from that build, not only the debug keystore.
5. If the app is distributed via **Play Store**, also register the **Play App Signing** SHA-1.
6. Ensure Web and Android clients live in the **same** Google Cloud project.
7. If consent screen is in Testing, confirm the Google account is a **test user**.
8. Wait and retry after console changes.

`USER_CANCELLED` after picking an account on a misconfigured debug build can still be a SHA-1 / client-ID mismatch, fix the console setup above first.

##### Error `[16] Account reauth failed`

This error comes from Google Credential Manager when re-authenticating a cached Google account fails. It often affects **only some users** on the same build while others sign in normally.

**Automatic recovery:** On the first `[16]` failure, the plugin clears Credential Manager credential-selection state and retries once with the standard sign-in UI (`filterByAuthorizedAccounts: false`). No app code change is required for this retry.

If the retry still fails for specific users, check:

1. **OAuth consent screen**, must be **External** (Internal / Workspace-only blocks consumer `@gmail.com` accounts).
2. **Testing mode**, every failing Google account must be listed under **Audience → Test users**.
3. **Sign in with Google setting**, the user may have disabled your app under Google Account → **Sign in with Google**.
4. **Family Link / supervised accounts**, ensure `filterByAuthorizedAccounts` is not explicitly set to `true` (the default is `false`; see [Family Link section](#google-sign-in-with-family-link-supervised-accounts) below).
5. **Play App Signing SHA-1**, still required for Play Store builds even when most users succeed (some device/account paths are stricter).
6. **Explicit override**, if your app sets `filterByAuthorizedAccounts: true`, set it back to `false` for affected users; the default already skips authorized-account filtering.

After a failure, filter Logcat for `GoogleProvider`, the plugin logs `package`, `signingSha1`, and `webClientId`.

##### Extract SHA-1 from the build you install

Debug / local builds:

```bash
cd android && ./gradlew signingReport
```

Signed release APK:

```bash
keytool -printcert -jarfile android/app/release/app-release.apk
```

Then add that SHA-1 to an Android OAuth client (package name + SHA-1) in Google Cloud Console, reinstall the **same** signed APK, and test again:

```bash
adb install android/app/release/app-release.apk
```

##### Reading the login result (Firebase and backends)

Tokens are nested under `result`:

```ts
const login = await SocialLogin.login({ provider: 'google' });
const idToken = login.result?.idToken; // not login.idToken
```

For Firebase Auth, create credentials with that `idToken` and use the **Web** Client ID as `webClientId` in `initialize`.

### iOS configuration

Call the `initialize` method with the `google` provider:

```typescript
await SocialLogin.initialize({
  google: {
    iOSClientId: 'your-ios-client-id',           // Required: the iOS client id
    iOSServerClientId: 'your-web-client-id',     // Required for offline mode: same as webClientId
    mode: 'online',  // 'online' for user data, 'offline' for server auth code only
  },
});
const res = await SocialLogin.login({
  provider: 'google',
  options: {
    scopes: ['email', 'profile'],
  },
});
```

**Offline Mode Behavior:**
When using `mode: 'offline'`, the login response will only contain:
```typescript
{
  provider: 'google',
  result: {
    serverAuthCode: 'auth_code_for_backend',
    responseType: 'offline'
  }
  // Note: No user profile data is returned in offline mode
}
```

`serverAuthCode` is for your backend. In offline mode you should exchange it on your server for access and refresh tokens, then refresh those tokens on the server side. Calling `SocialLogin.refresh({ provider: 'google' ... })` is not supported in offline mode.

### Web

Initialize method to create a script tag with Google lib. We cannot know when it's ready so be sure to do it early in web otherwise it will fail.

On Web, Google `refresh()` is not implemented, even when using `mode: 'online'`. Call `SocialLogin.login({ provider: 'google', ... })` again to obtain a fresh token.

## Telegram

Telegram uses the [Login Widget](https://core.telegram.org/widgets/login) (`oauth.telegram.org`), not standard OAuth2. Create a bot with [@BotFather](https://t.me/BotFather), set the domain for the widget, and pass the **bot id** (not the bot token):

```typescript
await SocialLogin.initialize({
  telegram: {
    botId: '123456789',
    redirectUrl: 'https://your-app.example/auth/telegram', // or myapp://telegram-auth on native
    // Required on native when redirectUrl is a custom scheme
    origin: 'https://your-app.example',
    requestAccess: 'write',
  },
});

const res = await SocialLogin.login({
  provider: 'telegram',
  options: {},
});

// Verify `res.result.hash` on your backend with the bot token.
// Reject stale or future `res.result.authDate` values before creating a session.
// Never ship the bot token in the app.
console.log(res.result.profile.id, res.result.hash);
```

## LinkedIn

LinkedIn is a convenience wrapper around the generic OAuth2 engine (OpenID Connect `userinfo`).

Register a web app in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) with the **Sign In with LinkedIn using OpenID Connect** product, then:

```typescript
await SocialLogin.initialize({
  linkedin: {
    clientId: 'your-linkedin-client-id',
    redirectUrl: 'https://your-app.example/auth/linkedin',
    // Optional: only if your LinkedIn app is a confidential client
    // clientSecret: 'your-linkedin-client-secret',
  },
});

const res = await SocialLogin.login({
  provider: 'linkedin',
  options: {
    // defaults to 'openid profile email'
  },
});

console.log(res.result.accessToken?.token);
console.log(res.result.resourceData); // LinkedIn userinfo payload
```

You can still configure LinkedIn yourself via `oauth2.linkedin` if you need custom endpoints.

## TikTok

TikTok Login Kit is a convenience wrapper around the generic OAuth2 engine. The plugin sends `client_key` (not `client_id`) and uses TikTok's v2 authorize/token endpoints. Login exchanges the authorization code in the plugin and does not return that code for backend exchange.

Create a TikTok developer app, enable Login Kit, and register your redirect URL, then:

```typescript
await SocialLogin.initialize({
  tiktok: {
    clientKey: 'your-tiktok-client-key',
    redirectUrl: 'https://your-app.example/auth/tiktok',
    // Optional confidential-client secret; prefer PKCE for public apps
    // clientSecret: 'your-tiktok-client-secret',
  },
});

const res = await SocialLogin.login({
  provider: 'tiktok',
  options: {
    // defaults to 'user.info.basic'
  },
});

console.log(res.result.accessToken?.token);
```

You can still configure TikTok yourself via `oauth2` plus `clientIdParamName: 'client_key'`.

## OAuth2 (Generic)

The plugin supports generic OAuth2 authentication, allowing you to integrate with any OAuth2-compliant provider (GitHub, Azure AD, Auth0, Okta, Keycloak, custom servers, etc.). You can configure multiple OAuth2 providers simultaneously.

For Keycloak, use the generic OAuth2 provider with your realm issuer URL. See the [Keycloak setup guide](./docs/setup_keycloak.md).

### Multi-Provider Configuration

```typescript
await SocialLogin.initialize({
  oauth2: {
    // GitHub OAuth2
    github: {
      appId: 'your-github-client-id',
      authorizationBaseUrl: 'https://github.com/login/oauth/authorize',
      accessTokenEndpoint: 'https://github.com/login/oauth/access_token',
      redirectUrl: 'myapp://oauth/github',
      scope: 'read:user user:email',
      pkceEnabled: true,
    },
    // Azure AD OAuth2
    azure: {
      appId: 'your-azure-client-id',
      authorizationBaseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      accessTokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      redirectUrl: 'myapp://oauth/azure',
      scope: 'openid profile email',
      pkceEnabled: true,
      resourceUrl: 'https://graph.microsoft.com/v1.0/me',
    },
    // Auth0 OAuth2
    auth0: {
      appId: 'your-auth0-client-id',
      authorizationBaseUrl: 'https://your-tenant.auth0.com/authorize',
      accessTokenEndpoint: 'https://your-tenant.auth0.com/oauth/token',
      redirectUrl: 'myapp://oauth/auth0',
      scope: 'openid profile email offline_access',
      pkceEnabled: true,
      additionalParameters: {
        audience: 'https://your-api.example.com',
      },
    },
  },
});
```

## Auth Connect Presets (Auth0, Azure AD, Cognito, Okta, OneLogin)

If you want the same provider names as Ionic Auth Connect, use the preset wrapper. It maps those providers to the existing OAuth2 engine.

```typescript
import { SocialLoginAuthConnect } from '@capgo/capacitor-social-login';

await SocialLoginAuthConnect.initialize({
  authConnect: {
    auth0: {
      domain: 'https://your-tenant.auth0.com',
      clientId: 'your-auth0-client-id',
      redirectUrl: 'myapp://oauth/auth0',
      audience: 'https://your-api.example.com',
    },
    azure: {
      tenantId: 'common',
      clientId: 'your-azure-client-id',
      redirectUrl: 'myapp://oauth/azure',
    },
    okta: {
      issuer: 'https://dev-12345.okta.com/oauth2/default',
      clientId: 'your-okta-client-id',
      redirectUrl: 'myapp://oauth/okta',
    },
  },
});

const auth0Result = await SocialLoginAuthConnect.login({
  provider: 'auth0',
});
```

Notes:
- Presets can be overridden: any `oauth2` entry with the same provider key (for example, `oauth2: { auth0: ... }`) overrides the preset for that provider.
- If your provider uses non-standard endpoints, override `authorizationBaseUrl`, `accessTokenEndpoint`, `resourceUrl`, or `logoutUrl` in the preset.

### Login with a Specific Provider

```typescript
// Login with GitHub
const githubResult = await SocialLogin.login({
  provider: 'oauth2',
  options: {
    providerId: 'github',  // Required: must match key from initialize()
  },
});

// Login with Azure AD
const azureResult = await SocialLogin.login({
  provider: 'oauth2',
  options: {
    providerId: 'azure',
    scope: 'openid profile email',  // Optional: override default scopes
  },
});

console.log('Access Token:', azureResult.result.accessToken?.token);
console.log('ID Token:', azureResult.result.idToken);
console.log('User Data:', azureResult.result.resourceData);
```

### Check Login Status

```typescript
const status = await SocialLogin.isLoggedIn({
  provider: 'oauth2',
  providerId: 'github',  // Required for OAuth2
});
console.log('Is logged in:', status.isLoggedIn);
```

### Logout

```typescript
await SocialLogin.logout({
  provider: 'oauth2',
  providerId: 'github',  // Required for OAuth2
});
```

### Refresh Token

```typescript
await SocialLogin.refresh({
  provider: 'oauth2',
  options: {
    providerId: 'github',  // Required for OAuth2
  },
});
```

### OAuth2 Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `appId` | string | Yes | OAuth2 Client ID |
| `issuerUrl` | string | No* | OpenID Connect issuer URL for discovery (*Use this or an authorization endpoint) |
| `authorizationBaseUrl` / `authorizationEndpoint` | string | No* | Authorization endpoint URL aliases for the same setting (*Use one alias or `issuerUrl`) |
| `accessTokenEndpoint` / `tokenEndpoint` | string | No* | Token endpoint URL aliases for the same setting (*Required for code flow without `issuerUrl`) |
| `redirectUrl` | string | Yes | Callback URL for OAuth redirect |
| `responseType` | 'code' \| 'token' | No | OAuth flow type (default: 'code') |
| `pkceEnabled` | boolean | No | Enable PKCE (default: true) |
| `scope` | string | No | Default scopes to request |
| `resourceUrl` | string | No | URL to fetch user profile after auth |
| `additionalParameters` | Record<string, string> | No | Extra params for authorization URL |
| `additionalResourceHeaders` | Record<string, string> | No | Extra headers for resource request |
| `logoutUrl` | string | No | URL to open on logout |
| `androidUseCustomTabs` | boolean | No | Android-only: use Chrome Custom Tabs instead of WebView (default: false). Requires a deep-linkable `redirectUrl` |
| `logsEnabled` | boolean | No | Enable debug logging (default: false) |

### Platform-Specific Notes

**iOS**: Uses `ASWebAuthenticationSession` for secure authentication.

**Android**: Uses an embedded WebView by default. Set `androidUseCustomTabs: true` to use Chrome Custom Tabs instead (RFC 8252 / system browser). Custom Tabs require a custom-scheme or App Link `redirectUrl` with a matching intent filter in your app's `AndroidManifest.xml`, and `android:launchMode="singleTask"` (or `singleTop`) on the main activity so redirects arrive via `onNewIntent`.

**Web**: Opens a popup window for OAuth flow.

### Security Recommendations

1. **Always use PKCE** (`pkceEnabled: true`) for public clients
2. **Use authorization code flow** (`responseType: 'code'`) instead of implicit flow
3. **Store tokens securely** using [@capgo/capacitor-persistent-account](https://github.com/Cap-go/capacitor-persistent-account)
4. **Use HTTPS** for all endpoints and redirect URLs in production

## Troubleshooting


### Invalid Privacy Manifest (ITMS-91056)
If you get this error on App Store Connect:

> ITMS-91056: Invalid privacy manifest - The PrivacyInfo.xcprivacy file from the following path is invalid: ...

**How to fix:**
- Make sure your app's `PrivacyInfo.xcprivacy` is valid JSON, with only Apple-documented keys/values.
- Do not include a privacy manifest in the plugin, only in your app.

### Google Play Console AD_ID Permission Error

**Problem**: After submitting your app to Google Play, you receive this error:
```
Google Api Error: Invalid request - This release includes the com.google.android.gms.permission.AD_ID permission
but your declaration on Play Console says your app doesn't use advertising ID.
```

**Root Cause**: The Facebook SDK includes `AD_ID` and other advertising-related permissions.

**Solution**: If you're not using Facebook login, set `facebook: false` in your `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,  // Completely excludes Facebook SDK and its permissions
        apple: true,
      },
    },
  },
};
```

Then run `npx cap sync`. The plugin uses stub classes instead of the real Facebook SDK, so no Facebook dependencies or permissions are included in your build.

### Google Sign-In `[28444] Developer console is not set up correctly` (Android)

On Android, this error comes from **Google Credential Manager** when the installed APK's signing certificate, package name, or `webClientId` does not match Google Cloud Console.

See [Android troubleshooting (Credential Manager, SHA-1, and Firebase)](#android-troubleshooting-credential-manager-sha-1-and-firebase) for the full checklist. After a failed login, filter Logcat for `GoogleProvider`, the plugin prints `package`, `signingSha1`, and `webClientId` to compare with your OAuth clients.

### Google Sign-In `[16] Account reauth failed` (Android)

Credential Manager returns this when re-authenticating a previously used Google account fails. It can affect a **subset of users** on the same app version.

The plugin automatically clears Credential Manager credential-selection state and retries once with the standard account picker. If login still fails for specific accounts, see the `[16] Account reauth failed` subsection under [Android troubleshooting](#android-troubleshooting-credential-manager-sha-1-and-firebase) (OAuth consent External vs Internal, test users, Family Link, Sign in with Google account setting).

### Google Sign-In with Family Link Supervised Accounts

**Problem**: When users try to sign in with Google accounts supervised by Family Link, login fails with:

```text
NoCredentialException: No credentials available
```

or, in some cases:

```text
[16] Account reauth failed
```

**Root Cause**: Family Link supervised accounts have different authentication requirements and may not work properly with certain Google Sign-In configurations.

**Solution**:
When implementing Google Sign-In for apps that need to support Family Link accounts, use the following configuration:

```typescript
import { SocialLogin } from '@capacitor/social-login';

// For Family Link accounts, disable filtering by authorized accounts
await SocialLogin.login({
  provider: 'google',
  options: {
    style: 'bottom', // or 'standard'
    filterByAuthorizedAccounts: false, // Important for Family Link (default is false; set explicitly when using bottom UI)
    scopes: ['profile', 'email']
  }
});
```

**Key Points**:
- Do not set `filterByAuthorizedAccounts` to `true` when supporting Family Link accounts (default is `false`)
- The plugin will automatically retry with 'standard' style if 'bottom' style fails with NoCredentialException
- These options only affect Android; iOS handles Family Link accounts normally
- The error message will suggest disabling `filterByAuthorizedAccounts` if login fails

**Note**: Other apps like Listonic work with Family Link accounts because they use similar configurations. The default settings may be too restrictive for supervised accounts.

## Where to store access tokens?

You can use the [@capgo/capacitor-persistent-account](https://github.com/Cap-go/capacitor-persistent-account) plugin for this.

This plugin stores data in secure locations for native devices.

For Android, it will store data in Android's Account Manager, which provides system-level account management.
For iOS, it will store data in the Keychain, which is Apple's secure credential storage.

## API

<docgen-index>

* [`initialize(...)`](#initialize)
* [`login(...)`](#login)
* [`logout(...)`](#logout)
* [`isLoggedIn(...)`](#isloggedin)
* [`getAuthorizationCode(...)`](#getauthorizationcode)
* [`refresh(...)`](#refresh)
* [`refreshToken(...)`](#refreshtoken)
* [`handleRedirectCallback()`](#handleredirectcallback)
* [`decodeIdToken(...)`](#decodeidtoken)
* [`getAccessTokenExpirationDate(...)`](#getaccesstokenexpirationdate)
* [`isAccessTokenAvailable(...)`](#isaccesstokenavailable)
* [`isAccessTokenExpired(...)`](#isaccesstokenexpired)
* [`isRefreshTokenAvailable(...)`](#isrefreshtokenavailable)
* [`providerSpecificCall(...)`](#providerspecificcall)
* [`getPluginVersion()`](#getpluginversion)
* [`openSecureWindow(...)`](#opensecurewindow)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### initialize(...)

```typescript
initialize(options: InitializeOptions) => Promise<void>
```

Initialize the plugin

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#initializeoptions">InitializeOptions</a></code> |

--------------------


### login(...)

```typescript
login<T extends "apple" | "google" | "facebook" | "twitter" | "linkedin" | "tiktok" | "oauth2" | "telegram">(options: Extract<LoginOptions, { provider: T; }>) => Promise<{ provider: T; result: ProviderResponseMap[T]; }>
```

Login with the selected provider

| Param         | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#extract">Extract</a>&lt;{ provider: 'facebook'; options: <a href="#facebookloginoptions">FacebookLoginOptions</a>; }, { provider: T; }&gt; \| <a href="#extract">Extract</a>&lt;{ provider: 'google'; options: <a href="#googleloginoptions">GoogleLoginOptions</a>; }, { provider: T; }&gt; \| <a href="#extract">Extract</a>&lt;{ provider: 'apple'; options: <a href="#appleprovideroptions">AppleProviderOptions</a>; }, { provider: T; }&gt; \| <a href="#extract">Extract</a>&lt;{ provider: 'twitter'; options: <a href="#twitterloginoptions">TwitterLoginOptions</a>; }, { provider: T; }&gt; \| <a href="#extract">Extract</a>&lt;{ provider: 'telegram'; options: <a href="#telegramloginoptions">TelegramLoginOptions</a>; }, { provider: T; }&gt; \| <a href="#extract">Extract</a>&lt;{ provider: 'linkedin'; options: <a href="#linkedinloginoptions">LinkedInLoginOptions</a>; }, { provider: T; }&gt; \| <a href="#extract">Extract</a>&lt;{ provider: 'tiktok'; options: <a href="#tiktokloginoptions">TikTokLoginOptions</a>; }, { provider: T; }&gt; \| <a href="#extract">Extract</a>&lt;{ provider: 'oauth2'; options: <a href="#oauth2loginoptions">OAuth2LoginOptions</a>; }, { provider: T; }&gt;</code> |

**Returns:** <code>Promise&lt;{ provider: T; result: ProviderResponseMap[T]; }&gt;</code>

--------------------


### logout(...)

```typescript
logout(options: { provider: 'apple' | 'google' | 'facebook' | 'twitter' | 'telegram' | 'linkedin' | 'tiktok' | 'oauth2'; providerId?: string; }) => Promise<void>
```

Logout

| Param         | Type                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ provider: 'apple' \| 'google' \| 'facebook' \| 'twitter' \| 'linkedin' \| 'tiktok' \| 'oauth2' \| 'telegram'; providerId?: string; }</code> |

--------------------


### isLoggedIn(...)

```typescript
isLoggedIn(options: isLoggedInOptions) => Promise<{ isLoggedIn: boolean; }>
```

IsLoggedIn

| Param         | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| **`options`** | <code><a href="#isloggedinoptions">isLoggedInOptions</a></code> |

**Returns:** <code>Promise&lt;{ isLoggedIn: boolean; }&gt;</code>

--------------------


### getAuthorizationCode(...)

```typescript
getAuthorizationCode(options: AuthorizationCodeOptions) => Promise<AuthorizationCode>
```

Get the current authorization code

| Param         | Type                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| **`options`** | <code><a href="#authorizationcodeoptions">AuthorizationCodeOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#authorizationcode">AuthorizationCode</a>&gt;</code>

--------------------


### refresh(...)

```typescript
refresh(options: LoginOptions) => Promise<void>
```

Refresh the access token

| Param         | Type                                                  |
| ------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#loginoptions">LoginOptions</a></code> |

--------------------


### refreshToken(...)

```typescript
refreshToken(options: RefreshTokenOptions) => Promise<OAuth2LoginResponse>
```

OAuth2 refresh-token helper (feature parity with Capawesome OAuth).

Scope:
- Applies to the built-in `oauth2` provider and the LinkedIn and TikTok convenience wrappers.
- Requires a token endpoint (either `accessTokenEndpoint`/`tokenEndpoint` or `issuerUrl` discovery).

Security note:
- This does not validate JWT signatures. It only exchanges/refreshes tokens.

If `refreshToken` is omitted, the plugin will attempt to use the stored refresh token (if available).

| Param         | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| **`options`** | <code><a href="#refreshtokenoptions">RefreshTokenOptions</a></code> |

**Returns:** <code>Promise&lt;<a href="#oauth2loginresponse">OAuth2LoginResponse</a>&gt;</code>

--------------------


### handleRedirectCallback()

```typescript
handleRedirectCallback() => Promise<LoginResult | null>
```

Web-only: handle the OAuth redirect callback and return the parsed result.

Notes:
- This is only meaningful on Web. iOS/Android implementations will reject.
- Intended for redirect-based flows (e.g. `oauth2` with `flow: 'redirect'`) where the page navigates away.
- LinkedIn convenience logins (`provider: 'linkedin'`, `flow: 'redirect'`) return `provider: 'linkedin'`.
  The same app used as `oauth2` with `providerId: 'linkedin'` keeps `provider: 'oauth2'`.

**Returns:** <code>Promise&lt;<a href="#loginresult">LoginResult</a> | null&gt;</code>

--------------------


### decodeIdToken(...)

```typescript
decodeIdToken(options: { idToken?: string; token?: string; }) => Promise<{ claims: Record<string, any>; }>
```

Decode a JWT (typically an OIDC ID token) into its claims.

Notes:
- Accepts both `idToken` and `token` to match common naming (Capawesome uses `token`).
- This does not validate the signature or issuer/audience. It only base64url-decodes the payload.

**`email_verified` semantics by provider (for account linking):**
- **Google** — ID token includes `email_verified` (boolean). When `true`, Google attests
  the user controls that email. Verify the JWT on your backend before trusting it.
- **Apple** — ID token includes `email_verified` (boolean). When `true`, Apple attests
  the user controls that email (including private relay). Verify the JWT on your backend.
- **Meta (Facebook)** — Limited Login OIDC tokens may include `email` but **do not**
  include `email_verified`. The presence of `email` is not the same guarantee as
  `email_verified: true` from Google or Apple. Do not link accounts by email across
  providers using Meta claims alone; perform your own email verification if needed.

| Param         | Type                                               |
| ------------- | -------------------------------------------------- |
| **`options`** | <code>{ idToken?: string; token?: string; }</code> |

**Returns:** <code>Promise&lt;{ claims: <a href="#record">Record</a>&lt;string, any&gt;; }&gt;</code>

--------------------


### getAccessTokenExpirationDate(...)

```typescript
getAccessTokenExpirationDate(options: { accessTokenExpirationDate: number; }) => Promise<{ date: string; }>
```

Convert an access token expiration timestamp (milliseconds since epoch) to an ISO date string.

This is a pure helper (feature parity with Capawesome OAuth) and does not depend on provider state.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code>{ accessTokenExpirationDate: number; }</code> |

**Returns:** <code>Promise&lt;{ date: string; }&gt;</code>

--------------------


### isAccessTokenAvailable(...)

```typescript
isAccessTokenAvailable(options: { accessToken: string | null; }) => Promise<{ isAvailable: boolean; }>
```

Check if an access token is available (non-empty).

This is a pure helper (feature parity with Capawesome OAuth) and does not depend on provider state.

| Param         | Type                                          |
| ------------- | --------------------------------------------- |
| **`options`** | <code>{ accessToken: string \| null; }</code> |

**Returns:** <code>Promise&lt;{ isAvailable: boolean; }&gt;</code>

--------------------


### isAccessTokenExpired(...)

```typescript
isAccessTokenExpired(options: { accessTokenExpirationDate: number; }) => Promise<{ isExpired: boolean; }>
```

Check if an access token is expired.

This is a pure helper (feature parity with Capawesome OAuth) and does not depend on provider state.

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code>{ accessTokenExpirationDate: number; }</code> |

**Returns:** <code>Promise&lt;{ isExpired: boolean; }&gt;</code>

--------------------


### isRefreshTokenAvailable(...)

```typescript
isRefreshTokenAvailable(options: { refreshToken: string | null; }) => Promise<{ isAvailable: boolean; }>
```

Check if a refresh token is available (non-empty).

This is a pure helper (feature parity with Capawesome OAuth) and does not depend on provider state.

| Param         | Type                                           |
| ------------- | ---------------------------------------------- |
| **`options`** | <code>{ refreshToken: string \| null; }</code> |

**Returns:** <code>Promise&lt;{ isAvailable: boolean; }&gt;</code>

--------------------


### providerSpecificCall(...)

```typescript
providerSpecificCall<T extends ProviderSpecificCall>(options: { call: T; options: ProviderSpecificCallOptionsMap[T]; }) => Promise<ProviderSpecificCallResponseMap[T]>
```

Execute provider-specific calls

| Param         | Type                                                                  |
| ------------- | --------------------------------------------------------------------- |
| **`options`** | <code>{ call: T; options: ProviderSpecificCallOptionsMap[T]; }</code> |

**Returns:** <code>Promise&lt;ProviderSpecificCallResponseMap[T]&gt;</code>

--------------------


### getPluginVersion()

```typescript
getPluginVersion() => Promise<{ version: string; }>
```

Get the native Capacitor plugin version

**Returns:** <code>Promise&lt;{ version: string; }&gt;</code>

--------------------


### openSecureWindow(...)

```typescript
openSecureWindow(options: OpenSecureWindowOptions) => Promise<OpenSecureWindowResponse>
```

Opens a secured window for OAuth2 authentication.
For web, you should have the code in the redirected page to use a broadcast channel to send the redirected url to the app
Something like:
```html
&lt;html&gt;
&lt;head&gt;&lt;/head&gt;
&lt;body&gt;
&lt;script&gt;
  const searchParams = new URLSearchParams(location.search)
  if (searchParams.has("code")) {
    new BroadcastChannel("my-channel-name").postMessage(location.href);
    window.close();
  }
&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
```
For mobile, you should have a redirect uri that opens the app, something like: `myapp://oauth_callback/`
And make sure to register it in the app's info.plist:
```xml
&lt;key&gt;CFBundleURLTypes&lt;/key&gt;
&lt;array&gt;
   &lt;dict&gt;
      &lt;key&gt;CFBundleURLSchemes&lt;/key&gt;
      &lt;array&gt;
         &lt;string&gt;myapp&lt;/string&gt;
      &lt;/array&gt;
   &lt;/dict&gt;
&lt;/array&gt;
```
And in the AndroidManifest.xml file:
```xml
&lt;activity&gt;
   &lt;intent-filter&gt;
      &lt;action android:name="android.intent.action.VIEW" /&gt;
      &lt;category android:name="android.intent.category.DEFAULT" /&gt;
      &lt;category android:name="android.intent.category.BROWSABLE" /&gt;
      &lt;data android:host="oauth_callback" android:scheme="myapp" /&gt;
   &lt;/intent-filter&gt;
&lt;/activity&gt;
```

| Param         | Type                                                                        | Description                                 |
| ------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| **`options`** | <code><a href="#opensecurewindowoptions">OpenSecureWindowOptions</a></code> | - the options for the openSecureWindow call |

**Returns:** <code>Promise&lt;<a href="#opensecurewindowresponse">OpenSecureWindowResponse</a>&gt;</code>

--------------------


### Interfaces


#### InitializeOptions

| Prop           | Type                                                                                                                                                                | Description                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **`oauth2`**   | <code><a href="#record">Record</a>&lt;string, <a href="#oauth2providerconfig">OAuth2ProviderConfig</a>&gt;</code>                                                   | OAuth2 provider configurations. Supports multiple providers by using a <a href="#record">Record</a> with provider IDs as keys. |
| **`telegram`** | <code>{ botId: string; redirectUrl?: string; origin?: string; requestAccess?: 'read' \| 'write'; languageCode?: string; }</code>                                    | Telegram Login Widget configuration. Uses Telegram's OAuth widget (`oauth.telegram.org`), not standard OAuth2.                 |
| **`linkedin`** | <code><a href="#linkedinproviderconfig">LinkedInProviderConfig</a></code>                                                                                           | LinkedIn configuration. Convenience wrapper that maps to the OAuth2 provider using LinkedIn defaults.                          |
| **`tiktok`**   | <code><a href="#tiktokproviderconfig">TikTokProviderConfig</a></code>                                                                                               | TikTok Login Kit configuration. Convenience wrapper that maps to the OAuth2 provider using TikTok defaults (`client_key`).     |
| **`twitter`**  | <code>{ clientId: string; redirectUrl: string; defaultScopes?: string[]; forceLogin?: boolean; audience?: string; }</code>                                          |                                                                                                                                |
| **`facebook`** | <code>{ appId: string; clientToken?: string; locale?: string; }</code>                                                                                              |                                                                                                                                |
| **`google`**   | <code>{ iOSClientId?: string; iOSServerClientId?: string; webClientId?: string; mode?: 'online' \| 'offline'; hostedDomain?: string; redirectUrl?: string; }</code> |                                                                                                                                |
| **`apple`**    | <code>{ clientId?: string; redirectUrl?: string; useProperTokenExchange?: boolean; useBroadcastChannel?: boolean; }</code>                                          |                                                                                                                                |


#### OAuth2ProviderConfig

Configuration for a single OAuth2 provider instance

| Prop                                       | Type                                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Default                      |
| ------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **`appId`**                                | <code>string</code>                                             | The OAuth 2.0 client identifier (App ID / Client ID). Note: this configuration object is only used by the plugin's built-in `oauth2` provider (i.e. `SocialLogin.initialize({ oauth2: { ... } })`). It does not affect Google/Apple/Facebook/Twitter.                                                                                                                                                                                                                                                                                                                                                   |                              |
| **`clientId`**                             | <code>string</code>                                             | Alias for `appId` to match common OAuth/OIDC naming (`clientId`). If both are provided, `appId` takes precedence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |                              |
| **`issuerUrl`**                            | <code>string</code>                                             | OpenID Connect issuer URL (enables discovery via `/.well-known/openid-configuration`). When set, you may omit explicit endpoints like `authorizationBaseUrl` and `accessTokenEndpoint`. Notes: - Explicit endpoints (authorization/token/logout) take precedence over discovered values. - Discovery is supported for `oauth2` on Web, iOS, and Android.                                                                                                                                                                                                                                                |                              |
| **`authorizationBaseUrl`**                 | <code>string</code>                                             | The base URL of the authorization endpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                              |
| **`authorizationEndpoint`**                | <code>string</code>                                             | Alias for `authorizationBaseUrl` (to match common OAuth/OIDC naming).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |                              |
| **`clientSecret`**                         | <code>string</code>                                             | OAuth 2.0 client secret for token requests (e.g., when exchanging the code). When provided, this value is sent using `clientSecretParamName` (default `client_secret`).                                                                                                                                                                                                                                                                                                                                                                                                                                 |                              |
| **`clientIdParamName`**                    | <code>string</code>                                             | Override the client identifier parameter name used for authorization and token requests. Some providers (e.g. TikTok) expect `client_key` instead of the default `client_id`.                                                                                                                                                                                                                                                                                                                                                                                                                           | <code>'client_id'</code>     |
| **`clientSecretParamName`**                | <code>string</code>                                             | Override the client secret parameter name used for token requests. Useful for providers that expect a different parameter name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | <code>'client_secret'</code> |
| **`accessTokenEndpoint`**                  | <code>string</code>                                             | The URL to exchange the authorization code for tokens Required for authorization code flow                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |                              |
| **`tokenEndpoint`**                        | <code>string</code>                                             | Alias for `accessTokenEndpoint` (to match common OAuth/OIDC naming).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                              |
| **`redirectUrl`**                          | <code>string</code>                                             | Redirect URL that receives the OAuth callback
