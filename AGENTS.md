# Autonomous Agent Directives (AGENTS.md)
*Operational Governance & Architectural Invariants for the Diary App*

Welcome, Autonomous Lead Architect and Systems Engineer. You are governing this repository under the **"1 Chat = 1 Version"** autonomous system. Every interaction must operate under strict engineering discipline.

---

## 0. Decision Precedence & Cognitive Pre-Flight

### 0.1 Decision Precedence Hierarchy
When conflicting instructions or ambiguous choices arise, strictly adhere to this priority order:
1. **Explicit User Prompt** (Direct user instruction in chat).
2. **Repository Guardrails & Safety** (This file and [`docs/ai/security.md`](./docs/ai/security.md)).
3. **Existing Codebase Conventions** (Dominant patterns, libraries, and types already in code).
4. **Master Decision Ledger & Blueprint** ([`docs/DECISIONS_MASTER.md`](./docs/DECISIONS_MASTER.md) and [`docs/blueprint/`](./docs/blueprint/)).
5. **Project Documentation** ([`docs/ai/*`](./docs/ai/) and [`README.md`](./README.md)).
6. **General Best Practices** (Industry standards).

> [!NOTE]
> *Special Historical Precedence*: Code restoration of specific historical commits (specifically those containing `'date and comment code'` in `index.html`) takes precedence over newer fixes (like blank page fixes) if they conflict.

### 0.2 System-2 Cognitive Pre-Flight & Engineering Discipline
Before authoring or modifying code in any session, execute this mandatory pre-flight:
1. **Read Hot Context (<20 KB)**: Inspect ONLY [`docs/handovers/CURRENT_HANDOVER.md`](./docs/handovers/CURRENT_HANDOVER.md), [`docs/DECISIONS_MASTER.md`](./docs/DECISIONS_MASTER.md), and the active blueprint in [`docs/blueprint/`](./docs/blueprint/). Consult historical dossiers and `docs/ai/*` on-demand only.
2. **Lifecycle Simulation**: Trace data flow end-to-end: `User Action -> State Transition -> Encryption Layer -> Network -> Persistence`.
3. **Identify 3 Failure Modes**: Explicitly account for at least 3 runtime edge-case failure modes (e.g. offline disconnect, concurrent version conflict, malformed payload or keystore invalidation) before editing.
4. **Zero-Shortcut Enforcement**: Strictly ban cosmetic fake UI stubs, empty handlers, mock data bypasses, or decorative non-functional buttons. Every UI control must wire to real logic or an explicit disabled state.
5. **Read-Before-Write & Surgical Edits**: Inspect target files and verify call sites before editing. Keep diffs minimal—avoid drive-by formatting or unrelated refactors.
6. **Failure Diagnostics & Confidence Calibration**:
   - Distinguish backend connectivity (verified via isolated Node scripts) from frontend execution (verified via Playwright), as client exceptions (e.g. `ReferenceError`) can mimic network timeouts.
   - Calibrate claims as **High** (verified via build/script/Playwright), **Medium** (conceptually sound, edge cases unverified), or **Low** (uncertain—explicitly disclose gaps rather than guessing).

---

## 1. Circuit Breakers: "Stop & Ask"

Before executing planned changes, **STOP and ask the user for confirmation** if any of these boundaries are touched:
- **Blast Radius**: More than **10 files** would be created or modified in a single task.
- **Dependencies**: Any new third-party dependency (`npm` package) must be added.
- **Database Mutation**: A migration alters, drops, truncates, or transforms existing table data on Supabase project `ccgiozknvlknbrkzfcdx`.
- **Public API / Contracts**: Public APIs, shared component contracts, or exported types will break or require major refactoring.
- **Security & Auth**: Authentication flows, encryption algorithms, role permissions, or session security models change.
- **Ambiguity**: Architectural requirements are conflicting, unclear, or contradictory.

---

## 2. Stack Invariants & Architectural Boundaries

### 2.1 Technology Stack & Root Source Layout
- **Frontend Core**: React 18.2.0, Vite 5.3.1, TypeScript 5.2.2, Tailwind CSS 3.4.4 (build-time PostCSS; CDN Tailwind or inline `tailwind.config` in `index.html` is strictly forbidden).
- **Mobile Runtime**: Capacitor 8.5 (`@capacitor/android`, `@capacitor/core`, `@capgo/capacitor-native-biometric`, `@capgo/capacitor-social-login`; Android `minSdkVersion = 24`, `targetSdkVersion = 36`).
- **Root Source Layout**: Application source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`) and `routes/` reside directly in the root directory, outside `src/`. Do NOT move them into `src/`.
- **Hosting & Vite Bundling**: Hosted on GitHub Pages with base path `/diary/` in production web builds (`/` for dev and `VITE_IS_CAPACITOR=true` builds), with `public/404.html` handling SPA reloads. React, ReactDOM, React Router, and `@zip.js/zip.js` are bundled by Vite (no `importmap` in `index.html`, no `external` overrides, and **no circular Rollup `manualChunks` splits**).

### 2.2 End-to-End Encryption (E2EE) & Database Security
- **Backend Target**: Supabase project `ccgiozknvlknbrkzfcdx` (`https://ccgiozknvlknbrkzfcdx.supabase.co`). Client bundles may only contain public client vars (e.g. `VITE_SUPABASE_ANON_KEY`).
- **Zero Plaintext User Content**: Diary entry contents and titles are client-side AES-GCM 256-bit encrypted (`encrypted_entry`, `iv`) before leaving the device. Master `CryptoKey` must remain `extractable: false` and wipe on `SIGNED_OUT`.
- **Zero Cleartext Metadata**: Moods, tags, and notebook classifications are encrypted inside the ciphertext payload; database columns (`mood`, `tags`, `journal`) in `public.diaries` remain zeroed or null.
- **Master Encryption Verification (`public.profiles`)**: Stores `salt` (supports legacy `100k` and versioned `v1:iterations:salt` `600k` PBKDF2), `key_check_value`, and `key_check_iv`. Master passwords and raw keys never leave the device.
- **Encrypted Local Drafts**: IndexedDB (`diary_drafts_db` via `lib/autoSave.ts`) must partition encrypted drafts from read cache and remain user-scoped. Unencrypted drafts must never hit storage.
- **Private Storage Buckets**: `diary-images`, `diary-audio`, and `avatars` must remain **STRICTLY PRIVATE** (`public = false`). Access exclusively via short-lived signed URLs for authenticated owners.
- **Postgres Function & RLS Safety**: RPCs must use `SECURITY INVOKER` by default; `SECURITY DEFINER` is allowed only when strictly necessary with `SET search_path = public`. Strict Row Level Security (RLS) with `(SELECT auth.uid())` InitPlan subqueries is required on `profiles`, `diaries`, `media_files`, and `personal_tasks`.

### 2.3 Service Worker & PWA Isolation
- The Workbox Service Worker and manifest are generated at build time by `VitePWA` (`registerType: 'prompt'`) in `vite.config.ts` (do not reintroduce manual `public/sw.js` or `manifest.json`).
- **Strict Data Isolation**: Service Worker caches static app shell assets and pinned CDN fonts/CSS only—**it must strictly avoid caching user data, decrypted entries, or Supabase API/storage responses**.
- Manifest SVG icons (`public/pwa-icon.svg`) must specify `sizes: 'any'` and `purpose: 'any maskable'` (PNG app icons are forbidden). The `"Install App"` button must remain visible on mobile devices.

### 2.4 Routing, UI Standards & Sanitization
- **Routing**: Use React Router v7 Data Router APIs (`createHashRouter` + `RouterProvider`) with `useBlocker`. Legacy `<HashRouter>` is forbidden. Internal navigation must use `Link`; unsaved editor changes block via `useBlocker` + `ConfirmationModal` + `window.onbeforeunload`.
- **Modals & Cards**: All dialogs/alerts use native top-layer `<dialog>` / `ConfirmationModal` (native `alert()`, `confirm()` are forbidden). Timeline cards (`DiaryList.tsx`) use mood pastels (`getMoodColorClass`) and intentionally exclude image thumbnails to avoid mass signed-URL decryption bottlenecks.
- **DOMPurify & Anti-Tabnabbing**: Route HTML sanitization through `lib/sanitizeHtml.ts` with the `afterSanitizeAttributes` hook enforcing `target="_blank"` and `rel="noopener noreferrer"`.
- **Browser Target & MWG**: Target `"browserslist": ["baseline widely available"]`. Consult Modern Web Guidance first (`npx.cmd -y modern-web-guidance@latest search "<query>"`). Baseline Newly/Limited availability features require explicit `@supports` / JS feature detection with a `<= 20`-line fallback.

### 2.5 Windows Antigravity Execution Protocol (`powershell.bat`)
- Antigravity's Windows `exebox` resolves `powershell` relative to workspace root (`d:\diary-main\powershell.bat`). This forwarder must exist (and remain gitignored) re-injecting `C:\Windows\System32`, Git, GitHub CLI, and NVM Node `D:\DevTools\nvm\v22.16.0` with `-ExecutionPolicy Bypass`. See [`docs/ai/workflow.md`](./docs/ai/workflow.md#L3-L28) for the canonical recovery recipe.
- Direct `run_command` PowerShell calls must prepend `$env:PATH = "D:\DevTools\nvm\v22.16.0;$env:PATH";` and invoke **`npm.cmd`** / **`npx.cmd`** (explicit `.cmd` extension) so PowerShell never trips on blocked `.ps1` wrappers.

---

## 3. Zero-Leak Privacy & Git Rules

### 3.1 Zero-Leak Privacy Rules
- **No Hardcoded Secrets**: Never commit, log, or expose private API keys, `service_role` tokens, database connection strings, personal emails, master passwords, or local OS user paths (`C:\Users\<username>`).
- **Test Credentials Quarantine**: For automated UI/UX or Playwright verification against `http://localhost:5173`, refer exclusively to the gitignored `.agents/AGENTS.md` file or pass `TEST_EMAIL` and `TEST_PASSWORD` environment variables. Never write test credentials into tracked files or docs.

### 3.2 Automated GitHub Branch & PR Discipline
- **Never Commit Directly to `main`**: Work on an isolated branch matching the targeted version (`feat/vX.Y.Z-<name>` or `fix/vX.Y.Z-<name>`).
- **Pre-Push Credential Bridge**: Run `& "C:\Program Files\GitHub CLI\gh.exe" auth setup-git` prior to `git push` to avoid Windows Credential Manager GUI deadlocks.
- **PR & Post-Merge Sync**: Open PRs via `& "C:\Program Files\GitHub CLI\gh.exe" pr create ...`, confirm PR CI (`pr-check.yml`) is green before merging, then sync locally (`git checkout main && git pull origin main && git branch -d <branch> && git fetch --prune`).

---

## 4. The Mandatory Closeout Rule ("1 Chat = 1 Version")

> [!CRITICAL]
> **Ironclad Closeout Invariant:**
> **A chat session is NOT complete until all Phase 4 closeout steps pass cleanly, `npm run check:ritual` exits 0, the decision ledger is updated, and `docs/handovers/CURRENT_HANDOVER.md` is overwritten with the next pre-planned baton and fresh starter prompt.**

Every turn completing a development slice MUST execute the **7-Step Closeout Ritual** in [`.agents/skills/version-ritual/SKILL.md`](./.agents/skills/version-ritual/SKILL.md):
1. Create per-version dossier `docs/versions/vX.Y.Z.md` (from `docs/versions/00-template.md`).
2. Update `docs/DECISIONS_MASTER.md` (append active choices; move retired ones to Superseded).
3. Prepend user-facing + technical release notes to `docs/APP_JOURNEY_LOG.md`.
4. Mark completed steps `[x] DONE` in `docs/blueprint/` and refine the next milestone.
5. Overwrite `docs/handovers/CURRENT_HANDOVER.md` with the verified baseline, next version brief, and fresh copy-paste starter prompt.
6. Run mechanical closeout & secret scan: `npm run check:ritual` (must exit `0` and keep Hot Context `<= 20 KB`).
7. Commit, push, create PR via `gh pr create`, wait for CI green, merge to `main`, and verify clean working tree on `main`.
