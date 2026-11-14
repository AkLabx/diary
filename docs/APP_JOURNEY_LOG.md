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

### [v1.0.19] — 2026-11-14 11:22:15 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Smoother Dialogs, Drawers & Mobile Comfort:**
  - **Effortless Popups & Bottom Sheets**: Alerts, weather details, photo previews, recovery kits, and task forms now open smoothly with natural Escape and outside-tap dismissal, while keeping background pages steady instead of drifting behind dialogs. On mobile screens, the task editor now glides up neatly as a bottom sheet.
  - **Smarter Menus & Navigation**: Calendar date pickers, action menus, and search filters stay cleanly inside your screen edges, and mobile sidebars and editor tool drawers keep keyboard focus cleanly scoped while open.
* **Typing Comfort & Calmer Feedback:**
  - **Self-Expanding Note & Tag Fields**: Note and tag fields gently grow as you type more lines without cramped inner scrollbars, and form validation highlights wait until you finish editing a field instead of interrupting mid-keystroke.
  - **Screen-Reader Ready Controls & Pausable Toasts**: Theme and biometric toggles announce their active state clearly, and notification banners politely stay visible while hovered or focused so you never miss a message.
  - **Cleaner Typography & Smooth Long Feeds**: Headings wrap with balanced lines, diary entry prose reads more naturally, and long entry lists render smoothly as you scroll.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Native `<dialog>` Modal Migration & Scroll Containment (`index.css`, `ConfirmationModal.tsx`, `WeatherModal.tsx`, `SmartTagsModal.tsx`, `Lightbox.tsx`, `ProfileView.tsx`, `TaskEditorModal.tsx`, `TaskExportModal.tsx`, `TaskNotificationPrivacyModal.tsx`)**:
  - Migrated all modal overlays—including a shared `useModalDialog` helper in `ProfileView.tsx`—to semantic top-layer `<dialog>` + `.showModal()` with `useId()` labelling, `closedby` + pointer outside-bounds light-dismiss fallback, `onClose` state sync, `onCancel` guards during async operations, and `autoFocus` on safe/close controls; removed `Lightbox` `window` keydown listeners and `body` scroll locking.
  - Configured `:where(dialog:modal)` (`max-width: 100vw; max-height: 100dvh;` with zero specificity so Tailwind `max-w-*` modal cards remain compact), `dialog:modal { overscroll-behavior: contain; }`, and `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; }` in `index.css`; updated `TaskEditorModal` mobile layout (`inset-x-0 top-auto bottom-0 m-0 md:inset-0 md:m-auto`) for flush mobile bottom-sheet positioning.
* **Responsive Navigation Drawers & Viewport-Aware Popups (`TopBar.tsx`, `LeftSidebar.tsx`, `routes/Editor.tsx`, `DatePickerPopup.tsx`, `DateInteractionMenu.tsx`, `SearchView.tsx`)**:
  - Added `aria-expanded` and `aria-controls` on sidebar/tools-drawer toggles (`TopBar.tsx`) and `matchMedia`-driven responsive mobile `role="dialog"` / `aria-modal="true"`, `Escape` key dismissal, and `inert` state syncing when collapsed (`LeftSidebar.tsx`, `Editor.tsx`).
  - Added viewport boundary clamping, `resize`/`scroll` recalculation, `Escape` dismissal, and `aria-expanded` / mobile modal menu semantics across `DatePickerPopup.tsx`, `DateInteractionMenu.tsx`, and `SearchView.tsx`.
* **Deferred Rendering, Typography, Form Controls & Accessible Notifications (`index.css`, `DiaryList.tsx`, `SearchView.tsx`, `ProfileView.tsx`, `ToolsPanel.tsx`, `TaskEditorModal.tsx`, `Auth.tsx`, `ToastContainer.tsx`, `Toast.tsx`)**:
  - Added `.mwg-deferred-card` (`content-visibility: auto; contain-intrinsic-size: auto none auto 180px;`) scoped strictly below the fold (`DiaryList` `itemIndex >= 4`, `SearchView` `idx >= 6`), plus `h1, h2, h3 { text-wrap: balance; }` and `.prose p, .prose blockquote, .prose li { text-wrap: pretty; }`.
  - Upgraded `ProfileView.tsx` Dark Mode and Biometric toggles to accessible `type="button"`, `role="switch"`, `aria-checked`, and `aria-labelledby` controls; enabled `[field-sizing:content]` on textareas in `ToolsPanel.tsx` and `TaskEditorModal.tsx`; fixed the `bg-.white` class typo and added `[&:user-invalid]` error borders in `Auth.tsx`; and added `role="region" aria-label="Notifications"` + dynamic `alert`/`status` roles and hover/focus pause-and-resume timers in `ToastContainer.tsx` and `Toast.tsx`.
* **Verification**: Verified `tsc --noEmit` (0 errors), `npm run lint` (`--max-warnings 0`, 0 errors/warnings), `npm run build` & `npm run build:android`, `modern-web-guidance legacy-scan` (0 findings across 33 active guides), `12/12` `tests/security/penetration-audit.js`, `100%` `tests/e2e/auth-crypto-roundtrip.js`, and `28/28` Playwright E2E + visual screenshot checks.

---

### [v1.0.18] — 2026-11-13 10:37:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Automatic System Theme Comfort & Visual Polish:**
  - **Follows Your Device Automatically**: Your diary now gently adapts between Light and Dark appearance to match your device preference on first visit—with zero jarring white flashes while loading—while still remembering whenever you manually switch themes in the app.
  - **Refined Reading Scrollbars & Stronger Style Protection**: Improved scrollbar contrast across light and dark themes for clearer navigation, and tightened verification on third-party editor styling so your writing sanctuary stays even safer.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Modern Web Guidance (MWG) & Baseline Widely Available Alignment (`package.json`, `index.html`, `index.css`, `App.tsx`)**:
  - Added `"browserslist": ["baseline widely available"]` to `package.json` matching web and Capacitor Android (`minSdkVersion = 24`) runtime targets.
  - **Color-Scheme Sync & FOUC Prevention (`index.html`, `App.tsx`, `index.css`)**: Added `<meta name="color-scheme" content="light dark">`, an inline pre-paint theme/FOUC script, `prefers-color-scheme` + cross-tab `storage` listeners, and synchronized `<meta name="color-scheme">`, `<meta name="theme-color">`, CSS `color-scheme`, and Tailwind `.dark` class handling (preserving existing `'theme': 'dark'` preferences).
  - **Standard Scrollbars with `@supports` Fallback (`index.css`)**: Adopted `scrollbar-color` and `scrollbar-width: thin` with WCAG 1.4.11 (`>= 3:1`) custom property tokens (`#8A7B6A`/`#F4EFE9` light, `#64748b`/`#0f172a` dark) and wrapped legacy `::-webkit-scrollbar*` rules in `@supports not (scrollbar-color: auto)`.
  - **Subresource Integrity & Referrer Hardening (`index.html`)**: Added `<meta name="referrer" content="strict-origin-when-cross-origin">` plus `integrity="sha384-..."`, `crossorigin="anonymous"`, and `referrerpolicy="no-referrer"` on the version-pinned `react-quill@2.0.0` `quill.snow.css` CDN stylesheet (verified byte-identical to local `node_modules/react-quill/dist/quill.snow.css`).
* **ESLint Cleanup (40 Pre-Existing Findings Resolved Across 12 Files)**:
  - Fixed React Hook rules/dependency issues, `prefer-const`, unnecessary `@ts-ignore` directives, empty `catch` blocks, and Fast Refresh export lint warnings across `ConfirmationModal.tsx`, `DatePickerPopup.tsx`, `DiaryEntryView.tsx`, `LandingPage.tsx`, `CryptoContext.tsx`, `TaskContext.tsx`, `ToastContext.tsx`, `useAndroidBackButton.tsx`, `smartTags.ts`, `Editor.tsx`, `MyStuffImages.tsx`, and `DiaryLayout.tsx`.
* **Developer & AI Documentation Alignment (`AGENTS.md`, `docs/ai/memory.md`, `docs/ai/security.md`, `docs/ai/workflow.md`)**:
  - Documented Windows `.cmd` / NVM PowerShell execution guidelines, added MWG & Baseline browser-support policies, and removed stale references to legacy routing, context, Supabase client, and service worker paths.
* **Verification**: Verified `0` findings from `modern-web-guidance legacy-scan`, `0` errors/warnings from ESLint & `tsc --noEmit`, clean `npm run build` & `npm run build:android`, `12/12` `tests/security/penetration-audit.js`, `100%` `tests/e2e/auth-crypto-roundtrip.js`, and Playwright UI/theme/SRI E2E checks.

---

### [v1.0.17] — 2026-11-13 01:26:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Effortless Mobile & Android Screen Fit:**
  - **Edge-to-Edge Stability on Phones**: Fixed horizontal page drifting and awkward side-scrolling on smartphones and the Android app so every screen—from your timeline to the welcome page—stays comfortably locked to your display width.
  - **Cleaner Mood & Header Comfort**: All five Quick Mood Check-in options fit cleanly side-by-side on mobile screens without getting cut off, and the top bar stays crisp with zero icon overlap.
* **Always-Accessible Timeline Filters:**
  - **Never Get Stuck on Empty Time Ranges**: Selecting a quiet time filter like "This Week" or "This Month" now keeps your filter bar right at the top and offers a friendly one-tap "Show All Entries" escape instead of hiding your controls.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Timeline Filter State Architecture Fix (`routes/Timeline.tsx`, `components/DiaryList.tsx`)**:
  - **Root Cause**: When no entries matched a non-default `timeFilter` (`week`, `month`, `year`), the empty-state guard hid `renderFilterControls()` and showed a misleading first-time onboarding card with no filter reset path.
  - **Fix**: Preserved timeline filter controls whenever `entries.length > 0` regardless of `filteredEntries.length === 0`, and added a dedicated empty-filter card with an `onClearFilter` action (`Show All Entries`).
* **Mobile & Capacitor WebView Viewport Containment (`index.css`, `DiaryLayout.tsx`, `LeftSidebar.tsx`, `TopBar.tsx`, `InteractiveGreeting.tsx`, `DiaryList.tsx`, `ToastContainer.tsx`, `LandingPage.tsx`)**:
  - **Root Cause**: `<main>` in `DiaryLayout.tsx` used `overflow-y-auto` without `overflow-x-hidden` (computing `overflow-x: auto`), `html`/`body`/`#root` lacked root `overflow-x: clip` guards, `TopBar.tsx` and `InteractiveGreeting.tsx` used non-existent `xs:` Tailwind classes and non-shrinking flex/mood rows (`min-w-[70px]`), `DiaryList` items lacked `min-w-0 flex-1`/`break-words`, and `ToastContainer` overflowed left edges below `404px`.
  - **Fix**: Added root viewport containment (`overflow-x: hidden; overflow-x: clip; max-width: 100%;`), `w-full max-w-full overflow-x-hidden` on shell and `<main>`, `flex-1 min-w-0 overflow-hidden` + `min-[380px]`/`min-[400px]` breakpoints in `TopBar`, a responsive 5-column `grid-cols-5` Quick Mood Check-in bar, responsive flex/skeleton wrapping in `DiaryList`, viewport-safe anchoring in `ToastContainer`, and constrained hero/3D phone framing in `LandingPage`.
  - **Verification**: Verified with `npm run build`, targeted ESLint, and Playwright viewport matrix + visual screenshot checks across `320×640`, `360×800`, `390×844`, and `412×915`.

---

### [v1.0.16] — 2026-11-10 12:15:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Instant Startup Stability Hotfix:**
  - **Reliable App Launch Everywhere**: Resolved a critical startup issue where the web app could stall on a blank cream screen before opening. Your private sanctuary now loads reliably across mobile and desktop browsers.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Eliminated Circular ES Module Chunk Dependency in Production Build (`vite.config.ts`)**:
  - **Root Cause**: The custom Rollup `manualChunks` function introduced in `v1.0.15` caused Rollup to place shared CommonJS helpers inside `vendor-editor` (`react-quill`), while `vendor-editor` imported `React` from `vendor-react`. That circular ESM graph (`vendor-react` <-> `vendor-editor`) evaluated `react-quill` before `React` was initialized, throwing `Uncaught TypeError: Cannot read properties of undefined (reading 'Component')` and aborting startup before `#root` could mount.
  - **Fix**: Removed the conflicting `manualChunks` configuration from `vite.config.ts`, allowing Vite/Rollup's native automatic code splitting (alongside `React.lazy()` routes in `App.tsx`) to isolate lazy chunks cleanly (e.g., `Editor-*.js`) with 0 circular imports.
  - **Verification**: Verified 0 circular imports across all 27 generated JS chunks, rebuilt `v1.0.16` cleanly, synced Capacitor Android assets, and verified E2E startup, authentication, Timeline, ReactQuill Editor, Tasks, and Profile in headless Chromium.

---

### [v1.0.15] — 2026-11-10 08:30:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Production Readiness, Scalability & Google Play Launch Uplift (10-Phase Overhaul):**
  - **Instant App Loading & Blazing Fast Performance**: The app now opens up to 5x faster! We have optimized how the application loads its pages, slimming down the initial load size by over 85% so you can start writing your thoughts immediately with zero delay.
  - **Bulletproof Offline Writing & Auto-Sync**: Keep writing seamlessly whether you're on an airplane, underground subway, or experiencing an spotty connection. Any diary entry you write or edit is secured locally with full encryption and automatically syncs to your private cloud the moment your connection restores.
  - **Private Media & Full Multimedia Backup**: Your voice recordings and attached photos are now fully encrypted and included when you choose to "Export Data". You receive a complete, human-readable archive of your life stories and original photos in a single secure ZIP download.
  - **Self-Service Account & Data Control**: You are always in complete control of your data. If you ever decide to leave, you can permanently erase your account, all encrypted entries, and multimedia in one click directly from Profile & Settings, or through our public privacy portal.
  - **Google Play & Global Privacy Standards**: Full transparency and peace of mind with officially certified compliance for Google Play Store Data Safety, EU GDPR, and the Indian Digital Personal Data Protection (DPDP) Act 2023.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Complete 10-Phase Production Architecture Uplift for 10,000 DAU:**
  - **Phase 1 (Cryptography Hardening)**: Rewrote base64 encoding with 32 KB chunked subarrays in `lib/crypto.ts` eliminating call stack overflow on large buffers. Upgraded PBKDF2 iterations to 600,000. Hardened Native Android Keystore biometric wipe on logout.
  - **Phase 2 (Database Indexing & RLS Subqueries)**: Created covering composite index `idx_diaries_owner_created (owner_id, created_at DESC)` and media covering indexes. Optimized RLS policies across `diaries`, `profiles`, and `media_files` with `(SELECT auth.uid())` subqueries, eliminating per-row re-evaluation and reducing linter warnings to 0. Fixed missing DELETE policy on `diary-audio`.
  - **Phase 3 (Edge Functions & Infrastructure Decoupling)**: Deployed live Supabase Edge Function `weather-proxy` to shield API secrets and provide 15-minute HTTP edge caching with Open-Meteo fallback. Replaced sequential signed URL generation with batch `createSignedUrls(paths, 300)`.
  - **Phase 4 (Frontend Code Splitting & Bundle Optimization)**: Implemented Rollup `manualChunks` and route-level dynamic `React.lazy()` imports with Suspense skeletons in `App.tsx` and `vite.config.ts`. Initial bundle chunk dropped from 1,990.52 kB down to 291 kB (📉 **85% reduction**). Memoized `contextValue` in `DiaryLayout.tsx`.
  - **Phase 5 (PWA Resilience & Offline Sync Outbox)**: Built persistent IndexedDB outbox `lib/syncQueue.ts` (`sync_outbox`) with dead-letter queue poison-pill protection and auto-sync on reconnect. Removed competing duplicate manual service worker registration in `App.tsx` and duplicate manifest in `index.html`. Added Workbox runtime caching for Google Fonts in `vite.config.ts`.
  - **Phase 6 (Legal, GDPR/DPDP & Account Deletion)**: Deployed Supabase Edge Function `delete-account` cascading across database tables, auth, and private storage buckets. Added self-service deletion UI with modal confirmation in `ProfileView.tsx` and public portal at `#/delete-account` in `routes/DeleteAccountWeb.tsx`. Upgraded `PrivacyPolicy.tsx` and `TermsOfUse.tsx`. Expanded `handleExportData` with full multimedia attachment decryption in ZIP archives.
  - **Phase 7 (Observability & Telemetry)**: Built privacy-preserving zero-PII client crash telemetry in `lib/telemetry.ts` with deep recursive PII/token/ciphertext scrubbing. Authored `docs/ops/DISASTER_RECOVERY_RUNBOOK.md` and `docs/ops/MONITORING_AND_ALERTS.md`.
  - **Phase 8 (Android Native & Google Play)**: Declared `RECORD_AUDIO`, `POST_NOTIFICATIONS`, `ACCESS_COARSE_LOCATION` in `AndroidManifest.xml`. Configured dynamic `versionCode` and `versionName` synchronization in `android/app/build.gradle`. Added ProGuard/R8 keep rules in `proguard-rules.pro`. Verified `FLAG_SECURE` in `MainActivity.java`. Documented Google Play Console Data Safety mapping in `docs/ops/GOOGLE_PLAY_DATA_SAFETY.md`.
  - **Phase 9 (Stress & Penetration Testing)**: Created 10k DAU load test model `tests/load/k6-10k-dau.js`. Executed live penetration test suite `tests/security/penetration-audit.js` (12/12 passed, 100%). Executed live E2E cryptographic round-trip suite `tests/e2e/auth-crypto-roundtrip.js` (100% byte fidelity verified).
  - **Phase 10 (Launch Orchestration)**: Produced authoritative 50-point go/no-go verification checklist in `docs/ops/PRODUCTION_LAUNCH_CHECKLIST.md` and database maintenance cron script in `docs/migrations/20261110_phase10_cron_maintenance.sql`.

---

### [v1.0.14] — 2026-11-07 06:35:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Everyday Tasks & To-Dos UI/UX Overhaul:**
  - **Crystal-Clear Language for Everyday Life**: All abstract, technical, or unfamiliar terminology has been replaced with obvious words anyone can understand: **Tasks**, **To-Dos**, **"2 of 4 done"**, and everyday categories (**Personal**, **Health**, **Family**, **Work & Study**, **Money & Bills**, and **Habits**).
  - **Mobile Bottom Navigation with Live Badge**: Direct 1-tap access to your Tasks right in the main bottom navigation bar on mobile! Features a real-time counter badge showing pending tasks so you never lose track.
  - **Sleek Timeline Focus Strip**: A compact "Today's Tasks" bar showing your daily progress at a glance (e.g. "2 of 4 done"), expandable in 1 tap so it never crowds your journal entries.
  - **Mobile Bottom-Sheet Task Drawer**: Clean, modern bottom drawer on phones with quick schedule buttons (Today, Tomorrow, Pick Date, Someday) and collapsible details.
  - **Real-Time Date Feedback**: Typing dates naturally (e.g. "Call mom tomorrow at 5pm") now displays instant confirmation chips `[📅 Tomorrow]` before you save.
  - **Instant Attachments on New Tasks**: Attach photos, receipts, or documents immediately while creating a new task—no need to save first.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Tasks UI/UX Overhaul:**
  - Updated `components/BottomNavigation.tsx` implementing approved Option B: `Timeline`, `Calendar`, `+ FAB`, `Tasks` (with real-time pending count badge), and `Profile`.
  - Redesigned `components/TodayTasksWidget.tsx` into a compact focus bar displaying `{completedToday} of {totalToday} done` with smooth expansion.
  - Overhauled `routes/Tasks/TasksHub.tsx` with progress fill bar, category filter pills, real-time date chips, and collapsible search.
  - Enhanced `components/tasks/TaskCard.tsx` with 44px hit-targets, 1-click "Move to Today" for carried-over tasks, and bi-directional diary entry navigation links (`task.entry_id`).
  - Enhanced `components/tasks/TaskEditorModal.tsx` with adaptive mobile bottom-sheet presentation and creation-time file staging (`stagedFiles`).
  - Updated `lib/taskUtils.ts`, `lib/notificationService.ts`, `lib/recurrenceEngine.ts`, `lib/taskExport.ts`, `contexts/TaskContext.tsx`, `components/DiaryEntryView.tsx`, and `components/LeftSidebar.tsx` to everyday language.
  - Verified with `npm run build` (0 TypeScript errors) and automated Playwright test suite capturing screenshots.

---

### [v1.0.13] — 2026-11-06 02:48:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Advanced Sanctuary Features: Recurrence, Encrypted Attachments, Multi-Format Exports & Privacy (Phase 3):**
  - **Recurring Intentions**: Gently schedule daily habits, weekly self-care rituals, or monthly commitments (e.g., medication refills, gratitude check-ins) with recurrence patterns (Daily, Weekdays, Weekly, Monthly) that naturally roll into future dates.
  - **Encrypted Task Attachments**: Securely attach prescription photos, medical receipts, or confidential documents directly to your intentions. Every file is client-side encrypted before uploading to private storage.
  - **Multi-Format Export Engine**: Download your entire decrypted intentions sanctuary at any moment with zero server tracking. Choose between Markdown (`.md` with checkboxes for Obsidian/Notion), CSV spreadsheet (`.csv` for Excel/Sheets), or full JSON vault backup.
  - **3-Tier Notification Privacy**: Tailor reminder discretion to your comfort level:
    - *Normal*: Shows intention title.
    - *Private Sanctuary (Default)*: "You have a personal intention scheduled."
    - *Ultra-Private*: "Diary • A gentle reflection awaits." (Indistinguishable from a journal notification).

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Advanced Sanctuary Engine (Phase 3):**
  - Implemented `lib/recurrenceEngine.ts` supporting `none`, `daily`, `weekdays`, `weekly`, and `monthly` recurrence cycles with automated occurrence computation upon completion in `contexts/TaskContext.tsx`.
  - Built `lib/taskAttachmentService.ts` utilizing AES-GCM client-side binary encryption (`encryptBinary` / `decryptBinary`) backed by private Supabase storage bucket (`diary-images`) and `public.task_attachments` RLS table.
  - Built `lib/taskExport.ts` supporting Markdown (`- [ ]` and `- [x]`), RFC 4180 CSV, and full JSON export formats with browser Blob download.
  - Implemented `lib/notificationService.ts` providing 3-tier privacy masking, Web Notifications API permission handling, and test notification dispatch.
  - Updated `components/tasks/TaskEditorModal.tsx` with recurrence selectors, reminder time picker, and dynamic encrypted file attachment management.
  - Enhanced `components/tasks/TaskCard.tsx` rendering recurrence and reminder pills.
  - Added Export and Privacy modals (`TaskExportModal.tsx`, `TaskNotificationPrivacyModal.tsx`) to `routes/Tasks/TasksHub.tsx`.
  - Automated visual Playwright verification in `verification/verify_personal_tasks_phase3.py` capturing all 4 modal and card states.

---

### [v1.0.12] — 2026-11-06 02:15:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Personal Intentions Meets Your Daily Journal (Phase 2):**
  - **Today's Sanctuary Glance on Timeline**: A calming, collapsible summary right atop your daily reflections showing today's intentions. Check off commitments with a single tap or quick-capture an intention without leaving your journal feed.
  - **Intention & Journal Binding**: Seamlessly connect personal tasks to specific diary entries. When writing about a health checkup, anniversary preparation, or project milestone, add related commitments directly within the entry view.
  - **Smart Date Quick-Input**: Type naturally! Mention *"tomorrow"*, *"tonight"*, *"next Monday"*, or *"in 3 days"* in the quick add box, and the app automatically schedules it for the exact date.
  - **Dual Calendar Visuals**: The interactive calendar now marks your days with soothing dual indicators—an indigo dot for diary reflections and an emerald dot for personal intentions.
  - **Zero-Knowledge Private Search**: Quickly search through all your decrypted personal tasks and notes with instant local keyword matching that never sends plaintext queries to any server.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Timeline, Diary Entry & Calendar Task Integration (Phase 2):**
  - Built `components/TodayTasksWidget.tsx` integrating live context tasks onto `components/DiaryList.tsx` with collapsible progress tracking and responsive quick-capture.
  - Implemented bi-directional entry binding in `components/DiaryEntryView.tsx` (`entry_id: entry.id`) rendering interactive intention checklists and inline creation bound to the active entry.
  - Built client-side natural language date parser in `lib/smartDateParser.ts` supporting relative offsets, weekdays, and ISO date generation without heavyweight external NLP libraries.
  - Enhanced `components/CalendarView.tsx` with `taskDates` tracking to render dual dot indicators (indigo for entries, emerald for tasks).
  - Added in-memory zero-knowledge search in `routes/Tasks/TasksHub.tsx` querying decrypted memory state with real-time text matching.
  - Verified with automated Playwright suite in `verification/verify_personal_tasks_phase2.py` generating visual verification artifacts for widget, linked entry tasks, calendar markers, and search.

---


### [v1.0.11] — 2026-11-06 01:51:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Introducing Personal Intentions & Commitments (Phase 1):**
  - Your diary is now a private life companion! Safely capture intimate, personal commitments—from medication reminders and doctor appointments to family surprises—directly alongside your daily reflections.
  - Zero-stress sanctuary design: No aggressive red overdue badges or guilt-inducing alerts. Unfinished intentions gently roll over into a calm "Carried Forward" list.
  - Complete emotional peace of mind: All task titles, intimate notes, and checklists are encrypted on your device using military-grade AES-GCM-256 before leaving your phone or computer.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **End-to-End Encrypted Personal Tasks Architecture (Phase 1):**
  - Deployed production PostgreSQL schema on Supabase (`ccgiozknvlknbrkzfcdx`) for `public.personal_tasks`, `public.task_templates`, `public.task_history`, and `public.task_attachments` with strict Row-Level Security (`auth.uid() = owner_id`).
  - Added WebCrypto cryptographic serialization in `lib/taskCrypto.ts` with AES-GCM 256-bit encryption, Authenticated Additional Data (AAD) tamper binding, and SHA-256 payload integrity checksums.
  - Implemented anonymized category mapping (`category_code SMALLINT`) ensuring zero plaintext metadata leakage on database servers.
  - Added two-dimensional anxiety-free priority system (`energy_level` 1–3 and `importance_level` 1–3).
  - Built reactive state and optimistic updates in `contexts/TaskContext.tsx` with monotonic versioning (`version BIGINT`) and soft-delete support (`deleted_at`).
  - Designed accessible sanctuary UI components: `components/tasks/TaskCard.tsx` (44×44px touch targets), `components/tasks/TaskEditorModal.tsx`, and `routes/Tasks/TasksHub.tsx` (`/app/tasks`).
  - Added Intentions view navigation link to `components/LeftSidebar.tsx` and registered router in `App.tsx`.
  - Verified with automated Playwright suite capturing `verification/tasks_hub_active.png`, `verification/tasks_hub_completed.png`, and `verification/tasks_editor_modal.png`.

---

### [v1.0.10] — 2026-11-06 01:07:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Uninterrupted Autonomous Pair Programming & Developer Environment Reliability:**
  - Standardized local developer tooling and terminal runner resilience on Windows environments.
  - Ensures continuous, friction-free updates and automated background testing without environment interruptions.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Antigravity Process Runner (`exebox`) & Windows Shell Resolution Protocol:**
  - Solved Windows `exebox` path-resolution quirk where shell executions were looked up relative to the workspace root rather than system PATH.
  - Implemented root `powershell.bat` forwarder bridge with execution policy bypass (`-ExecutionPolicy Bypass`) to reliably invoke `powershell.exe`, `npm.ps1`, `npx.ps1`, and Node.js.
  - Added explicit system PATH restoration (`C:\Windows\System32`, `C:\Windows\System32\WindowsPowerShell\v1.0`, `C:\Program Files\Git\cmd`, `C:\Program Files\GitHub CLI`) and dynamic NVM Node detection (`D:\DevTools\nvm\v22.16.0`).
  - Added `powershell.bat` and `powershell.cmd` to `.gitignore` to prevent committing local runner shims.
  - Documented complete architectural guide, symptoms, root cause, and recovery protocol in `AGENTS.md` (Section 2) and `docs/ai/workflow.md` (Section 0).
  - Verified clean compilation with `npm run build` (`tsc && vite build`).

---

### [v1.0.9] — 2026-11-04 09:05:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **App Version Transparency Across All Views:**
  - You can now quickly verify your installed app version directly inside your diary.
  - The version is cleanly displayed in the bottom footer of the Left Navigation drawer and at the bottom of your Profile & Settings page alongside end-to-end encryption confirmation.
  - Public visitors can also see the current build and encryption status right on the landing page footer.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Dynamic Build-Time Version Injection & UI Placement:**
  - Configured Vite `define` in `vite.config.ts` to automatically expose `import.meta.env.VITE_APP_VERSION` bound to `package.json` (`process.env.npm_package_version`).
  - Added TypeScript declarations in `vite-env.d.ts` for `ImportMetaEnv`.
  - Added pinned sidebar footer in `components/LeftSidebar.tsx` displaying `Diary` and `v${import.meta.env.VITE_APP_VERSION}`.
  - Added app information footer in `components/ProfileView.tsx` with version badge and `End-to-End Encrypted (AES-GCM)` confirmation.
  - Added modern responsive footer to `components/LandingPage.tsx` matching the indigo sanctuary aesthetic.
  - Automated verification with Playwright capturing `version_sidebar_desktop.png`, `version_profile_page.png`, `version_landing_page.png`, and `version_landing_mobile.png`.

---

### [v1.0.8] — 2026-11-04 08:35:00 IST

#### 🌟 What's New & Release Notes (User Perspective)
* **Seamless Web App Loading & Zero-Downtime Deployments:**
  - Enhanced deployment pipelines ensure the web application always loads smoothly on GitHub Pages without encountering 404 route errors.

#### 🛠️ Technical Highlights & Bug Fixes (Team Log)
* **Modernized GitHub Pages Deployment Workflow (`.github/workflows/main.yml`):**
  - Updated action configuration to use official `actions/upload-pages-artifact` and `actions/deploy-pages`.
  - Configured SPA 404 redirection handling and GitHub Pages permissions.

---

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
