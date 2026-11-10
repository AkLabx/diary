# Production Disaster Recovery & Business Continuity Runbook (DR-01)

**Target Project Ref**: `ccgiozknvlknbrkzfcdx`  
**System Architecture**: Client-Side End-to-End Encrypted (AES-GCM 256-bit) Diary  
**Recovery Targets**: RPO (Recovery Point Objective) ≤ 5 minutes | RTO (Recovery Time Objective) ≤ 30 minutes  

---

## 1. Cryptographic Invariants During Recovery

> [!CRITICAL]
> All diary entry titles, contents, tags, moods, and multimedia stored in Supabase are client-side AES-GCM encrypted. 
> The database only ever stores ciphertext and initialization vectors (`iv`).
> 
> Under NO circumstance should database restoration attempt to manipulate, parse, or alter the `encrypted_entry` or `iv` columns. Any truncation or modification corrupts the AES authentication tag and renders the affected user's data permanently unrecoverable.

---

## 2. Disaster Scenarios & Recovery Workflows

### Scenario A: Accidental Data Corruption or Malicious DDL / DML Execution
* **Trigger**: Unintended batch update, foreign key orphan cascade, or data corruption detected.
* **Resolution**: Point-in-Time Recovery (PITR) to a target timestamp prior to the incident.

#### Procedure:
1. **Identify the exact UTC target timestamp** immediately before the incident occurred:
   ```bash
   # Example: 2026-11-10 01:45:00 UTC
   TARGET_RECOVERY_TIME="2026-11-10T01:45:00Z"
   ```
2. **Execute PITR restore via Supabase Dashboard or CLI**:
   - Navigate to *Supabase Dashboard → Project ccgiozknvlknbrkzfcdx → Database → Backups → Point in Time*.
   - Select the target timestamp (`$TARGET_RECOVERY_TIME`).
   - Confirm clone / recovery to staging or production target.
3. **Verify Cryptographic & Relational Integrity**:
   Execute the following automated verification query:
   ```sql
   -- Check for null ciphertexts or truncated IVs
   SELECT 
     count(*) AS total_diaries,
     count(CASE WHEN encrypted_entry IS NULL OR length(encrypted_entry) < 10 THEN 1 END) AS corrupted_entries,
     count(CASE WHEN iv IS NULL OR length(iv) < 16 THEN 1 END) AS corrupted_ivs
   FROM public.diaries;
   ```
   *Pass criteria*: `corrupted_entries = 0` and `corrupted_ivs = 0`.
4. **Verify Storage Bucket Alignment**:
   Confirm that storage objects referenced in `public.media_files` match physical objects in private buckets:
   ```sql
   SELECT count(*) FROM public.media_files;
   ```

---

### Scenario B: Catastrophic Cloud Outage or Region Failure
* **Trigger**: Primary Supabase cloud region experiences prolonged failure.
* **Resolution**: Standby cross-region database restoration from physical base backups + WAL archives.

#### Procedure:
1. **Provision Standby Instance**:
   Create a fresh Supabase or PostgreSQL 15+ instance with identical schema.
2. **Apply Authoritative DDL Schema**:
   Execute `docs/migrations/20261110_phase2_performance_indexes_and_rls.sql` to initialize tables, indexes, and RLS policies.
3. **Restore Physical Dump**:
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges -h <standby-host> -U postgres -d postgres backup_dump.sql
   ```
4. **Synchronize Storage Buckets**:
   Restore S3-compatible private buckets: `diary-images`, `diary-audio`, `avatars` from redundant cold backups.
5. **Update Client Connection Configuration**:
   Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in deployment environment variables and trigger automated build.

---

## 3. Client Cache Invalidation & Session Resynchronization

Following any database restoration:
1. **Service Worker Cache Eviction**:
   Increment `CACHE_NAME` in `public/sw.js` (e.g. from `diary-app-v2` to `diary-app-v3`).
2. **PWA Refresh Prompt**:
   VitePWA's `PWAUpdateManager.tsx` will detect the new service worker version on all active client devices within 1 hour and prompt users to reload.
3. **IndexedDB Outbox Re-evaluation**:
   Client devices with pending mutations in `diary_sync_db` (`sync_outbox`) will auto-sync upon reconnection via `lib/syncQueue.ts`.
4. **Dead-Letter Queue Inspection**:
   Inspect client diagnostics via `getAnonymizedDiagnostics()` in `lib/telemetry.ts` to identify any outbox items rejected during recovery.

---

## 4. Verification & Testing Checklist

- [ ] Automated daily PITR snapshots enabled with 7-day retention window.
- [ ] RLS policies verified active on `profiles`, `diaries`, `media_files`.
- [ ] Private media buckets confirmed `public = false`.
- [ ] Emergency support contact tested: `dpo@diaryapp.com` / `support@diaryapp.com`.
