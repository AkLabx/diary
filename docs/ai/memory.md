# AI System Memory & Codebase Reference

*This document stores architectural context, known quirks, rate limits, and repository learnings so the agent does not repeat past mistakes.*

---

## 1. Technology Stack Reference

- **Frontend**: React 18.2.0, Vite 5.3.1, TypeScript 5.2.2, Tailwind CSS 3.4.4
- **Package Manager**: `npm` (detected from `package-lock.json`)
- **Routing**: React Router v7.9.6 / v6 Data Router (`createHashRouter` + `RouterProvider`) with `useBlocker`
- **State & Data Management**: `DiaryLayout.tsx` context provider (`DiaryContext`), encrypted drafts cached to IndexedDB (`diary_drafts_db`)
- **Backend & Database**: Supabase (Project Ref: `ccgiozknvlknbrkzfcdx`, PostgreSQL with RLS, GoTrue Auth, Private Storage Buckets)
- **Mobile Runtime**: Capacitor 8.5 (`@capacitor/android`, `@capacitor/core`, `@capgo/capacitor-native-biometric`, `@capgo/capacitor-social-login`)
- **Hosting / CI/CD**: GitHub Pages with base path `/diary/` (`https://aklabx.github.io/diary/`, deployment via `gh-pages -d dist`)
- **Rich Text Editor**: `react-quill` with custom `FigureBlot` (`secure-image`) and DOMPurify sanitization
- **Bundling Strategy**: React, ReactDOM, and React Router are bundled by Vite. Only `@zip.js/zip.js` is loaded via CDN (`importmap` in `index.html`) and marked `external` in `vite.config.ts`.

---

## 2. Known Workarounds & Repository Quirks

### GitHub Pages SPA Routing & Base Path
- The base path `/diary/` must be consistently maintained in `vite.config.ts`, `manifest.json`, and `public/sw.js`.
- SPA deep linking is protected against reload 404s via `public/404.html` and client-side hash routing (`createHashRouter`).
- Frontend environment variables (such as `VITE_SUPABASE_ANON_KEY`) are intentionally bundled and exposed for client-side static execution without backend proxies.

### PWA & Service Worker Rules
- The Service Worker (`public/sw.js`) caches the application shell and external dependencies for offline capability. **It must strictly avoid caching any user data** to maintain End-to-End Encryption security.
- Whenever core application logic changes, manually increment `CACHE_NAME` in `public/sw.js` to invalidate stale caches immediately.
- External dependencies (CDN links) and `index.css` must be explicitly added to `urlsToCache` in `public/sw.js`.
- SVG icons in `manifest.json` must specify `sizes: 'any'` and `purpose: 'any maskable'`. PNG icons are strictly forbidden.
- The "Install App" button must remain visible and accessible on mobile devices.

### Routing & Navigation
- We use the `createHashRouter` API and `RouterProvider` (Data Router) to enable route-level blocking via `useBlocker`. The legacy `<HashRouter>` component is forbidden.
- Internal navigation must always use the `Link` component from `react-router-dom` to preserve router state.
- Unsaved changes in `DiaryEditor.tsx` are blocked using `useBlocker` paired with the custom `ConfirmationModal` component for internal navigation, and `window.onbeforeunload` for browser events.

### UI / Layout Architecture
- **Root Source Architecture**: Application source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`) and the `routes/` directory are located directly in the project root, outside of any `src/` directory.
- **Styling Rules**: Build-time PostCSS/Vite Tailwind configuration is strictly required. Using `https://cdn.tailwindcss.com` or inline `tailwind.config` in `index.html` is strictly forbidden.
- **Modals & Alerts**: User alerts and confirmations must use the reusable `ConfirmationModal` component (Tailwind-styled). Do not invoke native browser alerts (`alert()`, `confirm()`).
- **Timeline Masonry Grid (`DiaryList.tsx`)**: Rendered using a Tailwind multi-column Masonry grid (`columns-1 sm:columns-2`) with `break-inside-avoid`. Diary cards use mood-based pastel classes (`getMoodColorClass` in `lib/colorUtils.ts`). Image thumbnails are intentionally excluded from timeline cards to avoid mass signed-URL decryption bottlenecks.
- **Date Interaction Menu**: Portalled to `document.body` / `portal-root` to avoid stacking context issues, with click-outside handlers checking both desktop (`menuRef`) and mobile (`mobileMenuRef`).
- **Tools Panel**: Rendered as a sliding overlay on mobile devices and a static sidebar on desktop screens, controlled via `isToolsPanelVisible` in `DiaryContext`.
- **TopBar & Mobile Sidebar Drawer**: Mobile hamburger is integrated directly within `<TopBar>`, and `<LeftSidebar>` acts as a full-height drawer (`z-50`) respecting CSS safe-area insets (`env(safe-area-inset-top)`).

### Media & Editor Specifics
- Quill custom blot `FigureBlot` (`secure-image` in `DiaryEditor.tsx`) wraps images in `<figure>` tags to support captions, styled via `.diary-image-figure` and `figcaption` in `index.css`.
- `DiaryEntryView` uses a `Lightbox` modal for viewing clicked images.
- Drag-and-drop file uploads are intercepted by custom `onDrop` handlers to route through `handleImageUpload` (preventing raw base64 insertion).
- Image cleanup functions (`extractImagePaths`, `diffImagePaths` in `lib/cleanupUtils.ts`) clean up orphaned files from Supabase Storage buckets during entry updates and deletions.
- `DiaryEntry` supports up to 5 audio recordings (`audio?: AudioMetadata[]`) and an optional `updated_at` field.

---

## 3. Historical Quirks & Diagnostic Invariants

- **Code Restoration Precedence**: Code restoration of specific historical commits (specifically those containing 'date and comment code' in `index.html`) takes precedence over newer fixes if they conflict.
- **Authentication Initialization**: In `App.tsx`, `supabase.auth.getSession()` must be wrapped in a `try...finally` block to guarantee `setLoading(false)` is invoked, ensuring the UI renders even if Supabase connectivity fails.
- **Network vs Frontend Crash Diagnostics**: `components/Auth.tsx` implements explicit handling for `TypeError: Failed to fetch`. When diagnosing application failures, verify whether the issue is backend connectivity (isolated Node.js test script) or client-side runtime errors (Playwright/DevTools console logs).

---

## 4. Automated Testing Credentials & Project Targets

For AI agents executing automated UI/UX verification, end-to-end testing, or Playwright scripts:
- **Test Email**: `testuser@diary.com`
- **Account & Master Password**: `test@4321`
- **Local Dev Server**: `http://localhost:5173`
- **Target Supabase Ref**: `ccgiozknvlknbrkzfcdx`
