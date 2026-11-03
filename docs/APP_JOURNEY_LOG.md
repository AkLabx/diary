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

### [v1.0.7] — 2026-11-04 01:20:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Uninterrupted Weather & Mood Tracking:**
  - Your journal's weather and location badges now work seamlessly at all times, even during peak global network traffic.
  - Automatic zero-friction fallback ensures your daily reflection temperature, condition icons, and custom city searches never fail or get interrupted.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Dual-Tier Resilient Weather Provider Integration (`lib/weather.ts`):**
  - Integrated Open-Meteo API as an automatic zero-key fallback provider with 10,000 calls/day capacity.
  - Implemented WMO weather interpretation code decoder (`decodeWmoWeatherCode`) mapping all WMO standard codes into weather descriptions and day/night icon codes fully compatible with `getWeatherConditionEmoji`.
  - Added free reverse geocoding pipeline (`reverseGeocodeCoordinates`) using BigDataCloud Client API with OpenStreetMap Nominatim fallback to identify friendly city names from device GPS coordinates.
  - Implemented Open-Meteo city search geocoding (`geocoding-api.open-meteo.com`) to allow manual city lookups when primary provider limits are exceeded.
  - Updated `components/PrivacyPolicy.tsx` to reflect OpenWeatherMap and Open-Meteo weather services.
  - Verified with Playwright simulating HTTP 429 rate limit errors on OpenWeatherMap and ensuring seamless automatic switch to Open-Meteo (`verification/weather_fallback_badge.png`, `verification/weather_fallback_modal.png`, `verification/weather_fallback_custom_city.png`).

---

### [v1.0.6] — 2026-11-04 01:00:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Real-World Pyrotechnic Firecracker Refinement:**
  - Upgraded Diwali fireworks bursts from soft round bubbles to razor-sharp directional firework needle streaks, faithfully replicating real-world festival sparklers and sky-shots.
  - Added sparkling diamond glints (`✦`) and secondary mid-air branching cracklers (Diwali "chatai" crackle pops).
  - Anar flowerpots shoot ultra-fine golden needle sparks with genuine gravity waterfall cascading.
* **Flawless Mobile Center (+) Action Button:**
  - Ensured the center `+` New Entry button floats high above the bottom navigation bar with crisp drop-shadow and zero obstruction.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Sharp Needle Particle Pipeline (`lib/festiveFx.ts`):**
  - Completely replaced `ctx.arc()` circular bubble rendering with velocity-aligned tangent streaks (`ctx.moveTo(tailX, tailY); ctx.lineTo(s.x, s.y); ctx.stroke();`) with width 1.0–1.8px and round caps.
  - Added 4-point diamond sparkle glints (`ctx.fillRect` orthogonal crossbeams) at particle heads.
  - Implemented mid-air branching crackle bursts (`hasCrackle: true`) where sparks splinter into micro white-hot pops at 40% decay.
  - Verified in Playwright across ascending, exploding, and fallout phases (`verification/diwali_fireworks_fallout.png`).

---

### [v1.0.5] — 2026-11-04 00:46:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Authentic Diwali Firecracker Rockets & Anar Fountains:**
  - Tapping the Diya now triggers a full festive fireworks show right on your dashboard!
  - Recognizable Diwali sky-rockets (with wooden guide sticks, paper canister wraps, and burning fuse tails) shoot up from the bottom of your screen with an authentic rising whistle sound.
  - At their apex, rockets burst into giant, colorful chrysanthemum fireworks (emerald, ruby, saffron, and royal purple) with an explosion boom and sparkling crackle fallout.
  - Clay Anar (flowerpot) cones erupt at the bottom corners, shooting continuous golden fountains of sparkling light.
* **100% Free & Zero-Lag:**
  - Built completely using hardware-accelerated Canvas vector mathematics and Web Audio API synthesis—no external video/GIF downloads or paid Lottie packages needed.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Diwali Sky-Rocket & Anar Physics Engine (`lib/festiveFx.ts`):**
  - Designed ascending `Rocket` entities with angle calculation, trailing exhaust spark emissions, apex detection, and multi-palette chrysanthemum bursts.
  - Added bottom-ground clay Anar cones with vertical fountain velocity and gravity arc.
* **Audio Synthesis (`playRocketWhistleSound`, `playFirecrackerDetonationSound`):**
  - Generated rising sawtooth frequency sweeps through bandpass filters (rocket whistle) and low-frequency sine booms combined with high-pass randomized crackle buffers.
* **Playwright Automated Verification:**
  - Verified ascending rocket flight (`verification/diwali_rockets_ascending.png`), mid-air detonation (`verification/diwali_rockets_exploding.png`), and sparkling fallout (`verification/diwali_fireworks_fallout.png`).

---

### [v1.0.4] — 2026-11-04 00:36:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Festive Ambient Celebrations & Interactive Sparklers:**
  - A handcrafted, glowing Diwali Diya now graces your dashboard header with an authentic flickering flame and warm golden light halo.
  - Tap the Diya to light up your screen with celebratory golden sparklers, accompanied by a soothing, delicate wind-chime melody.
  - Emotional micro-interactions: Tapping any mood pill in the Quick Mood Check-in shoots out playful color-matched particles right from the button, bringing tactile warmth and delight to every reflection.
* **100% Free, Lightweight & Private:**
  - Zero heavy video/GIF files and zero remote audio downloads. All sparks and chimes are synthesized directly on your device with 120 FPS hardware acceleration.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Zero-Dependency Canvas Particle Engine (`lib/festiveFx.ts`):**
  - Implemented `createFestiveBurst(x, y, options)` rendering glowing particles via `requestAnimationFrame` and device-pixel-ratio scaling with auto canvas DOM cleanup.
* **Web Audio API Harmonic Synthesizer (`playFestiveChime`):**
  - Created mathematical chime and bubble-pop synthesizers using native browser `AudioContext` with exponential volume decay.
* **Handcrafted Vector Diya Component (`components/FestiveDiya.tsx`):**
  - Designed pure SVG clay diya with multi-stop linear gradients, radial halo blur, and GPU-composited `@keyframes flame-flicker` animation in `index.css`.
* **Verified with Playwright:**
  - Captured test screenshots in `verification/dashboard_with_festive_diya.png` and `verification/diya_sparklers_active.png`.

---

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
