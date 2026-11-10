# Production Uplift Master Roadmap: 10 Operational Phases for 10,000 DAU
**Target Horizon**: 10,000 Daily Active Users (DAU)  
**System Architecture**: Hybrid Web PWA (React 18 + Vite) & Native Android (Capacitor 7) backed by Supabase PostgreSQL 17.6  
**Document Classification**: Publication-Grade Engineering Execution Specification  
**Status**: Authoritative Master Plan  

---

## Executive Overview & Roadmap Topology

This document specifies the exact, sequential 10-phase engineering execution roadmap required to uplift the Diary App from its current development state into an enterprise-grade, highly scalable, legally compliant, and cryptographically sound production system capable of reliably sustaining **10,000 Daily Active Users (DAU)**.

### Master Phase Sequence & Dependency Graph
```
Phase 1: Cryptographic Hardening & Zero-Knowledge Privacy Remediation
  │
  ├──► Phase 2: Database Indexing, RLS Optimization & Storage Policy Rectification
  │      │
  │      ├──► Phase 3: Infrastructure Scaling, Connection Pooling & Third-Party Decoupling
  │      │      │
  │      ├──► Phase 4: Frontend Architecture, Code Splitting & UI/UX Optimization
  │      │      │
  │      └──► Phase 5: PWA Resilience, Offline Sync Outbox & Cache Invalidation
  │             │
  ├──► Phase 6: Legal, Privacy Compliance & Regulatory Framework (GDPR/DPDP)
  │      │
  ├──► Phase 7: Observability, Telemetry, Monitoring & Disaster Recovery
  │      │
  └──► Phase 8: Google Play Store Compliance, Android Native Hardening & Release Packaging
         │
         └──► Phase 9: End-to-End Stress Testing, Load Testing & Security Penetration Audit
                │
                └──► Phase 10: Production Launch Orchestration, Canary Deployment & Post-Launch Ops
```

---

## Phase 1: Cryptographic Hardening & Zero-Knowledge Privacy Remediation

### 1.1 Objectives
1. Eliminate the fatal client crash (`RangeError: Maximum call stack size exceeded`) occurring on entries, images, or audio payloads > 64 KB.
2. Secure the biometric credential lifecycle by ensuring native Android Keystore data and WebAuthn tokens are purged upon user sign-out.
3. Eliminate cleartext metadata leakage of sensitive mental health tags, emotional moods, and journal categories to uphold zero-knowledge privacy boundaries.
4. Strengthen user vault password requirements to prevent offline brute-force attacks against PBKDF2 salt and key check materials.
5. Implement client-side binary encryption for profile avatars prior to storage upload.

### 1.2 Concrete Technical Deliverables
- **`lib/crypto.ts`**:
  - Replace the spread operator (`...`) in `encodeBase64` with a chunked 32 KB subarray loop:
    ```ts
    export const encodeBase64 = (buf: ArrayBufferLike): string => {
      const bytes = new Uint8Array(buf);
      const len = bytes.byteLength;
      const chunkSize = 0x8000; // 32,768 bytes
      let binary = '';
      for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)) as any);
      }
      return btoa(binary);
    };
    ```
  - Implement zero-knowledge blind indexing using HMAC-SHA256 (`deriveBlindIndex(key, term)`) to enable private server-side filtering without leaking plaintext tags.
- **`DiaryLayout.tsx`**:
  - Update `handleSignOut`:
    ```ts
    const handleSignOut = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await NativeBiometric.deleteData({ key: `diary_master_key_${session?.user?.id}` });
        } catch (e) { console.warn('Failed to clear native biometric', e); }
      }
      localStorage.removeItem(`diary_bio_${session?.user?.id}`);
      await supabase.auth.signOut();
      navigate('/');
    };
    ```
  - Encrypt `mood`, `tags`, and `journal` category inside the primary AES-GCM ciphertext payload.
- **`components/InitializeEncryption.tsx`**:
  - Increase minimum master password length from 6 to 10+ characters.
  - Integrate `zxcvbn-ts` to enforce a minimum password entropy score of 3/4 before enabling vault initialization.
- **`lib/imageUtils.ts` & `components/ProfileView.tsx`**:
  - Update `uploadAvatar` to encrypt avatar images using `encryptBinary` with the user's master key before uploading to the `avatars` bucket.

### 1.3 Prerequisites & Dependencies
- Input: Findings `C-01`, `H-01`, `H-02`, and `H-14` from `docs/PRODUCTION_AUDIT.md`.
- No upstream phase dependencies (Foundational Phase).

### 1.4 Verifiable Acceptance & Validation Criteria
1. **Buffer Stress Test**: Run an automated script in Node.js executing `encodeBase64` on a 5 MB `Uint8Array` buffer; verify zero call stack errors and 100% round-trip fidelity with `decodeBase64`.
2. **Biometric Sign-Out Verification**: Sign in on an Android device, enable biometric unlock, trigger `handleSignOut`, and verify that `NativeBiometric.getData` returns empty and `PasswordPrompt.tsx` refuses biometric unlock.
3. **Database Privacy Audit**: Inspect PostgreSQL rows in `public.diaries` for newly saved entries; verify `mood`, `tags`, and `journal` columns contain null or encrypted HMAC blind indexes, and `encrypted_entry` holds all contextual metadata.
4. **Password Policy Test**: Attempt to initialize an encryption vault with a 9-character or low-entropy password (`"password123"`); verify UI validation blocks submission.

### 1.5 Failure Modes & Rollback Procedures
- **Failure Mode**: Legacy entries created prior to Phase 1 have plaintext `tags` and `mood` columns, creating schema interpretation mismatches in the client.
- **Mitigation & Rollback**: Maintain backward-compatible parsing in `DiaryLayout.tsx` (`const mood = decryptedPayload.mood || rawRow.mood`); if newly formatted entries fail decryption, roll back `lib/crypto.ts` via Git and execute client-side schema version detection.

---

## Phase 2: Database Indexing, RLS Optimization & Storage Policy Rectification

### 2.1 Objectives
1. Eliminate full table sequential scans on `public.diaries` by establishing covering composite B-Tree and GIN indexes.
2. Resolve all 26 `auth_rls_initplan` warnings by wrapping `auth.uid()` in `(SELECT auth.uid())` subqueries across all RLS policies.
3. Apply covering indexes on all 7 unindexed foreign keys to prevent table lock cascades.
4. Add the missing `DELETE` policy on the `diary-audio` storage bucket in `storage.objects`.
5. Eliminate orphaned media leaks by enforcing direct `media_files` lookup prior to entry deletion.
6. Add `iv` to `public.media_files` to eliminate N+1 gallery refetches.
7. Implement Optimistic Concurrency Control (OCC) by introducing `version` and `updated_at` columns to `public.diaries`.

### 2.2 Concrete Technical Deliverables
- **`supabase/migrations/20261110000001_core_indexes_and_occ.sql`**:
  ```sql
  -- 1. Covering composite index for timeline load
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diaries_owner_created 
  ON public.diaries(owner_id, created_at DESC);

  -- 2. Journal category filtering index
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diaries_owner_journal 
  ON public.diaries(owner_id, journal);

  -- 3. GIN index for fast tag filtering
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_diaries_tags_gin 
  ON public.diaries USING gin(tags);

  -- 4. Foreign key covering indexes
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_files_user_id ON public.media_files(user_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments(task_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_attachments_owner_id ON public.task_attachments(owner_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_history_task_id ON public.task_history(task_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_history_owner_id ON public.task_history(owner_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_templates_owner_id ON public.task_templates(owner_id);

  -- 5. OCC Columns & Media IV
  ALTER TABLE public.diaries 
  ADD COLUMN IF NOT EXISTS version bigint DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

  ALTER TABLE public.media_files 
  ADD COLUMN IF NOT EXISTS iv text,
  ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
  ```
- **`supabase/migrations/20261110000002_optimize_rls_policies.sql`**:
  ```sql
  -- Rewrite RLS policies across all public tables with scalar subqueries
  DROP POLICY IF EXISTS "Users can view their own diary entries." ON public.diaries;
  CREATE POLICY "Users can view their own diary entries."
  ON public.diaries FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

  DROP POLICY IF EXISTS "Users can update their own diary entries." ON public.diaries;
  CREATE POLICY "Users can update their own diary entries."
  ON public.diaries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = owner_id);

  DROP POLICY IF EXISTS "Users can delete their own diary entries." ON public.diaries;
  CREATE POLICY "Users can delete their own diary entries."
  ON public.diaries FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = owner_id);
  ```
- **`supabase/migrations/20261110000003_storage_audio_delete_policy.sql`**:
  ```sql
  -- Allow authenticated users to delete their own audio files
  CREATE POLICY "Users can delete their own audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'diary-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

  -- Server-side file size caps
  UPDATE storage.buckets SET file_size_limit = 10485760 WHERE id = 'diary-images'; -- 10MB
  UPDATE storage.buckets SET file_size_limit = 26214400 WHERE id = 'diary-audio';  -- 25MB
  UPDATE storage.buckets SET file_size_limit = 2097152 WHERE id = 'avatars';       -- 2MB
  ```
- **`DiaryLayout.tsx`**:
  - Update `handleDeleteEntry` to query `public.media_files` directly for all paths matching `entry_id` before deleting the diary row.
  - Implement OCC check in `executeSave`:
    ```ts
    const { data, error } = await supabase
      .from('diaries')
      .update({ ...record, version: currentVersion + 1, updated_at: new Date().toISOString() })
      .eq('id', entryData.id)
      .eq('version', currentVersion);
    if (!data || data.length === 0) throw new Error('CONCURRENCY_CONFLICT');
    ```

### 2.3 Prerequisites & Dependencies
- Input: Findings `C-02`, `C-05`, `C-08`, `H-04`, `H-05`, `H-06` from `docs/PRODUCTION_AUDIT.md`.
- Dependency on Phase 1 cryptographic data structures.

### 2.4 Verifiable Acceptance & Validation Criteria
1. **Advisors Cleanliness**: Run Supabase MCP `get_advisors(type: "performance")`; verify **0 instances** of `auth_rls_initplan` and **0 unindexed foreign keys**.
2. **Execution Plan Check**: Run `EXPLAIN ANALYZE SELECT * FROM diaries WHERE owner_id = '...' ORDER BY created_at DESC;` in SQL Editor; confirm planner chooses **Index Scan using idx_diaries_owner_created**, with execution time < 5ms.
3. **Storage Audio Deletion**: Upload an audio note, trigger delete via UI; confirm Supabase Storage returns HTTP 200 and file is purged from `storage.objects`.
4. **Orphan Media Prevention**: Create an entry with 3 images; delete it from timeline without viewing; verify `media_files` rows and physical `diary-images` storage objects are completely removed.
5. **OCC Multi-Device Conflict Test**: Attempt concurrent updates from two sessions with stale versions; confirm the second write fails with `CONCURRENCY_CONFLICT`.

### 2.5 Failure Modes & Rollback Procedures
- **Failure Mode**: Adding indexes on large live tables could acquire exclusive locks (`ShareLock`) and block user traffic.
- **Mitigation & Rollback**: All index creations MUST use `CREATE INDEX CONCURRENTLY`. In case of failure, drop the invalid index (`DROP INDEX CONCURRENTLY idx_diaries_owner_created`) and investigate lock queue via `pg_stat_activity`.

---

## Phase 3: Infrastructure Scaling, Connection Pooling & Third-Party Decoupling (10k DAU)

### 3.1 Objectives
1. Upgrade Supabase infrastructure from Free Tier to Pro Tier with Small Compute (2 vCPU, 2 GB RAM) and pooler allocation to prevent Day 1 service suspension.
2. Integrate an external transactional SMTP provider (Resend, AWS SES, or SendGrid) to remove the 30 email/hour limit.
3. Eliminate hardcoded personal API keys and rate-limited third-party dependencies (`ipwho.is` and OpenWeatherMap).
4. Deploy a secure Supabase Edge Function (`weather-proxy`) that strips IP identifiers and provides 15-minute response caching.
5. Enable Point-in-Time Recovery (PITR) with continuous WAL archiving.

### 3.2 Concrete Technical Deliverables
- **Supabase Project Upgrade**:
  - Upgrade project `ccgiozknvlknbrkzfcdx` to Pro Tier ($25/mo).
  - Provision Small Compute Add-on ($15/mo) ensuring 2 vCPUs and 2 GB dedicated memory.
  - Enable Supavisor connection pooler in Transaction mode with a pool size of 30 connections.
- **Custom SMTP Provider Setup**:
  - Configure custom SMTP credentials in Supabase Auth settings with verified domain SPF, DKIM, and DMARC records.
- **`supabase/functions/weather-proxy/index.ts`**:
  - Deploy an Edge Function acting as a secure caching proxy:
    ```ts
    import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

    serve(async (req) => {
      if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
      const { lat, lon } = await req.json();
      // Route to Open-Meteo with server-side caching (no API key required)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const response = await fetch(url);
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=900" }
      });
    });
    ```
- **`lib/weather.ts`**:
  - Strip hardcoded `const API_KEY: string = '227b57dcb9e272db9e362fee3a14b924';`.
  - Remove direct fetch to `https://ipwho.is/`.
  - Point weather queries to the `weather-proxy` Edge Function.
- **Point-in-Time Recovery (PITR)**:
  - Enable PITR in the Supabase Database settings with a 7-day retention window.

### 3.3 Prerequisites & Dependencies
- Input: Findings `C-06`, `H-03`, `S3-03` from `docs/PRODUCTION_AUDIT.md`.
- Prerequisite: Database schema and indexes stabilized in Phase 2.

### 3.4 Verifiable Acceptance & Validation Criteria
1. **Tier & Quota Verification**: Verify via Supabase Management Console that the project is on Pro Tier with active billing and storage quotas increased to 100 GB.
2. **SMTP Burst Test**: Trigger 100 consecutive password reset/signup requests using a load script; verify 100% email delivery without throttling.
3. **Edge Proxy Verification**: Call the `weather-proxy` function; verify response headers include `Cache-Control: public, max-age=900` and execution latency < 60ms.
4. **Codebase Secret Hygiene**: Execute `grep -r "227b57dcb9e272db9e362fee3a14b924" .`; verify zero occurrences across the repository.
5. **PITR Status**: Verify WAL archiving status is `active` via Supabase database backup settings.

### 3.5 Failure Modes & Rollback Procedures
- **Failure Mode**: Custom SMTP configuration fails due to DNS propagation delay for DKIM records.
- **Mitigation & Rollback**: Temporarily switch Auth settings back to built-in provider while maintaining rate monitoring, or pre-verify DNS records 48 hours prior to switchover.

---

## Phase 4: Frontend Architecture, Code Splitting & UI/UX Optimization

### 4.1 Objectives
1. Reduce the monolithic initial JavaScript bundle from 1.99 MB to < 250 KB using route-level dynamic code splitting (`React.lazy`).
2. Eliminate the N+1 database queries and decryption loops in `MyStuffImages.tsx` and `MyStuffAudio.tsx`.
3. Memoize `DiaryLayout` context value to eliminate cascading full-tree re-renders on every clock tick.
4. Fix mobile virtual keyboard overlap in the editor canvas.
5. Prevent memory leaks by properly revoking Blob object URLs in `DiaryEditor.tsx`.
6. Replace synchronous `DOMParser` instantiations in `DiaryList.tsx` with high-performance regex stripping.
7. Remediate accessibility (a11y) defects in `Auth.tsx` and support `@media (prefers-reduced-motion)`.
8. Wrap the application root in a global `GlobalErrorBoundary` class component.

### 4.2 Concrete Technical Deliverables
- **`App.tsx` & `vite.config.ts`**:
  - Convert route imports to dynamic `React.lazy()` imports:
    ```tsx
    const Timeline = React.lazy(() => import('./routes/Timeline'));
    const Editor = React.lazy(() => import('./routes/Editor'));
    const TasksHub = React.lazy(() => import('./routes/Tasks/TasksHub'));
    const MyStuffImages = React.lazy(() => import('./routes/MyStuff/MyStuffImages'));
    // Wrapped in <Suspense fallback={<RouteLoadingSkeleton />}>
    ```
  - Configure `vite.config.ts`:
    ```ts
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-crypto': ['@zip.js/zip.js'],
            'vendor-editor': ['react-quill'],
            'vendor-nlp': ['compromise'],
            'vendor-pdf': ['jspdf']
          }
        }
      }
    }
    ```
- **`routes/MyStuff/MyStuffImages.tsx` & `MyStuffAudio.tsx`**:
  - Refactor to decrypt thumbnails directly from `media_files.file_path` and `media_files.iv`, bypassing the parent diary fetch and DOM parsing.
- **`DiaryLayout.tsx`**:
  - Wrap `contextValue` in `useMemo` with an explicit dependency array.
- **`routes/Editor.tsx`**:
  - Implement dynamic keyboard padding using `@capacitor/keyboard` and `visualViewport`:
    ```tsx
    useEffect(() => {
      const handleResize = () => {
        if (window.visualViewport) {
          const keyboardInset = window.innerHeight - window.visualViewport.height;
          setKeyboardPadding(Math.max(0, keyboardInset));
        }
      };
      window.visualViewport?.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }, []);
    ```
- **`components/DiaryEditor.tsx`**:
  - Add blob URL tracking ref (`activeBlobUrlsRef`) and invoke `URL.revokeObjectURL` on unmount.
- **`components/DiaryList.tsx`**:
  - Replace `new DOMParser().parseFromString` with regex `html.replace(/<[^>]*>?/gm, '')`.
- **`components/Auth.tsx`**:
  - Add `<label htmlFor="auth-email" className="sr-only">Email Address</label>`.
  - Remove `tabIndex={-1}` from password visibility toggle.
  - Add `role="alert"` to error message container.
- **`index.css` & `lib/festiveFx.ts`**:
  - Add CSS reduced motion overrides and check `window.matchMedia('(prefers-reduced-motion: reduce)')` in animation scripts.
- **`components/GlobalErrorBoundary.tsx`**:
  - Implement React class component with `componentDidCatch` and wrap `<App />` in `index.tsx`.

### 4.3 Prerequisites & Dependencies
- Input: Findings `C-07`, `C-09`, `H-07`, `H-08`, `H-10`, `H-11`, `H-12`, `M-08` from `docs/PRODUCTION_AUDIT.md`.
- Prerequisite: Phase 2 migration providing `iv` in `public.media_files`.

### 4.4 Verifiable Acceptance & Validation Criteria
1. **Bundle Size Verification**: Run `npm run build`; verify generated `dist/assets/index-*.js` entry chunk is **< 250 KB**.
2. **Lighthouse Performance Score**: Run Lighthouse mobile audit on local production build; score must be **> 85** (up from < 40).
3. **Gallery Query Count**: Open "My Stuff -> Images" with 20 items; monitor Supabase network tab; confirm exactly **1 query to `media_files`** and **0 queries to `diaries`**.
4. **Memory Profiler Audit**: Open and close 10 image-rich entries in `DiaryEditor`; take Chrome DevTools heap snapshot; verify 0 detached image blob objects retained.
5. **Virtual Keyboard Simulation**: In Chrome DevTools mobile view with virtual keyboard emulated, focus on bottom text in `Editor`; verify cursor remains clearly visible above keyboard.
6. **a11y Audit**: Run `axe-core` on `/auth`; verify 0 high/critical accessibility violations.

### 4.5 Failure Modes & Rollback Procedures
- **Failure Mode**: Users on slow networks experience blank flashes between routes due to lazy loading.
- **Mitigation & Rollback**: Implement progressive route prefetching (`onMouseEnter` on sidebar links triggers dynamic import), with `RouteLoadingSkeleton` rendering instantaneous shimmer effects.

---

## Phase 5: PWA Resilience, Offline Sync Outbox & Cache Invalidation

### 5.1 Objectives
1. Implement a persistent offline synchronization outbox (`sync_outbox`) in IndexedDB to queue failed or offline entry saves and auto-sync on reconnect.
2. Resolve competing double Service Worker registrations in `App.tsx` and `PWAUpdateManager.tsx`.
3. Fix the broken duplicate manifest link (`./manifest.json`) in `index.html`.
4. Precache external CDN assets (Google Fonts, Quill CSS) for flawless offline UI rendering.
5. Implement a client-side encrypted search index to restore full-text search for historical un-decrypted entries.

### 5.2 Concrete Technical Deliverables
- **`lib/syncQueue.ts`**:
  - Implement an IndexedDB queue for offline mutations:
    ```ts
    export interface OutboxItem {
      id: string;
      entryId: string;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      payload: any;
      timestamp: number;
      retryCount: number;
    }
    export const enqueueMutation = async (item: OutboxItem) => { ... };
    export const processOutbox = async (supabase: SupabaseClient) => { ... };
    ```
- **`DiaryLayout.tsx`**:
  - Update `executeSave`:
    ```ts
    if (!navigator.onLine) {
      await enqueueMutation({ id: crypto.randomUUID(), entryId: entryData.id, operation: isNew ? 'INSERT' : 'UPDATE', payload: record, timestamp: Date.now(), retryCount: 0 });
      setSaveStatus('saved_offline');
      addToast("Saved offline. Will sync when reconnected.", "info");
      return;
    }
    ```
  - Register `window.addEventListener('online', () => processOutbox(supabase))`.
- **`App.tsx` & `index.html`**:
  - Remove manual `navigator.serviceWorker.register` from `App.tsx:98-114`.
  - Remove line 10 `<link rel="manifest" href="./manifest.json" />` from `index.html`.
- **`vite.config.ts`**:
  - Add runtime caching rules for Google Fonts and Quill CDN in VitePWA Workbox options.
- **`lib/offlineSearch.ts`**:
  - Integrate `MiniSearch` backed by IndexedDB encrypted storage to maintain a searchable token index of decrypted entries.

### 5.3 Prerequisites & Dependencies
- Input: Findings `C-10`, `H-09`, `M-03`, `M-04` from `docs/PRODUCTION_AUDIT.md`.
- Prerequisite: Phase 4 bundle splitting and UI foundation.

### 5.4 Verifiable Acceptance & Validation Criteria
1. **Offline Save & Sync**: In DevTools, set Network to "Offline", write an entry, and click "Save"; verify toast displays "Saved offline"; switch Network back to "Online"; verify background sync executes and row appears in Supabase within 3 seconds.
2. **Service Worker Single Registration**: Inspect Chrome `chrome://serviceworker-internals`; verify exactly **one Service Worker registration** active on the scope.
3. **PWA Lighthouse Audit**: Run Lighthouse PWA audit; verify **100% PWA pass rate** with valid web manifest.
4. **Offline Full-Text Search**: In offline mode, search for keywords from an entry created yesterday; verify entry appears in search results.

### 5.5 Failure Modes & Rollback Procedures
- **Failure Mode**: Corrupted outbox queue blocks subsequent saves.
- **Mitigation & Rollback**: Implement automatic poison-pill detection: if an outbox item fails 5 consecutive times with a 4xx error (e.g., validation failure), move it to a `dead_letter_queue` in IndexedDB and alert the user with an export option.

---

## Phase 6: Legal, Privacy Compliance & Regulatory Framework (GDPR, CCPA, DPDP)

### 6.1 Objectives
1. Implement full self-service account deletion across both mobile application and an external public web page.
2. Deploy an atomic Supabase Edge Function (`delete-account`) that cascades across database tables and purges all user storage objects.
3. Overhaul `PrivacyPolicy.tsx` and `TermsOfUse.tsx` to provide official corporate disclosures, DPO contacts, and DPDP 2023 compliance.
4. Expand data export capabilities to include all multimedia assets (images, audio, attachments) in compliance with GDPR Article 20.

### 6.2 Concrete Technical Deliverables
- **`supabase/functions/delete-account/index.ts`**:
  ```ts
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  serve(async (req) => {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const uid = user.id;
    // 1. Purge all storage files
    for (const bucket of ['diary-images', 'diary-audio', 'avatars']) {
      const { data: files } = await supabase.storage.from(bucket).list(uid);
      if (files && files.length > 0) {
        await supabase.storage.from(bucket).remove(files.map(f => `${uid}/${f.name}`));
      }
    }
    // 2. Cascade delete database records
    await supabase.from('profiles').delete().eq('id', uid);
    // 3. Delete user from auth
    await supabase.auth.admin.deleteUser(uid);
    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  });
  ```
- **`components/ProfileView.tsx`**:
  - Add a red "Delete Account & All Data" button triggering a high-friction confirmation modal requiring master password entry.
- **`routes/DeleteAccountWeb.tsx`**:
  - Create a public web portal at route `#/delete-account` fulfilling Google Play's external URL requirement.
- **`components/PrivacyPolicy.tsx` & `components/TermsOfUse.tsx`**:
  - Insert registered corporate legal entity name, physical address, and designated Data Protection Officer email (`dpo@diaryapp.com`).
  - Add specific sections for Indian DPDP Act 2023 (Grievance Redressal within 30 days, parental consent for minors under 18).
  - Explicitly disclose lawful basis under GDPR Art. 6 & 9.
- **`DiaryLayout.tsx`**:
  - Update `handleExportData` to download and decrypt all image and audio binaries and package them into an `attachments/` folder within the ZIP archive.

### 6.3 Prerequisites & Dependencies
- Input: Findings `C-03`, `H-13`, `M-07` from `docs/PRODUCTION_AUDIT.md`.
- Prerequisite: Phase 2 storage policies and Phase 3 Pro Tier infrastructure.

### 6.4 Verifiable Acceptance & Validation Criteria
1. **Self-Service Deletion End-to-End**: Create a test account, upload 2 photos, 1 audio note, and 3 entries; click "Delete Account"; verify:
   - User row deleted from `auth.users`.
   - All rows deleted from `profiles`, `diaries`, `media_files`.
   - Physical objects in `diary-images`, `diary-audio`, `avatars` reduced to 0.
   - Client is redirected to landing page and cached tokens are cleared.
2. **Google Play Web Portal**: Access `https://<domain>/#/delete-account` without being logged in; verify a clear web request form is accessible.
3. **Full Multimedia Export**: Trigger "Export Data"; open generated `.zip` file; verify presence of decrypted `.webp` images and `.webm` audio files alongside monthly JSON files.
4. **Policy Compliance Check**: Confirm presence of DPO contact, corporate address, and DPDP grievance mechanism in `PrivacyPolicy.tsx`.

### 6.5 Failure Modes & Rollback Procedures
- **Failure Mode**: Deletion fails midway due to a storage API timeout, leaving an orphaned auth account.
- **Mitigation & Rollback**: Implement idempotent retry in the Edge Function: if storage deletion times out, log to an administrative retry queue and return HTTP 500 with a clear message, ensuring `auth.admin.deleteUser` only executes after storage confirmation.

---

## Phase 7: Observability, Telemetry, Monitoring & Disaster Recovery

### 7.1 Objectives
1. Implement privacy-preserving, zero-PII client crash and error telemetry.
2. Configure automated database health monitoring, query latency metrics, and connection pool utilization alerts.
3. Set up CDN rate limiting and DDoS mitigation rules.
4. Establish, document, and test a Point-in-Time Recovery (PITR) disaster recovery runbook.

### 7.2 Concrete Technical Deliverables
- **`lib/telemetry.ts`**:
  - Deploy Sentry / OpenTelemetry with strict PII scrubbing:
    ```ts
    beforeSend(event) {
      // Strictly redact all ciphertexts, keys, and PII
      delete event.user?.ip_address;
      delete event.user?.email;
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
      }
      return event;
    }
    ```
- **Supabase Alerts & Observability**:
  - Configure alerts for:
    - PostgREST connection pool saturation > 80%.
    - Database CPU utilization > 70% sustained for 5 minutes.
    - Disk I/O consumption > 80%.
    - HTTP 5xx error rate > 1% over a 5-minute rolling window.
- **`docs/ops/DISASTER_RECOVERY_RUNBOOK.md`**:
  - Author a verified, step-by-step restoration runbook detailing:
    1. Executing a PITR database restore to a specific timestamp via Supabase CLI.
    2. Verifying schema integrity and foreign key relationships.
    3. Rolling forward DNS or updating Supabase connection strings.
    4. Client cache invalidation protocol.

### 7.3 Prerequisites & Dependencies
- Input: Findings `S1-03`, `S2-04`, `C-06` from `docs/PRODUCTION_AUDIT.md`.
- Prerequisite: Phase 3 Pro Tier infrastructure.

### 7.4 Verifiable Acceptance & Validation Criteria
1. **Telemetry PII Verification**: Intentionally trigger a test error in development; inspect event payload in Sentry; verify zero plaintext content, zero encryption keys, zero tokens, and zero IP addresses are present.
2. **Alert Simulation**: Simulate connection pool pressure; verify alerting webhook fires to Slack / PagerDuty within 2 minutes.
3. **Disaster Recovery Drill**: In a staging environment, execute a simulated PITR restore to a timestamp 10 minutes prior; verify all restored entries are decrypted successfully by the client.

### 7.5 Failure Modes & Rollback Procedures
- **Failure Mode**: Telemetry script blocks main thread or fails on strict ad-blocker environments.
- **Mitigation & Rollback**: Wrap telemetry initialization in non-blocking async execution; configure `try/catch` wrappers ensuring telemetry failures never interrupt core application workflows.

---

## Phase 8: Google Play Store Compliance, Android Native Hardening & Release Packaging

### 8.1 Objectives
1. Configure required Android runtime permissions in `AndroidManifest.xml` (`RECORD_AUDIO`, `POST_NOTIFICATIONS`, `ACCESS_COARSE_LOCATION`).
2. Synchronize Android `versionCode` and `versionName` dynamically with `package.json`.
3. Enable ProGuard / R8 code minification and obfuscation for native release builds.
4. Finalize the Google Play Console Data Safety declaration.
5. Generate and sign the production Android App Bundle (`.aab`).

### 8.2 Concrete Technical Deliverables
- **`android/app/src/main/AndroidManifest.xml`**:
  ```xml
  <!-- Required for voice notes -->
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  <!-- Required for task reminders on Android 13+ -->
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <!-- Required for coarse weather geotagging -->
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  ```
- **`android/app/build.gradle`**:
  - Dynamically read `versionCode` and `versionName` from `package.json`:
    ```groovy
    def packageJsonFile = new File(project.rootDir, '../package.json')
    def packageJson = new groovy.json.JsonSlurper().parseText(packageJsonFile.text)
    def appVersion = packageJson.version
    def code = (appVersion.replaceAll('\\.', '').toInteger() * 10)

    defaultConfig {
        versionCode code
        versionName appVersion
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    ```
- **`android/app/proguard-rules.pro`**:
  - Configure keep rules for Capacitor, WebCrypto, and Biometric plugins.
- **Release Packaging Pipeline**:
  - Generate release AAB:
    ```powershell
    npm run build
    npx cap sync android
    cd android
    ./gradlew bundleRelease
    ```

### 8.3 Prerequisites & Dependencies
- Input: Findings `C-04`, `M-05`, `M-06` from `docs/PRODUCTION_AUDIT.md`.
- Prerequisite: Phase 1 (Biometrics), Phase 4 (UI), and Phase 6 (Legal & Account Deletion).

### 8.4 Verifiable Acceptance & Validation Criteria
1. **Microphone Permission Flow**: Install release APK on a physical Android device; click "Record Voice Note"; verify OS displays native runtime permission dialog and audio records cleanly.
2. **Notification Delivery**: Schedule a task reminder on Android 14; verify notification delivers on time with masked private text.
3. **App Bundle Verification**: Run `bundletool` on `app-release.aab`; verify total download size is < 15 MB and `FLAG_SECURE` remains active in `MainActivity`.
4. **Play Console Pre-Launch Report**: Upload AAB to Play Console Internal Testing track; verify 0 crashes across all automated Firebase Test Lab devices.

### 8.5 Failure Modes & Rollback Procedures
- **Failure Mode**: ProGuard obfuscation breaks native reflection in Capacitor plugins.
- **Mitigation & Rollback**: If crashes appear in Pre-Launch Reports, examine stack traces, add missing `-keep class com.capacitorjs.** { *; }` rules in `proguard-rules.pro`, and rebuild.

---

## Phase 9: End-to-End Stress Testing, Load Testing & Security Penetration Audit

### 9.1 Objectives
1. Validate database and API performance under a simulated load of 10,000 DAU (150 concurrent users, 150 RPS burst).
2. Execute automated Playwright E2E suites verifying all critical user journeys across desktop and mobile viewports.
3. Conduct static and dynamic application security testing (SAST/DAST) across all RLS policies and authentication flows.
4. Benchmark client-side Web Crypto decryption performance on low-end Android hardware.

### 9.2 Concrete Technical Deliverables
- **`tests/load/k6-10k-dau.js`**:
  - k6 load testing script executing realistic user behavior:
    - 60% Reading timeline entries.
    - 20% Searching and filtering by mood/journal.
    - 15% Drafting and saving new entries.
    - 5% Media upload/playback.
- **`verification/playwright/e2e-production-flows.spec.ts`**:
  - Automated Playwright suite testing:
    - Signup and vault initialization with 600,000 PBKDF2 iterations.
    - AES-GCM encryption/decryption round-trip.
    - Offline drafting and reconnection sync.
    - Full account deletion and storage verification.
- **Security Penetration Suite**:
  - Automated tests validating that:
    - User A cannot read, update, or delete User B's diary rows (RLS check).
    - Unauthenticated requests to storage buckets receive 403 Forbidden.
    - Signed URLs expire strictly after configured TTL.

### 9.3 Prerequisites & Dependencies
- Input: All findings from `docs/PRODUCTION_AUDIT.md`.
- Prerequisite: Phases 1 through 8 completed and deployed in a staging environment.

### 9.4 Verifiable Acceptance & Validation Criteria
1. **k6 Load Benchmark**: Sustain 150 RPS for 30 minutes; verify:
   - p95 API response time < 100ms.
   - p99 API response time < 250ms.
   - HTTP 5xx error rate = 0.00%.
   - Supabase database CPU < 35%.
2. **Playwright E2E Suite**: 100% pass rate across 25+ integration scenarios.
3. **Security Audit Cleanliness**: 0 Critical, 0 High, and 0 Medium vulnerabilities reported by SAST/DAST tools.

### 9.5 Failure Modes & Rollback Procedures
- **Failure Mode**: k6 test reveals PostgREST connection queuing during burst writes.
- **Mitigation & Rollback**: Fine-tune Supavisor transaction pool parameters and optimize PostgreSQL `work_mem` and `effective_cache_size` settings.

---

## Phase 10: Production Launch Orchestration, Canary Deployment & Post-Launch Ops

### 10.1 Objectives
1. Orchestrate a staged, low-risk canary rollout across Google Play Store and Web PWA.
2. Maintain active 24/7 monitoring of connection poolers, crash-free session rates, and error budgets.
3. Deploy automated scheduled database maintenance jobs via `pg_cron`.
4. Establish ongoing post-launch operational cadence and incident management runbooks.

### 10.2 Concrete Technical Deliverables
- **Staged Rollout Schedule**:
  - **Day 1**: Internal Alpha (Core Team & 50 Beta Testers).
  - **Day 3**: 5% Canary Release on Google Play Store.
  - **Day 5**: 25% Rollout expansion.
  - **Day 7**: 100% General Availability (GA) & Web PWA production DNS cutover.
- **`supabase/migrations/20261110000004_pg_cron_maintenance.sql`**:
  ```sql
  -- Enable pg_cron extension
  CREATE EXTENSION IF NOT EXISTS pg_cron;

  -- Nightly maintenance at 03:00 UTC: VACUUM ANALYZE active tables
  SELECT cron.schedule('nightly-vacuum', '0 3 * * *', 'VACUUM ANALYZE public.diaries, public.media_files, public.personal_tasks;');

  -- Weekly cleanup of soft-deleted tasks older than 30 days
  SELECT cron.schedule('weekly-task-purge', '0 4 * * 0', 'DELETE FROM public.personal_tasks WHERE deleted_at < now() - interval ''30 days'';');
  ```
- **`docs/ops/PRODUCTION_LAUNCH_CHECKLIST.md`**:
  - Authoritative 50-point go/no-go verification checklist signed off by Engineering, Security, and Legal leads.
- **Post-Launch Escalation Matrix**:
  - Defined SLA tiers: P0 (immediate 15-min response), P1 (1-hour response), P2 (24-hour response).

### 10.3 Prerequisites & Dependencies
- Prerequisite: Phase 9 stress testing and penetration audit fully passed.

### 10.4 Verifiable Acceptance & Validation Criteria
1. **Canary Crash-Free Rate**: Achieve **> 99.9% crash-free sessions** over the 5% and 25% rollout stages.
2. **Database Performance at Scale**: Real-time monitoring confirms CPU utilization remains < 25% under full 10,000 DAU production traffic.
3. **Cron Execution**: Inspect `cron.job_run_details`; confirm `nightly-vacuum` executes successfully with return code `0`.
4. **Google Play Store Status**: Application status is "Production - Live" with approved Data Safety disclosures and 0 policy warnings.

### 10.5 Failure Modes & Rollback Procedures
- **Failure Mode**: High crash rate detected during 5% canary deployment on specific Android device models.
- **Mitigation & Rollback**: Immediately halt rollout in Google Play Console (Rollout -> Halt); revert web deployment to previous release tag; examine Sentry stack traces, patch issue in emergency hotfix branch, and restart canary at 1%.

---

## Master Implementation Timeline & Resource Allocation

| Phase | Title | Primary Engineering Domain | Estimated Duration | Dependencies |
| :---: | :--- | :--- | :---: | :---: |
| **Phase 1** | Cryptographic Hardening & Zero-Knowledge Privacy | Cryptography & Security | Days 1–3 | Baseline Audit |
| **Phase 2** | Database Indexing, RLS & Storage Rectification | PostgreSQL / Backend | Days 3–5 | Phase 1 |
| **Phase 3** | Infrastructure Scaling & Third-Party Decoupling | Cloud Infrastructure / DevOps | Days 5–7 | Phase 2 |
| **Phase 4** | Frontend Architecture, Code Splitting & UI/UX | Frontend / React / Vite | Days 7–10 | Phase 1, 2 |
| **Phase 5** | PWA Resilience, Offline Outbox & Caching | PWA / Service Worker | Days 10–13 | Phase 4 |
| **Phase 6** | Legal, Privacy Compliance (GDPR/DPDP/Account Deletion)| Legal / Full-Stack | Days 13–15 | Phase 2, 3 |
| **Phase 7** | Observability, Telemetry & Disaster Recovery | DevOps / SRE | Days 15–17 | Phase 3, 6 |
| **Phase 8** | Google Play Store Compliance & Android Hardening | Mobile / Android / Capacitor | Days 17–19 | Phase 1, 4, 6 |
| **Phase 9** | Stress Testing, Load Testing & Security Audit | QA / Security / Perf | Days 19–22 | Phases 1–8 |
| **Phase 10**| Production Launch Orchestration & Canary Rollout | Engineering Leadership | Days 22–28 | Phase 9 |

**Total Estimated Implementation Window**: 28 Calendar Days to Full Production Launch at 10,000 DAU.
