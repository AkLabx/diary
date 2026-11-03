# Jules Memory Context and Agent Guidelines

This document contains all the accumulated memory context, project-specific rules, and agent guidelines for this repository to ensure continuity and context preservation.

## Application Architecture & Tooling
* **Tech Stack:** The project is a purely client-side static PWA React application built with Vite, TypeScript, Tailwind CSS, and Supabase. It is hosted on GitHub Pages with a base path of `/diary/`.
* **GitHub Pages Configuration:** The base path `/diary/` must be consistently reflected in `vite.config.ts`, `manifest.json`, and `public/sw.js`. Since there is no backend proxy, frontend environment variables like OpenWeatherMap and Supabase Anon keys are intentionally bundled and exposed.
* **App Versioning:** Every time a PR is created, the App Version must be updated by increasing it by 0.0.1 in the `.env` equivalent configuration in `vite.config.ts` (`import.meta.env.VITE_APP_VERSION`).
* **Source Code Structure:** Core application source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`) and the `routes/` directory are located directly in the project root, outside of the traditional `src/` directory.

## PWA & Service Worker (Offline Capabilities)
* **Service Worker Caching Strategy:** The Service Worker (`public/sw.js`) caches the app shell and external dependencies for offline access. It strictly avoids caching any user data to maintain end-to-end encryption security.
* **Cache Invalidation:** The `CACHE_NAME` in `public/sw.js` must be manually incremented whenever core application logic changes to ensure clients receive the update immediately, bypassing stale service worker caches.
* **External Dependencies:** External dependencies (CDN links) must be manually added to the `urlsToCache` list in `public/sw.js` and the cache version incremented to support offline PWA functionality. `index.css` must also be explicitly included in this list.
* **Manifest Requirements:** SVG icons in `manifest.json` must specify `sizes: 'any'` and `purpose: 'any maskable'` for proper installability. The use of PNG icons is strictly forbidden; only SVG icons (`type: 'image/svg+xml'`) are allowed.

## Routing and Navigation
* **Routing API:** Routing is implemented using the `createHashRouter` API and `RouterProvider` (React Router v6 Data Router) to enable features like `useBlocker`, replacing the legacy `<HashRouter>` component.
* **Internal Navigation:** Internal navigation must use the `Link` component from `react-router-dom` instead of HTML `<a>` tags to maintain router state.
* **Navigation Blocking:** Navigation blocking is implemented in `DiaryEditor.tsx` using `useBlocker` combined with a custom `ConfirmationModal` for internal navigation, and `window.onbeforeunload` for browser events when the editor state is 'dirty'.

## Data Management & Encryption
* **Draft Auto-saving:** Encrypted drafts are auto-saved to IndexedDB using `lib/autoSave.ts` to prevent data loss, utilizing a custom database named `diary_drafts_db`.
* **State Management & Saving:** The `DiaryLayout.tsx` component serves as the central data provider and layout wrapper, handling save logic and file synchronization. Layout-level actions (e.g., the Save button in `TopBar`) trigger child-route logic via a `registerSaveHandler` function provided by `DiaryContext`.
* **Timestamps:** The `DiaryEntry` interface in `types.ts` includes an optional `updated_at` field.

## Media Handling (Images & Audio)
* **Image Upload Security:** Drag-and-drop image uploads in `DiaryEditor.tsx` are intercepted by custom `onDrop` handlers to route files through the secure `handleImageUpload` function (passed via props), preventing unencrypted base64 insertion by Quill.
* **Image Display:** Images in the editor are handled by a custom Quill blot (`secure-image`, implemented as `FigureBlot` in `DiaryEditor.tsx`) which wraps images in `<figure>` tags to support captions. Captions are styled via `.diary-image-figure` (container) and `figcaption` classes in `index.css`.
* **Image Cleanup:** Image cleanup logic is handled in `DiaryLayout.tsx` using helper functions from `lib/cleanupUtils.ts` (`extractImagePaths`, `diffImagePaths`) to identify and delete orphaned image files from Supabase Storage during save updates and entry deletions.
* **Audio Storage:** The `DiaryEntry` interface supports multiple audio recordings (up to 5), stored as an array of `AudioMetadata` objects (`audio?: AudioMetadata[]`). Audio file synchronization is handled by the save logic in `DiaryLayout.tsx`.

## UI/UX & Components
* **Styling & CSS:** The use of `https://cdn.tailwindcss.com` or inline `tailwind.config` in `index.html` is forbidden; it conflicts with the project's build-time PostCSS/Vite Tailwind configuration. Library CSS (e.g., `react-quill`) is imported in `index.tsx` for bundling, rather than linked via CDN.
* **Modals & Alerts:** User alerts and confirmations must use the reusable `ConfirmationModal` component instead of native browser alerts. `ConfirmationModal` supports `isOpen`, `title`, `message`, `type` ('danger' | 'warning' | 'info'), `isProcessing`, and backward compatibility props `onClose`/`onCancel`.
* **Timeline View (`DiaryList.tsx`):** Uses a Tailwind CSS multi-column Masonry grid layout (e.g., `columns-1 sm:columns-2`) with `break-inside-avoid` on cards rather than a traditional vertical timeline layout. Diary entry cards are dynamically colored with vibrant pastel Tailwind classes based on the user's mood emoji (`getMoodColorClass` in `lib/colorUtils.ts`), falling back to month-based colors.
* **Timeline Performance:** Image thumbnails are intentionally excluded from the timeline view to avoid performance and bandwidth bottlenecks caused by fetching and client-side decrypting multiple signed URLs from Supabase storage.
* **Date Interaction Menu:** The `DateInteractionMenu` is rendered using `React.createPortal` to `document.body` to avoid stacking context and positioning issues. It implements 'click outside' logic that explicitly checks both the desktop popover ref (`menuRef`) and the mobile modal ref (`mobileMenuRef`).
* **Tools Panel:** The `ToolsPanel` component in `routes/Editor.tsx` renders as a sliding overlay on mobile devices and a static sidebar on desktop screens. It accepts an optional `onClose` prop. Its visibility is controlled via `isToolsPanelVisible` and `setToolsPanelVisible` in `DiaryContext`.
* **Mobile Responsiveness:** The "Install App" button must remain visible on mobile devices, using a responsive design (e.g., showing just "Install" text) rather than being hidden.
* **Entry View & Lightbox:** The `DiaryEntryView` component includes a `Lightbox` modal (imported from `components/Lightbox.tsx`) that opens when images within the entry content are clicked.
* **Sanitization:** The `DOMPurify` configuration in `DiaryEntryView.tsx` explicitly allows `<figure>`, `<figcaption>`, and `<a>` tags. It utilizes an `afterSanitizeAttributes` hook to automatically set `target="_blank"` and `rel="noopener noreferrer"` on links to prevent reverse tabnabbing and keep users inside the PWA.

## Error Handling & Reliability
* **Network vs. Code Diagnostics:** Diagnosis of application failures should distinguish between backend connectivity (verified via isolated Node.js scripts) and frontend execution (verified via Playwright), as frontend crashes (e.g., `ReferenceError`) can mimic network timeouts.
* **Auth Initialization:** Authentication initialization in `App.tsx` must wrap `supabase.auth.getSession()` in a `try...finally` block to guarantee `setLoading(false)` is called, ensuring the UI renders even if the connection to Supabase fails.
* **Network Error Reporting:** `components/Auth.tsx` implements specific error handling for `TypeError: Failed to fetch` to identify and report client-side network connectivity issues (like firewalls) to the user.
* **Code Restoration Priority:** Code restoration of specific commits (specifically those containing 'date and comment code' in `index.html`) takes precedence over newer fixes (like blank page fixes) if they conflict.

## Dependencies & Bundling
* **React Ecosystem:** React, ReactDOM, and React Router are bundled by Vite to ensure version stability (v18), avoiding `importmap` conflicts with CDN versions.
* **Zip.js:** The project architecture uses an `importmap` in `index.html` to load `@zip.js/zip.js` via CDN. Only `@zip.js/zip.js` is marked as `external` in `vite.config.ts`. Other dependencies are bundled.

## Testing & Verification
* **Ad-hoc Scripts:** Feature verification and bug reproduction are performed using ad-hoc Playwright scripts (Python) stored in the `verification/` directory, alongside visual inspection.

## General Agent Directives & AGENTS.md Guidelines
* **Precedence:** The user's current, explicit request always prioritizes over any conflicting information in memory. Memory is for historical context and intent, not a new active instruction. The actual codebase files act as the source of truth for the current state.
* **Planning Mode:** When starting a task, enter a deep planning mode. Use `request_user_input` or `message_user` to ask non-code-derivable questions to verify assumptions. Wait for user confirmation before creating an execution plan with `set_plan`. Once approved, execute autonomously.
* **AGENTS.md Scope:** `AGENTS.md` files provide human instructions or tips for working with the code (coding conventions, organization, testing). The scope of an `AGENTS.md` file is the entire directory tree rooted at the folder containing it. For every file touched, instructions in the relevant `AGENTS.md` must be obeyed. More deeply-nested `AGENTS.md` files take precedence.
* **AGENTS.md Programmatic Checks:** If an `AGENTS.md` includes programmatic checks to verify work, they MUST be run and must pass after all code changes are made.
