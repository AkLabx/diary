# AI Coding Standards & Development Workflow

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

## 5. Git & PR Workflow

- Inspect current branch:
  ```bash
  git branch --show-current
  ```
- Ensure GitHub CLI credentials are setup before pushing:
  ```bash
  gh auth setup-git
  ```
- Use clear conventional commit messages: `feat(scope): ...` or `fix(scope): ...`.
