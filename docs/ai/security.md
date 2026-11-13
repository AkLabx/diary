# AI Security & Database Guidelines

## 1. Environment & Credential Safety
- **Zero Secrets in Code**: Never hardcode, commit, or log private API keys, service role credentials, database connection strings, or master passwords.
- **Client Bundles**: Only public client variables intended for the browser (e.g., `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) belong in client-side bundles.
- **Git Safety**: Ensure all `.env*` files with real credentials (such as `.env.local`) are strictly listed in `.gitignore`.
- **Target Project Binding**: Supabase operations are bound to the Diary App backend project ref `ccgiozknvlknbrkzfcdx` (`https://ccgiozknvlknbrkzfcdx.supabase.co`).

---

## 2. Client-Side End-to-End Encryption (E2EE) Hard Invariants
Our application operates under strict client-side Zero-Knowledge End-to-End Encryption:
- **Zero Unencrypted User Data**: Diary entry contents and titles are AES-GCM 256-bit encrypted on the client device before transmission. The database column `encrypted_entry` stores the ciphertext. NEVER alter the database or client code to store plaintext content.
- **Client Cryptography (`lib/crypto.ts`)**: Key derivation uses PBKDF2 (100k iterations). Master passwords and raw encryption keys are never sent to or stored on any server.
- **Encryption Verification Material (`profiles` table)**: Stores `salt`, `key_check_value`, and `key_check_iv`. These materials allow the client to verify password correctness locally without the server ever learning the master password.
- **Draft Auto-Saving Security**: Encrypted drafts are cached locally in IndexedDB using `lib/autoSave.ts` in the `diary_drafts_db` database. Unencrypted drafts must never be written to storage.
- **Service Worker Data Isolation**: The generated Workbox Service Worker (configured via `VitePWA` in `vite.config.ts`) caches app shell assets and CDN font/stylesheet dependencies only. **It must strictly avoid caching any user data, decrypted diary entries, or Supabase API/storage responses.**
- **Media Upload Interception**: Drag-and-drop image uploads in `DiaryEditor.tsx` are intercepted by custom `onDrop` handlers to route files through `handleImageUpload`. Unencrypted base64 image strings must never be inserted into Quill. Image thumbnails are excluded from the timeline view to prevent mass client-side signed URL decryption bottlenecks.

---

## 3. Storage Bucket Security & Media Management
- **Strictly Private Buckets**: Supabase storage buckets `diary-images`, `diary-audio`, and `avatars` must remain **STRICTLY PRIVATE** (`public = false`). Direct public URL access is forbidden.
- **Signed URLs**: Media access is granted exclusively through short-lived Supabase Signed URLs generated for authenticated resource owners.
- **Orphan Media Cleanup**: Media files are tracked in `public.media_files`. Helper functions in `lib/cleanupUtils.ts` (`extractImagePaths`, `diffImagePaths`) must be invoked during entry updates and deletions to delete orphaned files from storage buckets.

---

## 4. Authoritative Database Schema & RLS

Every user-accessible table in the `public` schema has Row Level Security (RLS) strictly enabled:

### `public.profiles`
```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salt text NOT NULL,
  key_check_value text NOT NULL,
  key_check_iv text NOT NULL,
  full_name text,
  avatar_url text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```
RLS Policies:
- **INSERT**: `auth.uid() = id`
- **SELECT**: `auth.uid() = id`
- **UPDATE**: `auth.uid() = id`

### `public.diaries`
```sql
CREATE TABLE public.diaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_entry text NOT NULL,
  iv text NOT NULL,
  tags text[] NULL,
  mood text NULL,
  journal text DEFAULT 'Personal',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;
```
RLS Policies:
- **INSERT**: `auth.uid() = owner_id`
- **SELECT**: `auth.uid() = owner_id`
- **UPDATE**: `auth.uid() = owner_id`
- **DELETE**: `auth.uid() = owner_id`

### `public.media_files`
```sql
CREATE TABLE public.media_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_entry_file UNIQUE (entry_id, file_path)
);
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
```
RLS Policies:
- **INSERT**: `auth.uid() = user_id`
- **SELECT**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

### Contextual Authorization Patterns
- **User-owned records**: `auth.uid() = user_id`
- **Team / Organization access**:
  ```sql
  CREATE POLICY "Team members read data" ON public.items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_members.team_id = items.team_id
        AND team_members.user_id = auth.uid()
      )
    );
  ```
- **Public read-only data**: `FOR SELECT USING (is_published = true)`
- **Destructive Operations Guardrail**: NEVER execute destructive database operations (`DROP TABLE`, `TRUNCATE`, bulk `DELETE`) without explicit user authorization.

---

## 5. PostgreSQL Functions & RPC Safety
- **Default to `SECURITY INVOKER`**:
  Always use `SECURITY INVOKER` so database functions execute with the caller's privileges and respect RLS:
  ```sql
  CREATE OR REPLACE FUNCTION public.perform_action()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = public
  AS $$
  BEGIN
    -- Function logic
  END;
  $$;
  ```
- **When using `SECURITY DEFINER`**:
  - Use ONLY when elevated privileges are strictly necessary (e.g., auth hooks, system audit logging).
  - Explicitly set `SET search_path = public` to prevent search path hijacking.
  - Implement internal authorization checks to ensure the calling user (`auth.uid()`) has permission.

---

## 6. DOM & XSS Hardening
- **DOMPurify Configuration**: In `DiaryEntryView.tsx`, the DOMPurify configuration explicitly allows `<figure>`, `<figcaption>`, and `<a>` tags.
- **Link Target Hook**: You **must** utilize the `afterSanitizeAttributes` hook to automatically set `target="_blank"` and `rel="noopener noreferrer"` on all external links to prevent reverse tabnabbing and keep users safely inside the PWA.

---

## 7. Supabase Client Management & Auth Initialization
- **Centralized Client**: Rely on the project's centralized Supabase client instance in `lib/supabaseClient.ts`. Do not initialize ad-hoc `createClient()` calls inside UI components.
- **Guaranteed Init**: In `App.tsx`, `supabase.auth.getSession()` must be wrapped in a `try...finally` block to guarantee `setLoading(false)` is invoked, ensuring the UI renders even if the Supabase connection fails.
- **Network Error Handling**: `components/Auth.tsx` implements explicit handling for `TypeError: Failed to fetch` to distinguish network/firewall drops from auth rejection.
