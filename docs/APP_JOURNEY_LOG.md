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

### [v1.0.3] — 2026-11-03 22:48:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Warm Ambient Welcome:**
  - Opening your diary now greets you warmly with a dynamic time-of-day greeting (morning, afternoon, evening, quiet night) paired with ambient local temperature and conditions.
  - Never face an intimidating blank screen—your diary opens as an inviting sanctuary tailored to your moment.
* **1-Tap Quick Mood Check-In:**
  - Record how your heart feels with tactile, pastel mood pills (`😊 Joyful`, `😌 Calm`, `🤔 Reflective`, `🥳 Excited`, `😢 Down`).
  - Tapping a mood immediately launches a new entry with your selected emotional state already pre-filled.
* **Daily Reflection Thought Starter:**
  - Discover gentle, thought-provoking questions to spark your journaling flow (*“What was the quietest moment of your day?”*, *“What small win are you grateful for?”*).
  - Tap `✍️ Write about this` to start writing immediately, or tap `🔄 Shuffle` to explore over 15+ curated prompts. You can also hide it anytime for a minimal look.
* **🔒 100% Client-Side Privacy:**
  - All greetings, prompts, and mood associations are evaluated entirely within your browser and encrypted via client-side AES-GCM before syncing. Zero tracking, zero third-party telemetry.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Interactive Greeting Component (`<InteractiveGreeting>`):**
  - Created `components/InteractiveGreeting.tsx` with dynamic `getHours()` greeting logic, ambient weather subtitle, and tactile feedback.
  - Added 15+ curated reflective prompts with deterministic daily rotation and manual shuffle support.
  - Added dismissible state persisted in `localStorage` (`diary_hide_prompt_card`).
* **Deep-Linked Editor Prefill via Navigation Parameters:**
  - Updated `routes/Editor.tsx` and `components/InteractiveGreeting.tsx` to support `mood` and `prompt` query parameters on `/app/new`.
  - Automatically initializes entry title and content quote block when launched from reflection prompts.
* **Delightful Micro-Interactions:**
  - Added tactile scale animations (`active:scale-95`), smooth hover elevations, and responsive card gradients for both light and dark themes.
* **Mobile Bottom Navigation FAB Layering & Stacking Context Fix:**
  - Resolved an issue in components/BottomNavigation.tsx where the central Floating Action Button (+ New Entry FAB) was positioned before <nav> in the DOM and shared z-30, causing the translucent navigation bar and backdrop-blur to render on top of the button and obscure its lower half.
  - Re-ordered JSX elements so FAB renders after <nav> with explicit elevated stacking z-[35] and safe-area padding.
  - Added a crisp 4px border matching the page canvas (border-[#FBF8F3] dark:border-slate-900) and elevated shadow (shadow-xl shadow-indigo-500/40), creating an elegant docked cutout appearance.
  - Added pointer-events-none on the FAB wrapper and pointer-events-auto on the button itself to prevent accidental click blocking.
* **End-to-End Verification:**
  - Verified bundle creation with `npm run build` and ran Playwright test suites in `verification/verify_interactive_greeting.py` across mobile and desktop viewport profiles.

---

### [v1.0.2] — 2026-11-03 22:12:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Ambient Weather & Location Everywhere:**
  - Your diary now gracefully presents real-time local weather and conditions directly in the global header on mobile smartphones and desktop screens alike.
  - On phones, weather appears as a compact, non-intrusive pill (displaying current temperature and day/night condition emoji) that preserves clean whitespace and never overflows into navigation buttons.
* **Interactive Weather & Location Hub:**
  - Tapping the weather pill opens an elegant modal with detailed weather information, location source, and a single-tap refresh button.
  - If device location access is unavailable or denied, you can effortlessly set your custom city manually or switch back to GPS at any time with persistent local storage.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Responsive Header Weather Display:**
  - Removed restrictive `hidden lg:flex` breakpoint in `<TopBar>` and replaced with an adaptive, interactive button badge that gracefully scales across all viewport widths.
* **Weather & Location Modal (`<WeatherModal>`):**
  - Implemented an accessible modal using `ReactDOM.createPortal` mounted to `#portal-root` with backdrop blur, keyboard ESC dismissal, and outdoor-click handling.
* **Multi-Tiered Weather Resolution & Fallback Architecture:**
  - Enhanced `lib/weather.ts` with a 4-tier retrieval pipeline:
    1. Persistent custom city override stored in `localStorage` (`diary_custom_city`).
    2. Instant cached weather (`diary_cached_weather`) with 30-minute validity for zero layout shift.
    3. Browser GPS geolocation with timeout safety.
    4. Automatic network IP geolocation fallback via CORS-friendly `ipwho.is` when device GPS permission is not granted.
* **Emoji Condition Mapping:**
  - Added `getWeatherConditionEmoji` handling day/night codes (moon/sun, clouds, rain, snow, mist).
* **Comprehensive Verification:**
  - Verified compilation with `npm run build` and ran automated mobile & desktop Playwright suites in `verification/verify_weather_header.py`.

---

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
