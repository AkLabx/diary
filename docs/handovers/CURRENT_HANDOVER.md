# Live Handover Baton (`CURRENT_HANDOVER.md`)

> [!IMPORTANT]
> **Cold-Start Protocol**: Read ONLY the `<20 KB` Hot Context (`CURRENT_HANDOVER.md` -> `DECISIONS_MASTER.md` -> `docs/blueprint/v1.0_blueprint.md`), then execute Section 3 following `.agents/skills/version-ritual/SKILL.md`.

---

## 1. Current Verified Baseline Snapshot

- **Current Repository Version**: `v1.0.22`
- **Baseline Git Commit**: `v1.0.22` (`fix/v1.0.22-ci-test-parity`; Edge Functions `weather-proxy` & `delete-account` v2 live)
- **Active Git Branch**: `main` (post-merge)
- **Active Generation Blueprint**: [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) (`v1.0.22` ➔ `v1.0.31`)
- **Verified Checks**: `typecheck`, `lint`, `build`, `check:ritual` (exit `0`); `test:security` (`22/22`), `test:e2e` (`100%`)
- **Workstation**: Windows | Node `v22.16.0` (`D:\DevTools\nvm\v22.16.0`) | `npm` `10.9.2` | `gh.exe` (`AkLabx`)
- **Backend Target**: Supabase `ccgiozknvlknbrkzfcdx` (`https://ccgiozknvlknbrkzfcdx.supabase.co`)

---

## 2. Workstation & Runtime Rules

1. **Windows Shell**: Direct `run_command` shells MUST prepend `$env:PATH = "D:\DevTools\nvm\v22.16.0;$env:PATH";` and call `npm.cmd` / `npx.cmd`. Root `powershell.bat` handles Antigravity `exebox` calls.
2. **Git Auth Bridge**: Run `& "C:\Program Files\GitHub CLI\gh.exe" auth setup-git` before `git push`.
3. **Test Credentials**: Sourced exclusively from gitignored `.agents/AGENTS.md` or `TEST_EMAIL` / `TEST_PASSWORD` env vars. NEVER write credentials into tracked files.
4. **Hard Invariants**: Zero plaintext DB entries/metadata, `extractable: false` `CryptoKey`, private buckets (`public = false`) + signed URLs only, SW isolates data/APIs, no circular `manualChunks`.

---

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.23`)

- **Target Version**: `v1.0.23`
- **Target Branch**: `fix/v1.0.23-privacy-leak-closure`
- **Blueprint Reference**: Step 2 of [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Scope**: Zero-Knowledge Privacy Leak Closure (`DiaryLayout` Cache, Outbox & Sign-Out).
- **Tasks**:
  1. Sync `main`, create `fix/v1.0.23-privacy-leak-closure`, bump version to `1.0.23` (`npm.cmd version patch --no-git-tag-version`).
  2. Inspect `DiaryLayout.tsx` (`sanitizeEntriesForMetadataCache` at L74, `executeSave` at L519, `handleSignOut` at L1224) and `lib/syncQueue.ts`.
  3. Strip `mood`, `tags`, and `journal` from `sanitizeEntriesForMetadataCache` so `localStorage` (`diary_meta_${userId}`) holds zero plaintext metadata (`DEC-010`, `DEC-012`).
  4. In `executeSave`'s network-error offline fallback, enqueue `mood: null, tags: null, journal: null` so offline outbox payloads never carry cleartext metadata (`DEC-012`).
  5. Harden `handleSignOut` + `diary_sync_db` teardown so `diary_sync_db` is deterministically cleared/deleted on logout before leaving the session.
  6. Run `typecheck`, `lint`, `build`, plus Playwright verification against `http://localhost:5173` inspecting `localStorage` (`diary_meta_*`) and IndexedDB (`diary_sync_db`), then complete the 7-Step Closeout Ritual (`npm run check:ritual`).

---

## 4. Mandatory 7-Step Closeout Checklist

- [ ] 1. Create `docs/versions/v1.0.23.md` from `docs/versions/00-template.md`.
- [ ] 2. Update `docs/DECISIONS_MASTER.md` with new decisions/invariants.
- [ ] 3. Prepend `[v1.0.23]` entry (IST UTC+5:30) to `docs/APP_JOURNEY_LOG.md`.
- [ ] 4. Mark Step 2 (`v1.0.23`) `[x] DONE` in `docs/blueprint/v1.0_blueprint.md` and refine Step 3 (`v1.0.24`) to High-Definition.
- [ ] 5. Overwrite this file (`docs/handovers/CURRENT_HANDOVER.md`) for `v1.0.24`.
- [ ] 6. Run `npm run check:ritual` (must exit `0`, Hot Context `<= 20 KB`, 0 leaks).
- [ ] 7. Commit, push, open PR via `gh pr create`, confirm `pr-check.yml` green, merge to `main`, sync local repo.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat

```markdown
You are governing this repository under the "1 Chat = 1 Version" autonomous workflow.
Execute the Cold-Start Reading Order defined in GEMINI.md:
1. Read docs/handovers/CURRENT_HANDOVER.md
2. Read docs/DECISIONS_MASTER.md
3. Read docs/blueprint/v1.0_blueprint.md

Then execute Milestone v1.0.23 ("Zero-Knowledge Privacy Leak Closure: DiaryLayout Cache, Outbox & Sign-Out") as briefed in CURRENT_HANDOVER.md and Step 2 of docs/blueprint/v1.0_blueprint.md. Follow AGENTS.md and .agents/skills/version-ritual/SKILL.md through all 4 phases, concluding with `npm run check:ritual`, marking Step 2 DONE in v1.0_blueprint.md, and overwriting CURRENT_HANDOVER.md for v1.0.24. Proceed now.
```
