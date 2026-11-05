# AI Coding Standards & Development Workflow

## 0. Antigravity Windows Process Runner & Shell Execution Protocol (`powershell.bat`)

> [!IMPORTANT]
> **Windows Antigravity Execution Protocol & Self-Healing Guide**
> On Windows, Antigravity's internal process runner (`exebox`) resolves `powershell` relative to the workspace root (`filepath.Join(project_root, "powershell")`). Without a forwarder in the project root, any terminal command or new terminal tab fails immediately with:
> `Command failed to run: The system cannot find the file specified..`

### Breakthrough Discoveries & Setup:
1. **Root Forwarder Script (`powershell.bat`)**: Must exist in the project root (`d:\diary-main\powershell.bat`) to intercept `exebox` calls and route them cleanly to Windows PowerShell.
2. **Gitignore Protection**: `powershell.bat` and `powershell.cmd` must remain in `.gitignore` so they are never committed to remote repositories.
3. **Restoring Stripped Windows System PATH**: The forwarder explicitly re-injects `C:\Windows\System32`, `C:\Windows`, and `C:\Windows\System32\WindowsPowerShell\v1.0`.
4. **Machine-Specific Node.js / NVM Location**: On this host PC, Node.js is located at `D:\DevTools\nvm\v22.16.0` (Node v22.16.0, npm 10.9.2), with fallback at `D:\DevTools\nvm\v20.19.2`. Adding this to the forwarder's PATH ensures `npm`, `npx`, and `node` resolve instantly.
5. **PowerShell Script Execution Policy (`PSSecurityException`)**: Windows PowerShell blocks running scripts like `npm.ps1` by default. Launching `powershell.exe -ExecutionPolicy Bypass %*` bypasses this policy restriction without requiring registry or admin changes.
6. **Git & GitHub CLI Location**: Git is at `C:\Program Files\Git\cmd` and GitHub CLI is at `C:\Program Files\GitHub CLI`. Prepending these ensures Git operations and `gh auth setup-git` always succeed.

### Canonical `powershell.bat` Content:
```cmd
@echo off
set "PATH=C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0;C:\Program Files\Git\cmd;C:\Program Files\GitHub CLI;D:\DevTools\nvm\v22.16.0;D:\DevTools\nvm;C:\Program Files\nodejs;%APPDATA%\npm;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%LOCALAPPDATA%\Programs\Python\Python312;%PATH%"
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass %*
```

---

## 1. Dynamic Tooling & Package Manager Detection
Before executing commands, inspect the workspace lockfile to detect the active package manager:
- `package-lock.json` → Use `npm` *(Current workspace package manager)*
- `pnpm-lock.yaml` → Use `pnpm`
- `bun.lockb` / `bun.lock` → Use `bun`
- `yarn.lock` → Use `yarn`

Inspect `package.json` for defined verification scripts. Prefer the project's configured commands:
- Dev server: `npm run dev`
- Typecheck & Build: `npm run build` (`tsc && vite build`)
- Android Build: `npm run build:android` (`tsc --noEmit && cross-env VITE_IS_CAPACITOR=true vite build`)
- Linter: `npm run lint`
- GitHub Pages Deploy: `npm run deploy` (`gh-pages -d dist`)

---

## 2. Verification Protocol

Before declaring any task complete or submitting code changes, execute the following verification steps:

1. **Targeted Validation**: First verify only the specific component, route, or utility modified.
2. **Typecheck & Build**: Run `npm run build` to ensure TypeScript compilation and Vite bundling pass without error.
3. **Automated Playwright Verification**:
   - Run verification scripts in the `verification/` directory (e.g., `verify_app_2.py`, `verify_app_3.py`, `verify_captions.py`, `verify_install_button.py`).
   - Inspect captured visual screenshots in `verification/` to ensure no layout regressions or clipping occurred.
4. **Failure Diagnostics**:
   - Distinguish backend connectivity issues (verified via isolated Node.js scripts against Supabase) from frontend runtime exceptions (e.g., `ReferenceError` caught via Playwright/DevTools), as client-side crashes can mimic network timeouts.

---

## 3. App Versioning & Release Ritual

- **Package Version Increment**: On every PR / release, bump the app version by `0.0.1` using:
  ```bash
  npm version patch --no-git-tag-version
  ```
- **Dynamic Vite Evaluation**: Ensure `VITE_APP_VERSION` in `vite.config.ts` dynamically evaluates `process.env.npm_package_version`.
- **Changelog Documentation**: Append a new entry to [`docs/APP_JOURNEY_LOG.md`](./../APP_JOURNEY_LOG.md) containing:
  1. App Version (matching `package.json`).
  2. Timestamp in Indian Standard Time (IST, UTC+5:30).
  3. User-facing release notes (emphasizing peace of mind, ease of writing, zero developer jargon).
  4. Technical summary and bug fixes for team members.
  5. Zero sensitive data confirmation.

---

## 4. Surgical Edits & Code Integrity

- **Root Source Architecture**: Application source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`) and the `routes/` directory reside directly in the project root, outside of any traditional `src/` directory. Respect this dominant structure.
- **Minimal Diffs**: Keep diffs minimal and precise. Avoid drive-by formatting, unsolicited styling changes, or modifying untouched blocks.
- **No Unsolicited Refactoring**: Document observations of technical debt rather than refactoring working code unprompted.
- **Code Restoration Precedence**: Code restoration of specific historical commits (specifically those containing 'date and comment code' in `index.html`) takes precedence over newer fixes if they conflict.
- **Code Reuse**: Search existing primitives in `components/` and utility helpers in `lib/` before introducing redundant code.

---

## 5. Automated GitHub PR & Git Workflow (GitHub CLI) & Antigravity Working Method

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
