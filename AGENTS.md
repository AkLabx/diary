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

## 2. Antigravity Windows Process Runner & Shell Execution Runbook (`powershell.bat`)

> [!IMPORTANT]
> **Windows Antigravity Execution Breakthrough & Self-Healing Protocol**
> If any terminal command fails immediately with `Command failed to run: The system cannot find the file specified..` or the terminal tab displays `failed to start PTY command via exebox: The system cannot find the file specified`, this section details the root cause, discoveries, and immediate resolution.

### A. The Symptoms
1. **Agent Tool Commands**: Running `git`, `npm`, `dir`, or any terminal command fails instantly:
   ```text
   Command failed to run: The system cannot find the file specified..
   ```
2. **Antigravity Terminal Panel**: Clicking `+` fails with:
   ```text
   Failed to create terminal
   [internal] internal: failed to start PTY command via exebox: The system cannot find the file specified.
   ```

### B. The Root Cause (`exebox` Path Resolution)
On Windows, Antigravity's internal process runner (`exebox`) resolves the shell command `powershell` relative to the **root of the active project workspace** rather than the Windows System `PATH`:
```text
filepath.Join(project_root, "powershell") ➔ "D:\diary-main\powershell"
```
Because no `powershell.exe` or forwarder lives in the workspace root, the OS immediately throws `ERROR_FILE_NOT_FOUND` (Win32 error 2: "The system cannot find the file specified").

### C. Breakthrough Discoveries on this Machine
1. **The Root Forwarder (`powershell.bat`)**: Placing a `powershell.bat` forwarder script directly in the project root intercepts the `exebox` resolution and redirects execution cleanly to Windows PowerShell.
2. **Gitignore Protection**: Both `powershell.bat` and `powershell.cmd` must remain in `.gitignore` to prevent committing local runner shims to GitHub.
3. **Restoring Stripped Windows System PATH**: Some Windows installers strip `C:\Windows\System32` from the environment PATH. The forwarder explicitly re-injects `C:\Windows\System32`, `C:\Windows`, and `C:\Windows\System32\WindowsPowerShell\v1.0`.
4. **Custom Node.js / NVM Location**: On this PC, Node.js is **not** installed in `C:\Program Files\nodejs`. It is managed under NVM at:
   - Primary: `D:\DevTools\nvm\v22.16.0` (Node v22.16.0, npm 10.9.2)
   - Secondary: `D:\DevTools\nvm\v20.19.2`
   Without `D:\DevTools\nvm\v22.16.0` in the injected PATH, `node` and `npm` commands fail with `ObjectNotFound: The term 'npm' is not recognized`.
5. **Execution Policy Bypass (`PSSecurityException`)**: In Windows PowerShell, running `npm` or `npx` invokes `npm.ps1`, which by default is blocked with `PSSecurityException: running scripts is disabled on this system`. Adding `-ExecutionPolicy Bypass` to the `powershell.exe` invocation in `powershell.bat` completely fixes this without requiring administrator privileges or registry modifications.
6. **Git & GitHub CLI Bridge**: Git is installed at `C:\Program Files\Git\cmd\git.exe` and GitHub CLI is at `C:\Program Files\GitHub CLI\gh.exe`. Prepending these ensures Git operations and `gh auth setup-git` always succeed.

### D. The Canonical `powershell.bat` Recipe
The file must exist at `d:\diary-main\powershell.bat` with the following exact content:
```cmd
@echo off
set "PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;D:\DevTools\nvm\v22.16.0;D:\DevTools\nvm;C:\Program Files\nodejs;%APPDATA%\npm;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%LOCALAPPDATA%\Programs\Python\Python312;%PATH%"
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass %*
```

---

## 3. Circuit Breakers: "Stop and Ask"

Before executing planned changes, **STOP and ask the user for confirmation** if:
- More than **10 files** would be created or modified in a single task.
- A database migration alters, drops, or transforms existing table data on Supabase project `ccgiozknvlknbrkzfcdx`.
- A new third-party dependency (`npm` package) must be added.
- Authentication flows, security models, or route permission logic change.
- Public APIs, shared component contracts, or exported types will break.
- Architectural requirements are ambiguous or contradictory.

---

## 4. Automated GitHub PR & Git Workflow (GitHub CLI) & Antigravity Working Method

- **Local Execution Truth**: Antigravity operates directly on the user's local disk (`D:\diary-main`). All file edits take effect locally in real time and are hot-reloaded by the Vite development server (port 5173).
- **Installed CLI**: The official GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` and authenticated as `AkLabx`.
- **Git Credential Bridge**: Run `& "C:\Program Files\GitHub CLI\gh.exe" auth setup-git` before pushing to avoid interactive GCM GUI deadlocks in background shells.

### Standard 4-Step Working Method:

1. **Step 1: Session Start & Pre-Task Branch Sync Ritual**:
   - Check current working branch:
     ```powershell
     git branch --show-current
     ```
   - Ensure local workspace is on `main` and fully synchronized:
     ```powershell
     git checkout main
     git pull origin main
     ```
   - Never build a new feature or fix on top of a stale or unmerged feature branch.

2. **Step 2: Isolated Feature Development**:
   - Create a descriptive feature branch matching the targeted bump version:
     ```powershell
     git checkout -b feat/<feature-name>-v<version>
     # or: git checkout -b fix/<bug-name>-v<version>
     ```
   - Make all changes directly in the workspace. Test with local dev server (`http://localhost:5173`).

3. **Step 3: Verification, Version Bump & PR Creation Ritual**:
   - **Verification**: Run `npm run build` (`tsc && vite build`) and `npm run lint` (plus automated Playwright verification in `verification/` where applicable) to guarantee 0 errors.
   - **Version Bump**: Increase version by `0.0.1` (`npm version patch --no-git-tag-version`), ensure `VITE_APP_VERSION` in `vite.config.ts` dynamically evaluates `process.env.npm_package_version`, and append an entry in `docs/APP_JOURNEY_LOG.md` with the current IST timestamp (UTC+5:30), user-facing release notes, and technical summary.
   - **Zero Secrets**: Ensure no sensitive credentials, API keys, service role tokens, or unencrypted data are committed.
   - **Commit and Push via GitHub CLI Bridge**:
     ```powershell
     git add .
     git commit -m "<structured commit message>"
     & "C:\Program Files\GitHub CLI\gh.exe" auth setup-git
     git push -u origin <branch-name>
     ```
   - **Open PR via CLI**:
     ```powershell
     & "C:\Program Files\GitHub CLI\gh.exe" pr create --title "<PR Title>" --body "<PR Summary Markdown>" --base main --head <branch-name>
     ```

4. **Step 4: Post-Merge Local Sync & Housekeeping Ritual**:
   - Once the PR is merged on GitHub:
     ```powershell
     git checkout main
     git pull origin main
     git branch -d <branch-name>
     git fetch --prune
     ```
   - Confirm with `git status` that the working tree is clean and up to date on `main`.

---

## 5. Core Priority Matrix

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

## 6. Specialized AI Reference Guides

Consult these modular guides for deeper context when performing specialized tasks:
- **Security & Database**: [`docs/ai/security.md`](./docs/ai/security.md)
- **Workflow & Coding Standards**: [`docs/ai/workflow.md`](./docs/ai/workflow.md)
- **Architecture & System Memory**: [`docs/ai/memory.md`](./docs/ai/memory.md)
- **App Release Log**: [`docs/APP_JOURNEY_LOG.md`](./docs/APP_JOURNEY_LOG.md)

---

## 7. Automated Testing Credentials & Local Target

For AI agents executing automated UI/UX verification, end-to-end testing, or Playwright scripts:
- **Test Email**: `testuser@diary.com`
- **Account & Master Password**: `test@4321`
- **Local Dev Server**: `http://localhost:5173`
- **Supabase Target Ref**: `ccgiozknvlknbrkzfcdx`
