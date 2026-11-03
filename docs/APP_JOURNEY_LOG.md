# 📔 Diary App Journey & Milestone Release Log

This document records the evolution of our application across versions, logging every major feature implemented, architectural milestone, and bug fix.

---

## 📌 Release Logging Policy & Development Ritual

> [!IMPORTANT]
> **Mandatory Ritual for ALL Developers and Autonomous AI Agents:**
> 1. **Trigger**: Record an entry when releasing a version, tagging a milestone, or completing a major feature.
> 2. **Version Bump**: Bump the version in `package.json` by `0.0.1` using:
>    ```bash
>    npm version patch --no-git-tag-version
>    ```
> 3. **Vite Dynamic Version**: Ensure `VITE_APP_VERSION` in `vite.config.ts` dynamically evaluates `process.env.npm_package_version`.
> 4. **Log Entry Structure**: Append a new entry at the **top** of the Version History below containing:
>    - **App Version** (matching `package.json`).
>    - **Timestamp**: Current Indian Standard Time (IST, UTC+5:30).
>    - **Release Notes (User-Facing)**: Written strictly from a user's perspective (e.g., Google Play Store / App Store release notes), highlighting emotional benefits, peace of mind, writing comfort, and avoiding developer jargon.
>    - **Technical Implementation & Bug Fixes**: Clear, concise technical summary for the developer team.
>    - **Zero-Secret Rule**: Under NO circumstances should sensitive credentials (API keys, passwords, access tokens, database URIs, or personal user data) be included.
> 5. **Exclusions**: Routine minor chore commits and internal formatting tweaks do not require separate log entries.

---

## 🚀 Releases & Milestones

### [v1.0.1] — 2026-11-03 14:23:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Polished Smartphone Experience:**
  - The side menu button (three-dash icon) now rests comfortably inside the top navigation bar, with generous touch padding designed specifically for one-handed mobile use.
  - No more awkward overlapping, clipped buttons, or crowded headers—your diary's header adapts gracefully across modern smartphone displays, notches, and status bars.
  - Smooth, seamless access to your journals, calendar, and private search with single-tap precision.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Mobile-First TopBar & Side Drawer Overlay:**
  - Replaced decoupled `fixed top-3 left-4` standalone hamburger button with an integrated, vertically centered button directly inside `<TopBar>`.
  - Transformed mobile `<LeftSidebar>` into a true full-height drawer (`fixed inset-y-0 left-0 z-50 h-full w-72 max-w-[85vw]`), preventing it from getting clipped/cut off below the TopBar and behind BottomNavigation.
  - Layered stacking context appropriately: Base Content (`z-0`), TopBar (`z-20`), Bottom Navigation & FAB (`z-30`), Modal Backdrop (`z-40`), and Left Drawer (`z-50`).
  - Removed fragile `pl-12 md:pl-16` spacers and eliminated layout shifts caused by multi-line header flex-wrapping on narrow screens.
  - Implemented CSS safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) in both `<TopBar>` and `<LeftSidebar>` to ensure compatibility with modern smartphone notches, punch-holes, and dynamic islands.
  - Added `viewport-fit=cover` to `<meta name="viewport">` in `index.html`.
  - Replaced deprecated imports and cleaned up unused locals in `DiaryLayout.tsx`.
  - Verified visual rendering on mobile viewports (390x844) via automated Playwright test scripts (`verification/mobile_dashboard.png`, `verification/sidebar_open.png`, `verification/sidebar_closed_by_backdrop.png`).

---

### [v1.0.0] — 2026-11-03 12:48:51 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Your Thoughts, Truly Yours (End-to-End Encrypted):** Write your most personal reflections with absolute peace of mind. Your journal entries, private photos, and voice notes are secured on your device before they ever touch the cloud—nobody else, not even us, can read them.
* **Biometric & Instant Access:** Unlock your diary in a heartbeat using your fingerprint or device passkey, keeping your memories secure without having to type your master password every time.
* **Express Yourself in Rich Media:**
  - Insert private photos with custom captions directly into your thoughts.
  - Record voice memos for moments that words can't capture.
  - Tag your mood and watch your timeline reflect the colors of your emotional journey.
* **Memories Rediscovered ("On This Day"):** Revisit where you were and what you felt on this day in past months and years.
* **Seamless Wherever You Are:** Use the app seamlessly on the web or as an installed app on Android with full offline support and instant hardware back-button navigation.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Client-Side Cryptography:**
  - AES-GCM 256-bit encryption with PBKDF2 (100k iterations) key derivation (`lib/crypto.ts`).
  - Private salt, key verification iv & check value stored in Supabase `profiles`.
  - Zero unencrypted data in local or cloud storage.
* **Draft Auto-Saving:**
  - Background encrypted drafts cached to IndexedDB (`diary_drafts_db` via `lib/autoSave.ts`).
* **Security & DOM Hardening:**
  - DOMPurify configured with `afterSanitizeAttributes` hook enforcing `target="_blank"` and `rel="noopener noreferrer"` to prevent reverse tabnabbing.
* **UI & Navigation:**
  - React Router v6 Data Router (`createHashRouter` + `RouterProvider`) with `useBlocker` protection for unsaved work.
  - Dynamic Masonry grid on Timeline (`DiaryList.tsx`) with mood-based pastel accents (`lib/colorUtils.ts`).
  - Android native back-button interceptor via Capacitor (`lib/native/useAndroidBackButton.tsx`).
* **Media & Cloud Management:**
  - Quill custom `FigureBlot` for secure figure/figcaption image embedding.
  - Supabase Storage buckets configured (`diary-images`, `diary-audio`, `avatars`).
  - Orphan image cleanup utilities (`lib/cleanupUtils.ts`).
* **Toolchain & Versioning:**
  - `VITE_APP_VERSION` in `vite.config.ts` dynamically bound to `process.env.npm_package_version`.
  - PWA service worker generating offline cache without storing any user data.
