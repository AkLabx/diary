# Autonomous Agent Directives (AGENTS.md)

Welcome, Autonomous AI Agent. You are pair programming on this Diary App repository. Follow this document to guide your decision-making, code generation, and safety checks.

---

## 0. Decision Precedence Hierarchy

When conflicting instructions or ambiguous choices arise, strictly follow this order of priority:
1. **Explicit User Prompt** (The user's direct instruction in chat).
2. **Repository Guardrails & Safety** (This file and [`docs/ai/security.md`](./docs/ai/security.md)).
3. **Existing Codebase Conventions** (Dominant patterns and libraries already in the code).
4. **Project Documentation** ([`docs/ai/*`](./docs/ai/) and [`README.md`](./README.md)).
5. **General Best Practices** (Industry standards).

> [!NOTE]
> *Special Historical Precedence*: Code restoration of specific historical commits (specifically those containing 'date and comment code' in `index.html`) takes precedence over newer fixes (like blank page fixes) if they conflict.

---

## 1. Session Start: Repository Discovery Phase

Before making architectural assumptions or writing code at the start of a session, inspect the workspace:
- `package.json` (Scripts, dependencies, and configured tooling).
- Lockfile (`package-lock.json` indicates `npm` is active; or `pnpm-lock.yaml`, `bun.lockb`, `yarn.lock`).
- `tsconfig.json` and bundler config (`vite.config.ts`).
- Root source layout: Core source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`) and `routes/` reside directly in root (outside `src/`).
- `README.md` and `docs/ai/memory.md` (Project overview, stack reference, and quirks).
- `.gitignore` (Ignored directories and secret patterns like `.env.local`).
- Supabase configuration & client in `lib/supabase.ts` (Target Project: `ccgiozknvlknbrkzfcdx`).

---

## 2. Circuit Breakers: "Stop and Ask"

Before executing planned changes, **STOP and ask the user for confirmation** if:
- More than **10 files** would be created or modified in a single task.
- A database migration alters, drops, or transforms existing table data on Supabase project `ccgiozknvlknbrkzfcdx`.
- A new third-party dependency (`npm` package) must be added.
- Authentication flows, security models, or route permission logic change.
- Public APIs, shared component contracts, or exported types will break.
- Architectural requirements are ambiguous or contradictory.

---

## 3. Core Priority Matrix

### [CRITICAL] Hard Invariants (Zero-Tolerance)
- **Zero Secrets & Zero Unencrypted User Data**:
  - NEVER commit, log, or expose private API keys, service role tokens, database connection strings, or user passwords. Client bundles must only contain public client keys (e.g., `VITE_SUPABASE_ANON_KEY`).
  - Diary entry contents and titles are client-side AES-GCM encrypted before transmission. NEVER alter the database or client code to store plaintext content.
  - Encrypted drafts are cached locally in IndexedDB (`diary_drafts_db` via `lib/autoSave.ts`). Unencrypted user data must never touch storage.
- **Strictly Private Media Storage**:
  - Storage buckets `diary-images`, `diary-audio`, and `avatars` must remain **STRICTLY PRIVATE** (`public = false`). Direct public access URLs are forbidden; access is granted solely via short-lived signed URLs for authenticated owners.
- **Service Worker Isolation**:
  - The Service Worker (`public/sw.js`) caches app shell and dependencies for offline capability. **It must strictly avoid caching any user data** to maintain E2EE security.
- **Data Preservation**:
  - NEVER execute destructive database operations (`DROP TABLE`, `TRUNCATE`, bulk `DELETE`) on Supabase project `ccgiozknvlknbrkzfcdx` without explicit user permission.
- **Read-Before-Write**:
  - Inspect target files and verify call sites before editing. NEVER assume a file, function, component, or export exists without checking first.
- **Postgres Function & RLS Safety**:
  - RPCs must use `SECURITY INVOKER` by default. Only use `SECURITY DEFINER` when elevated privileges are strictly necessary and `SET search_path = public` is explicitly set.
  - Strict Row Level Security (RLS) is required on `profiles`, `diaries`, and `media_files`.
- **DOMPurify & Anti-Tabnabbing**:
  - DOMPurify configuration in `DiaryEntryView.tsx` explicitly allows `<figure>`, `<figcaption>`, and `<a>` tags.
  - Must utilize the `afterSanitizeAttributes` hook to automatically set `target="_blank"` and `rel="noopener noreferrer"` on links.

### [HIGH] Process & Verification Rules
- **Dynamic Tooling & Scripts**:
  - Detect and use the repository's native package manager (`npm` via `package-lock.json`) and defined scripts in `package.json` (`npm run dev`, `npm run build`, `npm run build:android`, `npm run lint`).
- **Mandatory Verification**:
  - Before declaring any task complete, verify via `npm run build` and run ad-hoc Playwright verification scripts in `verification/` along with visual inspection of captured screenshots.
- **App Versioning Ritual**:
  - Update the app version on every PR / release by increasing it by `0.0.1` using: `npm version patch --no-git-tag-version`.
  - Ensure `VITE_APP_VERSION` in `vite.config.ts` dynamically evaluates `process.env.npm_package_version`.
  - Append release details to [`docs/APP_JOURNEY_LOG.md`](./docs/APP_JOURNEY_LOG.md) (App Version, IST timestamp UTC+5:30, user-facing release notes, technical summary, zero sensitive data).
- **Surgical Edits**:
  - Keep diffs minimal. Avoid drive-by formatting, unsolicited styling changes, or modifying unrelated code while fixing a bug or adding a feature.
- **Distinguish Facts from Recommendations & Failure Diagnosis**:
  - Distinguish between backend connectivity (verified via isolated Node.js scripts) and frontend execution (verified via Playwright), as client crashes (e.g., `ReferenceError`) can mimic network timeouts.
- **Confidence Calibration**:
  - **High**: Verified against codebase patterns and validated via project scripts/Playwright.
  - **Medium**: Works conceptually, but edge cases or platform quirks remain unverified.
  - **Low**: Uncertain about behavior or dependencies. **Explain what remains uncertain to the user instead of guessing or fabricating a solution.**

### [NORMAL] Standard Conventions
- **Respect Dominant Structure**:
  - Source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`, `routes/`) reside directly in the root directory, outside `src/`.
- **Routing Architecture**:
  - Must use `createHashRouter` and `RouterProvider` (React Router v6 Data Router) to enable features like `useBlocker`. Do not use the legacy `<HashRouter>` component.
  - Internal navigation must use `Link` from `react-router-dom` to preserve router state. Navigation blocking uses `useBlocker` + `ConfirmationModal` + `window.onbeforeunload`.
- **Styling Standards**:
  - Use build-time PostCSS/Vite Tailwind CSS. The use of CDN Tailwind (`https://cdn.tailwindcss.com`) or inline `tailwind.config` in `index.html` is strictly forbidden.
  - Diary cards use dynamic mood-based pastel classes (`getMoodColorClass` in `lib/colorUtils.ts`).
- **UI Alerts & Confirmation**:
  - User alerts and confirmations must use the reusable `ConfirmationModal` component (Tailwind-styled). Do not use native browser alerts (`alert()`, `confirm()`).
- **PWA & Web App Manifest**:
  - Increment `CACHE_NAME` in `public/sw.js` whenever core application logic changes.
  - Add external CDN dependencies and `index.css` to `urlsToCache` in `public/sw.js`.
  - SVG icons in `manifest.json` must specify `sizes: 'any'` and `purpose: 'any maskable'`. PNG icons are strictly forbidden.
  - The "Install App" button must remain visible on mobile devices.
- **Hosting & Bundling**:
  - Hosted on GitHub Pages with base path `/diary/` (maintained in `vite.config.ts`, `manifest.json`, `public/sw.js`). Reload 404s handled by `public/404.html`.
  - React, ReactDOM, and React Router are bundled by Vite. Only `@zip.js/zip.js` is loaded via CDN (`importmap` in `index.html`) and marked `external` in `vite.config.ts`.

### [OPTIONAL] Performance & Ergonomics
- **Timeline Performance**: Image thumbnails are intentionally excluded from timeline cards (`DiaryList.tsx`) to avoid performance bottlenecks caused by decrypting multiple signed URLs client-side.
- Clean component composition and reusable primitives in `components/` over deep prop drilling.

---

## 4. Specialized AI Reference Guides

Consult these modular guides for deeper context when performing specialized tasks:
- **Security & Database**: [`docs/ai/security.md`](./docs/ai/security.md)
- **Workflow & Coding Standards**: [`docs/ai/workflow.md`](./docs/ai/workflow.md)
- **Architecture & System Memory**: [`docs/ai/memory.md`](./docs/ai/memory.md)
- **App Release Log**: [`docs/APP_JOURNEY_LOG.md`](./docs/APP_JOURNEY_LOG.md)

---

## 5. Automated Testing Credentials & Local Target

For AI agents executing automated UI/UX verification, end-to-end testing, or Playwright scripts:
- **Test Email**: `testuser@diary.com`
- **Account & Master Password**: `test@4321`
- **Local Dev Server**: `http://localhost:5173`
- **Supabase Target Ref**: `ccgiozknvlknbrkzfcdx`
