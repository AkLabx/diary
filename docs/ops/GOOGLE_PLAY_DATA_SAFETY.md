# Google Play Store Data Safety & Privacy Declaration (Production Release)

**App Name**: Diary  
**Package Name**: `com.diary.app`  
**Target Audience**: 18+  
**Architecture**: Client-Side End-to-End Encrypted (AES-GCM 256-bit)  

---

## 1. Google Play Console Data Safety Questionnaire Mapping

### A. Data Collection and Security
* **Does your app collect or share any of the required user data types?**  
  **Yes**. (User email for authentication and encrypted blobs).
* **Is all of the user data collected by your app encrypted in transit?**  
  **Yes**. All network traffic uses TLS 1.3 / HTTPS. Additionally, all user-authored data (titles, contents, tags, images, voice notes) is end-to-end encrypted on the client device using AES-256-GCM before transmission.
* **Do you provide a way for users to request that their data is deleted?**  
  **Yes**. Both within the app (*Profile & Settings → Danger Zone → Delete Account*) and via an external public web URL.
* **Public Account Deletion URL**:  
  `https://aklabx.github.io/diary/#/delete-account` (or `#/delete-account`).

---

### B. Data Types Collected & Handled

| Data Category | Data Type | Collected | Shared | Ephemeral | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Info** | Email address | **Yes** | **No** | No | App functionality (Account management & authentication). |
| **Personal Info** | User IDs | **Yes** | **No** | No | Account management (Supabase Auth UID). |
| **Photos and Videos** | Photos | **Yes** | **No** | No | App functionality (Diary entry attachments; AES-256 encrypted prior to upload; developer cannot decrypt). |
| **Audio Files** | Voice / sound recordings | **Yes** | **No** | No | App functionality (Voice notes in entries; AES-256 encrypted prior to upload; developer cannot decrypt). |
| **Messages / Notes** | Personal diary reflections | **Yes** | **No** | No | App functionality (Stored as zero-knowledge AES-256 ciphertext; developer has zero keys). |
| **Location** | Coarse location (approximate) | **Yes** | **No** | **Yes** | App functionality (Weather geotagging; processed ephemerally; never stored or linked to identity). |
| **App Info & Performance** | Crash logs & diagnostics | **Yes** | **No** | No | Analytics & bug fixing (PII strictly scrubbed via `lib/telemetry.ts`). |

---

## 2. Android Manifest Runtime Permissions Declaration

| Permission | Purpose | Justification for Play Review |
| :--- | :--- | :--- |
| `android.permission.RECORD_AUDIO` | Voice Notes | Allows users to record private encrypted voice reflections inside diary entries. Audio is captured only when the user explicitly taps the microphone record button. |
| `android.permission.POST_NOTIFICATIONS` | Task Reminders | Required on Android 13+ (API 33+) to notify users of scheduled task deadlines and diary reminders configured by the user. |
| `android.permission.ACCESS_COARSE_LOCATION` | Weather Tagging | Fetches approximate local temperature and weather conditions to tag into entries upon user request. Never tracks continuous background location. |
| `android.permission.USE_BIOMETRIC` | Vault Unlock | Prompts fingerprint / biometric confirmation to unlock the local cryptographic key via Android Keystore (`FLAG_SECURE`). |

---

## 3. Account & Data Deletion Verification
- **In-App**: *Profile → Danger Zone → Delete Account & All Data*
- **Web Portal**: Route `#/delete-account`
- **Cascade Deletion**: Purges auth account, `profiles`, `diaries`, `media_files`, and storage objects in `diary-images`, `diary-audio`, and `avatars`. Zero data retained.
