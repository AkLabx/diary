# Master Decision Ledger & Architectural Invariants (`DECISIONS_MASTER.md`)

Authoritative ledger of architectural choices and invariants. Consult at cold start to avoid reviving retired approaches or re-introducing solved bugs.

---

## 1. Active Decisions & Invariants (Preserve Always)

| ID | Ver | Area | Chosen Path | Why / Evidence | Do-Not-Break Invariant | Ref |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | `v1.0.15` | Crypto | AES-GCM 256 + PBKDF2 (`v1:600000:salt`; `100k` legacy fallback) | Zero-knowledge security; server holds no keys or plaintext. | Never store plaintext user entries; `encrypted_entry` holds ciphertext only. | [`lib/crypto.ts`](../lib/crypto.ts) |
| **DEC-002** | `v1.0.0` | Storage | Private buckets (`diary-images`, `diary-audio`, `avatars`) + batch signed URLs | Prevents public scraping and N+1 roundtrips. | Buckets stay `public = false`; access exclusively via short-lived signed URLs. | [`docs/ai/security.md`](./ai/security.md) |
| **DEC-003** | `v1.0.15` | PWA/SW | `VitePWA` (`registerType: 'prompt'`); caches app shell & pinned CDN styles only | Manual `sw.js` risked stale code; API caching risks E2EE leaks. | SW must NEVER cache user diary data, metadata, or Supabase responses. | [`vite.config.ts`](../vite.config.ts) |
| **DEC-004** | `v1.0.12` | Toolchain | Root `powershell.bat` (`-ExecutionPolicy Bypass`) + NVM `D:\DevTools\nvm\v22.16.0` | Fixes Windows `exebox` `powershell` resolution & `.ps1` blocks. | Keep `powershell.bat` gitignored; direct shells inject NVM PATH + `npm.cmd`/`npx.cmd`. | [`docs/ai/workflow.md`](./ai/workflow.md) |
| **DEC-005** | `v1.0.0` | Layout | Root source files (`App.tsx`, `DiaryLayout.tsx`, `index.tsx`, `routes/`) | Preserves repo history, imports, and Vite/TS configs. | Core app files live in workspace root; never move into `src/`. | [`AGENTS.md`](../AGENTS.md) |
| **DEC-006** | `v1.0.14` | Routing | React Router v7 Data Router (`createHashRouter` + `RouterProvider`) + `useBlocker` | Legacy `<HashRouter>` lacks unsaved-change blocking. | Use `createHashRouter` + `Link`; never revert to `<HashRouter>`. | [`App.tsx`](../App.tsx) |
| **DEC-007** | `v1.0.5` | Styling | Build-time PostCSS Tailwind CSS v3 | CDN Tailwind fails offline and violates strict CSP. | Build-time PostCSS only; CDN Tailwind & inline `tailwind.config` banned. | [`package.json`](../package.json) |
| **DEC-008** | `v1.0.18` | Compat | `"browserslist": ["baseline widely available"]` + MWG pre-check | Aligns GitHub Pages with Android WebView (`minSdkVersion = 24`). | Baseline Newly/Limited features require `@supports`/JS check + `<=20`-line fallback. | [`package.json`](../package.json) |
| **DEC-009** | `v1.0.20` | Sanitize | Centralized DOMPurify in `lib/sanitizeHtml.ts` + `afterSanitizeAttributes` | Blocks XSS & reverse-tabnabbing across viewer and editor. | Route all HTML via `sanitizeHtml.ts`; links enforce `target="_blank" rel="noopener noreferrer"`. | [`lib/sanitizeHtml.ts`](../lib/sanitizeHtml.ts) |
| **DEC-010** | `v1.0.20` | Offline | `diary_drafts_db` v2 partitioned (`editor_drafts` / `entry_read_cache`), `userId`-scoped | Stops cross-account draft bleed and strips `localStorage` leaks. | Persist encrypted payloads in IndexedDB only; no decrypted text in `localStorage`. | [`lib/autoSave.ts`](../lib/autoSave.ts) |
| **DEC-011** | `v1.0.15` | Perf | Timeline masonry grid (`DiaryList.tsx`) excludes media thumbnails | Mass signed-URL decryption bottlenecks timeline scrolling. | Exclude thumbnails from timeline cards; decrypt media in Entry View only. | [`components/DiaryList.tsx`](../components/DiaryList.tsx) |
| **DEC-012** | `v1.0.20` | Privacy | Mood, tags, journal encrypted in payload; avatars encrypted to `.bin` | Cleartext DB columns and `.webp` avatars leaked metadata. | Keep `mood`, `tags`, `journal` columns null/default; encrypt avatars client-side. | [`DiaryLayout.tsx`](../DiaryLayout.tsx) |
| **DEC-013** | `v1.0.15` | Stability | 32 KB chunked subarray loop in `encodeBase64` | Avoids `RangeError: Maximum call stack size exceeded` > 64 KB. | Never use `...bytes` spread on binary arrays in base64 conversion. | [`lib/crypto.ts`](../lib/crypto.ts) |
| **DEC-014** | `v1.0.20` | Keys | `CryptoKey` `extractable: false`, wiped on `SIGNED_OUT`; `BIOMETRY_CURRENT_SET` | Prevents key exfiltration and invalidates keystore on new device biometrics. | Keep `extractable: false` default; clear keys on sign-out or biometry change. | [`contexts/CryptoContext.tsx`](../contexts/CryptoContext.tsx) |
| **DEC-015** | `v1.0.20` | CSP/SRI | Strict CSP meta tag in `index.html` with pinned SHA-256 hash + Quill SRI | Eliminates `'unsafe-inline'` scripts and pins external CSS. | Keep pinned SHA-256 CSP hash current for inline scripts; never add `'unsafe-inline'`. | [`index.html`](../index.html) |
| **DEC-016** | `v1.0.16` | Bundling | Vite native splitting + `React.lazy()`; `/diary/` web base + `public/404.html` | Custom `manualChunks` caused circular ESM `React` crash at boot. | Never add circular Rollup `manualChunks` or `importmap`; keep `"Install App"` on mobile. | [`vite.config.ts`](../vite.config.ts) |
| **DEC-017** | `v1.0.15` | Postgres | Covering indexes + `(SELECT auth.uid())` RLS; RPCs default `SECURITY INVOKER` | Eliminates sequential scans and per-row RLS re-evaluation at 10k DAU. | `SECURITY DEFINER` RPCs need `SET search_path = public`; keep `(SELECT auth.uid())`. | [`docs/migrations/`](./migrations/20261116_complete_baseline_ddl_and_rls.sql) |
| **DEC-018** | `v1.0.19` | Modals | Native `<dialog>.showModal()` (`ConfirmationModal`, `useModalDialog`) | Prevents scroll bleed, fixes mobile sheets, enforces focus/Escape. | Never use `alert()`/`confirm()`; route via `ConfirmationModal` / `<dialog>`. | [`components/ConfirmationModal.tsx`](../components/ConfirmationModal.tsx) |
| **DEC-019** | `v1.0.20+`| Ritual | Automated `npm run check:ritual` + GitHub `pr-check.yml` CI gate | Enforces version sync, secret scan, and `<20 KB` Hot Context cap mechanically. | Every PR must pass `pr-check.yml` and `npm run check:ritual` before merge. | [`scripts/verify-ritual.mjs`](../scripts/verify-ritual.mjs) |
| **DEC-020** | `v1.0.22` | CI/Tests | Deploy CI matches PR gates (Node 22, `fetch-depth: 0`, `check:ci`); `tests/` scanned, env-only creds | Deploy CI skipped typecheck/lint/ritual and tests lagged `v1.0.20` privacy/auth rules. | Keep `main.yml` parity with `pr-check.yml`; never exempt `tests/` or hardcode creds. | [`.github/workflows/main.yml`](../.github/workflows/main.yml) |

---

## 2. Superseded Decisions (Do NOT Revive)

| ID | Ver | Area | Retired Approach | Replacement | Why Retired |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SUP-001** | `v1.0.20` | Metadata | Plaintext `mood`, `tags`, `journal` columns & raw avatars | Encrypted payload metadata & `.bin` avatars | Leaked mental-health/personal metadata. |
| **SUP-002** | `v1.0.15` | Crypto | Spread operator (`String.fromCharCode(...bytes)`) | 32 KB chunked subarray loop | Stack overflow (`RangeError`) > 64 KB. |
| **SUP-003** | `v1.0.20` | Privacy | Automatic IP geolocation weather lookup | Explicit GPS consent / city search via `weather-proxy` | Exposed user IP/location silently. |
| **SUP-004** | `v1.0.14` | Routing | Legacy `<HashRouter>` | `createHashRouter` + `RouterProvider` | Lacked `useBlocker` draft protection. |
| **SUP-005** | `v1.0.5` | Styling | Tailwind CDN script in `index.html` | Build-time PostCSS Tailwind v3 | Failed offline & violated CSP. |
| **SUP-006** | `v1.0.16` | Bundling | Custom Rollup `manualChunks` | Vite native splitting + `React.lazy()` | Circular ESM import crashed startup. |
| **SUP-007** | `v1.0.15` | PWA | Manual `public/sw.js` & `manifest.json` | Build-time `VitePWA` (`vite.config.ts`) | Duplicate SW & stale cache risk. |
| **SUP-008** | `v1.0.20` | Security | Extractable `CryptoKey`, `localStorage` metadata, doc creds | `extractable: false`, partitioned IndexedDB, env creds | Prevented XSS key theft & doc leaks. |
