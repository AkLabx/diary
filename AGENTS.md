# AGENTS.md - Instructions for Autonomous Agents

This file contains the strict guidelines, safety boundaries, and architectural rules for working on this Diary App project. **Agents MUST adhere to these rules implicitly for every task.**

## 1. Security & Privacy (ABSOLUTE HIGHEST PRIORITY)
Our application relies on End-to-End Encryption (E2EE) and operates primarily entirely client-side. The following constraints are non-negotiable:
*   **Zero Unencrypted Data:** Never store unencrypted user data in Supabase Storage, databases, or local `IndexedDB`.
*   **Service Worker Constraints:** The Service Worker strategy involves caching the app shell and external dependencies for offline access. **It must strictly avoid caching any user data** to maintain E2EE security. 
*   **Draft Auto-saving:** Encrypted drafts are auto-saved to `IndexedDB` using `lib/autoSave.ts` to prevent data loss. The custom database is named `diary_drafts_db`.
*   **Image/File Uploads:** Drag-and-drop image uploads in `DiaryEditor.tsx` are intercepted by custom `onDrop` handlers to route files through the secure `handleImageUpload` function. Never allow unencrypted base64 insertion by Quill. Image thumbnails are intentionally excluded from the timeline view to avoid client-side decrypting multiple signed URLs.
*   **DOMPurify Strictness:** The `DOMPurify` configuration in `DiaryEntryView.tsx` explicitly allows `<figure>`, `<figcaption>`, and `<a>` tags. You **must** utilize the `afterSanitizeAttributes` hook to automatically set `target="_blank"` and `rel="noopener noreferrer"` on links to prevent reverse tabnabbing and keep users inside the PWA.

## 2. Safety Boundaries & Execution Rules
*   **Destructive Operations:** **DO NOT** execute destructive SQL queries (e.g., `DROP`, `DELETE` without clear target, `TRUNCATE`) on the Supabase database without an explicit command from the user.
*   **Mandatory Verification:** Before considering any task complete, you **must run specific verification scripts** (such as the ad-hoc Playwright scripts located in the `verification/` directory). Visual inspection should also accompany these tests to ensure regressions are caught.
*   **App Versioning Ritual:** `VITE_APP_VERSION` in `vite.config.ts` dynamically evaluates `process.env.npm_package_version`. Update the app version on every PR by increasing it by `0.0.1` using: `npm version patch --no-git-tag-version`.
*   **Documentation & App Journey Logging Ritual (`docs/APP_JOURNEY.md`):**
    *   For ANY member of our app developer team and autonomous AI agents: all features implemented and bug fixes must be well-documented and logged in a markdown file in the `/docs` directory (specifically [`docs/APP_JOURNEY.md`](file:///d:/diary-main/docs/APP_JOURNEY.md)).
    *   Every time a version bump / PR is made, append a new log entry containing:
        1. **App Version** (e.g., `v1.0.1`).
        2. **Timestamp:** Current IST date and time (UTC+5:30).
        3. **Release Notes (User-Facing):** Written strictly from a user's perspective (e.g., for Google Play Store / Web releases), highlighting user experience improvements, daily writing benefits, peace of mind, and avoiding technical/developer jargon.
        4. **Technical Summary & Bug Fixes:** Concise technical details of changes for team members.
        5. **Zero-Sensitive-Data Rule:** Under no circumstances should sensitive information (API keys, private tokens, passwords, database credentials, or PII) be included in the logs.
*   **Architectural Memory & Context (`docs/JULES_MEMORY_CONTEXT.md`):** For complete historical context, architectural rationale, and past lessons learned by previous coding agents, agents MUST consult [`docs/JULES_MEMORY_CONTEXT.md`](file:///d:/diary-main/docs/JULES_MEMORY_CONTEXT.md). Key rules from memory (e.g., manifest SVG rules, GitHub Pages environment variables, ToolsPanel sliding overlay, etc.) must be strictly observed.
*   **Code Restoration Precedence:** Code restoration of specific commits (specifically those containing 'date and comment code' in `index.html`) takes precedence over newer fixes (like blank page fixes) if they conflict.
*   **Diagnosis of Failures:** When diagnosing application failures, distinguish between backend connectivity (verified via isolated Node.js scripts) and frontend execution (verified via Playwright), as frontend crashes (e.g., `ReferenceError`) can mimic network timeouts.

## 3. Architecture & Technical Guidelines
*   **Routing (React Router v6):** We use the `createHashRouter` API and `RouterProvider` (Data Router) to enable features like `useBlocker`. Do not use the legacy `<HashRouter>` component. Internal navigation must use the `Link` component from `react-router-dom` to maintain state. Navigation blocking uses `useBlocker` combined with the custom `ConfirmationModal` for internal navigation, and `window.onbeforeunload` for browser events.
*   **Styling (Tailwind CSS):** We use build-time PostCSS/Vite Tailwind configuration. **The use of `https://cdn.tailwindcss.com` or inline `tailwind.config` in `index.html` is strictly forbidden.** Diary entry cards use vibrant pastel Tailwind classes based on user mood (`getMoodColorClass` in `lib/colorUtils.ts`).
*   **UI Alerts:** User alerts and confirmations (specifically for unsaved changes) must use the reusable `ConfirmationModal` component (Tailwind-styled). Do not use native browser alerts.
*   **PWA & Service Worker Rules:**
    *   The `CACHE_NAME` in `public/sw.js` must be manually incremented whenever core application logic changes.
    *   External dependencies (CDN links) and `index.css` must be explicitly added to the `urlsToCache` list in `public/sw.js`.
    *   SVG icons in `manifest.json` must specify `sizes: 'any'` and `purpose: 'any maskable'`. PNG icons are strictly forbidden.
    *   The "Install App" button must remain visible on mobile devices.
*   **Hosting Context:** Hosted on GitHub Pages with a base path of `/diary/` (reflect this in `vite.config.ts`, `manifest.json`, `public/sw.js`). Frontend environment variables are intentionally bundled and exposed.
*   **Bundling Strategy:** React, ReactDOM, and React Router are bundled by Vite. Library CSS (e.g., `react-quill`) is imported in `index.tsx`. Only `@zip.js/zip.js` is loaded via CDN (`importmap` in `index.html`) and marked as `external` in `vite.config.ts`.
*   **Source File Location:** Core application source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`) and the `routes/` directory are located directly in the project root, outside of any `src/` directory.

## 4. Application Logic Specifics
*   **Data Provider (DiaryLayout.tsx):** `DiaryLayout.tsx` serves as the central data provider and handles save logic, file synchronization (audio and images), and child-route logic via `registerSaveHandler`. Image cleanup uses helper functions (`extractImagePaths`, `diffImagePaths` in `lib/cleanupUtils.ts`) to delete orphaned images from Supabase.
*   **Authentication Initialization:** In `App.tsx`, `supabase.auth.getSession()` must be wrapped in a `try...finally` block to guarantee `setLoading(false)` is called, ensuring the UI renders even if the Supabase connection fails. `components/Auth.tsx` implements specific error handling for `TypeError: Failed to fetch`.
*   **Editor & Content (Quill):** Images in the editor use a custom Quill blot (`secure-image`, `FigureBlot` in `DiaryEditor.tsx`) wrapping images in `<figure>` tags. Captions are styled via `.diary-image-figure` and `figcaption` in `index.css`. `DiaryEntryView` uses a `Lightbox` modal for viewing clicked images.
*   **Layout & Menus:** 
    *   `DiaryList.tsx` (Timeline) uses a multi-column Masonry grid (`columns-1 sm:columns-2`) with `break-inside-avoid`.
    *   `DateInteractionMenu` portalled to `document.body` and implements specific click-outside logic checking both desktop (`menuRef`) and mobile (`mobileMenuRef`).
    *   `ToolsPanel` is controlled via `isToolsPanelVisible` in `DiaryContext`.
*   **DiaryEntry Interface:** The `DiaryEntry` interface supports multiple audio recordings (up to 5, in `audio?: AudioMetadata[]`) and an optional `updated_at` field.
