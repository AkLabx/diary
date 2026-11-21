---
name: version-ritual
description: Autonomous 1-Chat=1-Version lifecycle skill governing cold-start hot context reading, pre-flight simulation, verification, and mandatory 7-step closeout ritual for the Diary App.
---

# Antigravity Version Ritual Skill (`version-ritual`)

This skill defines the authoritative, repeatable engineering protocol that powers the **"1 Chat = 1 Version"** governance model for the Diary App. Every chat session must execute this 4-phase lifecycle to ensure mathematical consistency, zero regressions, and seamless perpetual handover across autonomous agent sessions.

---

## Phase 1: Cold-Start & Pre-Flight Ritual

### 1.1 Read Hot Context (< 20 KB)
Before reading broad codebase files or exploring directories, read ONLY the lean Hot Context layer in this order:
1. `docs/handovers/CURRENT_HANDOVER.md` (Live baseline, previous commit, workstation rules, next version brief).
2. `docs/DECISIONS_MASTER.md` (Active architectural invariants and retired anti-patterns).
3. `docs/blueprint/v1.0_blueprint.md` (or `docs/blueprint/main_blueprint.md` - active roadmap increment).

### 1.2 Git Workspace Health Verification
Verify that the local workspace is clean and aligned with remote `main`:
```powershell
git checkout main
git pull origin main
git status
```
*Circuit Breaker*: If working tree is dirty or on an unmerged feature branch, resolve or ask user before proceeding.

### 1.3 30-Second Cognitive Pre-Flight
Evaluate proposed work against the **Circuit Breakers** in `AGENTS.md`:
- [ ] Will this touch > 10 files? (Stop and ask if yes).
- [ ] Will this add new third-party npm dependencies? (Stop and ask if yes).
- [ ] Will this alter, drop, or truncate database tables on Supabase `ccgiozknvlknbrkzfcdx`? (Stop and ask if yes).
- [ ] Will this break public component contracts, router interfaces, or E2EE encryption formats? (Stop and ask if yes).
- [ ] Simulate data lifecycle & actively identify at least 3 runtime failure modes.
- [ ] Enforce zero shortcuts: No cosmetic fake UI buttons or mock data bypasses.

---

## Phase 2: Execution & Synchronized Versioning

### 2.1 Isolated Feature Branch
Create a descriptive branch matching the target version:
```powershell
git checkout -b feat/vX.Y.Z-<feature-name>
# or for bug fixes:
git checkout -b fix/vX.Y.Z-<bug-name>
```

### 2.2 Synchronized Version Bumping
When bumping the version, ensure all manifests and dynamic flags stay synchronized:
1. Update `package.json` using:
   ```powershell
   $env:PATH = "D:\DevTools\nvm\v22.16.0;$env:PATH"; npm.cmd version patch --no-git-tag-version
   ```
2. Verify `package-lock.json` reflects the new version.
3. Confirm that `VITE_APP_VERSION` in `vite.config.ts` dynamically evaluates `process.env.npm_package_version`.

### 2.3 Live Engineering Trade-Off Tracking
During implementation, when choosing between technical alternatives (e.g. In-memory state vs IndexedDB, Direct Supabase vs Edge Function proxy), document the decision as **Path A vs Path B**:
- Chosen Path
- Rejected Path & Why
- Do-Not-Break Invariant established

---

## Phase 3: Multi-Tier Verification Protocol

Never declare an implementation complete based on static code edits alone. Verification requires passing both static builds and runtime validation:

### 3.1 Static Verification (0 Errors, 0 Warnings)
Execute standard toolchain verification with host NVM Node PATH injected:
```powershell
# 1. Typecheck, Strict ESLint, and Production Vite Bundle
$env:PATH = "D:\DevTools\nvm\v22.16.0;$env:PATH"; npm.cmd run typecheck; npm.cmd run lint; npm.cmd run build
```
*Requirement*: All three commands must exit with code `0`.

### 3.2 Real-World Runtime Verification
Verify actual client runtime behavior against the local dev server (`http://localhost:5173`) and live backend (`ccgiozknvlknbrkzfcdx`):
- Run automated security & crypto suites (`npm.cmd run test:security`, `npm.cmd run test:e2e`) when modifying auth, crypto, storage, or RLS behavior.
- Run targeted Playwright scripts under `verification/` (e.g. `python verification/verify_timeline.py`) and inspect captured screenshots for layout shifts, clipping, or styling regressions.
- Source automated test credentials strictly from gitignored `.agents/AGENTS.md` or `TEST_EMAIL` / `TEST_PASSWORD` environment variables (never write literals into tracked files).
- Distinguish between backend connectivity (Node scripts) and frontend execution (Playwright), as client crashes (e.g. `ReferenceError`) can mimic network timeouts.

---

## Phase 4: Mandatory 7-Step Closeout Ritual (The Perpetual Handover Loop)

> [!CRITICAL]
> **A chat session is NOT complete until all 7 steps below pass cleanly, `npm run check:ritual` exits 0, the decision ledger is updated, and `CURRENT_HANDOVER.md` is overwritten.**

Execute these 7 steps in exact order:

### Step 1: Create Per-Version Dossier
Create `docs/versions/vX.Y.Z.md` using `docs/versions/00-template.md`:
- Record version, release date, branch/PR, verification summary.
- List all impacted files.
- Document engineering decisions (*Path A vs Path B*), rationale, and invariants.
- Document any runtime bugs caught during execution and the exact fixes applied.
- Attach verification proof (build status, test output, screenshot links).

### Step 2: Update Master Decision Ledger
Open `docs/DECISIONS_MASTER.md`:
- Append newly established architectural decisions to `## 1. Active Decisions & Invariants (Preserve Always)`.
- Keep descriptions concise so the total Hot Context (`CURRENT_HANDOVER.md` + `DECISIONS_MASTER.md` + active blueprint) stays `<= 20 KB`.
- If any previous pattern was deprecated or replaced, move it to `## 2. Superseded Decisions (Do NOT Revive)`.

### Step 3: Update Release Journey Log
Open `docs/APP_JOURNEY_LOG.md`:
- Prepend a new release entry at the top of `## 🚀 Releases & Milestones`.
- Include App Version, IST timestamp (UTC+5:30), User-Facing Release Notes (Google Play Store style), and Technical Implementation Summary.

### Step 4: Update Blueprint & Roadmap
Open `docs/blueprint/v1.0_blueprint.md` (and `docs/blueprint/main_blueprint.md` if applicable):
- Mark completed milestones as `[x] DONE`.
- Review and refine the acceptance criteria for the upcoming milestone.

### Step 5: Overwrite Live Handover Baton (`CURRENT_HANDOVER.md`)
Rewrite `docs/handovers/CURRENT_HANDOVER.md` completely with:
1. Current Verified Baseline Snapshot (new version, commit SHA, build/lint status, environment).
2. Workstation & Runtime Testing Rules (Windows host, `powershell.bat`, env-based test credentials).
3. Pre-Planned Execution Brief for Next Version (exact scope, acceptance criteria, failure modes).
4. Mandatory Closeout Checklist (the 7 steps).
5. Copy-Paste Starter Prompt for the Fresh Chat.

### Step 6: Mechanical Ritual Gate & Secret Scan
Run the automated closeout verifier (enforces branch check, version sync across `package.json`/`package-lock.json`/dossier/`APP_JOURNEY_LOG.md`, handover rotation, `<= 20 KB` Hot Context budget, `.agents/AGENTS.md` gitignore integrity, and secret/path scanning):
```powershell
$env:PATH = "D:\DevTools\nvm\v22.16.0;$env:PATH"; npm.cmd run check:ritual
```
*Requirement*: Must exit with code `0` before committing.

### Step 7: Commit, PR, CI Green, Merge & Sync
Publish the versioned increment cleanly:
```powershell
# 1. Stage and commit
git add .
git commit -m "feat(release): vX.Y.Z - <descriptive release title>"

# 2. Bridge credentials and push branch
& "C:\Program Files\GitHub CLI\gh.exe" auth setup-git
git push -u origin <branch-name>

# 3. Create PR via GitHub CLI and wait for pr-check.yml CI green
& "C:\Program Files\GitHub CLI\gh.exe" pr create --title "vX.Y.Z: <Release Title>" --body "<Markdown summary of changes & verification>" --base main --head <branch-name>
& "C:\Program Files\GitHub CLI\gh.exe" pr checks <branch-name> --watch

# 4. Merge PR (after CI passes and user confirmation if required)
& "C:\Program Files\GitHub CLI\gh.exe" pr merge <branch-name> --squash --delete-branch

# 5. Local sync and cleanup
git checkout main
git pull origin main
git branch -d <branch-name>
git status
```
Verify `git status` shows `nothing to commit, working tree clean` on `main`. The cycle is now complete and handed over to the next chat.
