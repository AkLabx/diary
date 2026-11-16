-- =============================================================================
-- Migration: 20261116_complete_baseline_ddl_and_rls.sql
-- Description: Complete, authoritative reference baseline DDL and RLS security model
--              for the Diary App (Target Ref: ccgiozknvlknbrkzfcdx).
-- Architecture: Zero-Knowledge Client-Side AES-256-GCM End-to-End Encryption (E2EE)
-- Invariants:
--   1. Zero unencrypted diary content or task payloads stored in database tables.
--   2. Storage buckets ('diary-images', 'diary-audio', 'avatars') are STRICTLY PRIVATE.
--   3. All table operations enforce strict Row Level Security (RLS) with (SELECT auth.uid()) InitPlan subqueries.
--   4. Foreign keys cascade deletes cleanly when accounts or parent rows are removed.
-- =============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 1: CORE DIARY & AUTH TABLES
-- =============================================================================

-- 1.1 Profiles (Stores user public metadata & zero-knowledge client encryption verification material)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salt text NOT NULL,                      -- Base64 PBKDF2 salt (100k or 600k iterations)
  key_check_value text NOT NULL,           -- Encrypted verification string ("DAILY_DIARY_KEY_CHECK_v1")
  key_check_iv text NOT NULL,              -- 12-byte IV for key_check_value
  full_name text,
  avatar_url text,                         -- Relative path in private 'avatars' storage bucket
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile.') THEN
    CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can create their own profile.') THEN
    CREATE POLICY "Users can create their own profile." ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile.') THEN
    CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can delete their own profile.') THEN
    CREATE POLICY "Users can delete their own profile." ON public.profiles FOR DELETE TO authenticated USING (id = (SELECT auth.uid()));
  END IF;
END $$;

-- 1.2 Diaries (Stores client-encrypted diary entries)
CREATE TABLE IF NOT EXISTS public.diaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_entry text NOT NULL,           -- AES-GCM ciphertext (title, content, tags, mood, audio metadata)
  iv text NOT NULL,                        -- Initialization Vector (Base64)
  tags text[] NULL,                        -- Deprecated plaintext mirror: kept null for privacy preservation
  mood text NULL,                          -- Deprecated plaintext mirror: kept null for privacy preservation
  journal text DEFAULT 'Personal',         -- Deprecated plaintext mirror: kept null or static default
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diaries' AND policyname = 'Users can view their own diary entries.') THEN
    CREATE POLICY "Users can view their own diary entries." ON public.diaries FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diaries' AND policyname = 'Users can create their own diary entries.') THEN
    CREATE POLICY "Users can create their own diary entries." ON public.diaries FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diaries' AND policyname = 'Users can update their own diary entries.') THEN
    CREATE POLICY "Users can update their own diary entries." ON public.diaries FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'diaries' AND policyname = 'Users can delete their own diary entries.') THEN
    CREATE POLICY "Users can delete their own diary entries." ON public.diaries FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_diaries_owner_created ON public.diaries (owner_id, created_at DESC);

-- 1.3 Media Files (Tracks encrypted attachment files across diary entries for lifecycle management)
CREATE TABLE IF NOT EXISTS public.media_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.diaries(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL,                 -- 'image' | 'audio'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_entry_file UNIQUE (entry_id, file_path)
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media_files' AND policyname = 'Users can view their own media files.') THEN
    CREATE POLICY "Users can view their own media files." ON public.media_files FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media_files' AND policyname = 'Users can create their own media files.') THEN
    CREATE POLICY "Users can create their own media files." ON public.media_files FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'media_files' AND policyname = 'Users can delete their own media files.') THEN
    CREATE POLICY "Users can delete their own media files." ON public.media_files FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON public.media_files (user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_entry_id ON public.media_files (entry_id);

-- =============================================================================
-- SECTION 2: PERSONAL TASKS SUITE (SANCTUARY SUITE)
-- =============================================================================

-- 2.1 Personal Tasks
CREATE TABLE IF NOT EXISTS public.personal_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.diaries(id) ON DELETE SET NULL,
  encrypted_task text NOT NULL,           -- AES-GCM ciphertext (title, notes, recurrence, reminderTime)
  iv text NOT NULL,
  checksum text NOT NULL,                 -- SHA-256 integrity checksum
  key_version integer NOT NULL DEFAULT 1,
  schema_version integer NOT NULL DEFAULT 1,
  version integer NOT NULL DEFAULT 1,     -- Optimistic Concurrency Control (OCC)
  is_completed boolean NOT NULL DEFAULT false,
  category_code integer NOT NULL DEFAULT 0, -- 0=General, 1=Personal, 2=Health, 3=Family, 4=Career, 5=Finance
  energy_level smallint NOT NULL DEFAULT 1 CHECK (energy_level IN (1, 2, 3)),
  importance_level smallint NOT NULL DEFAULT 2 CHECK (importance_level IN (1, 2, 3)),
  due_date date,
  completed_at timestamp with time zone,
  deleted_at timestamp with time zone,    -- Soft delete support
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'personal_tasks' AND policyname = 'Users can view their own tasks.') THEN
    CREATE POLICY "Users can view their own tasks." ON public.personal_tasks FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'personal_tasks' AND policyname = 'Users can create their own tasks.') THEN
    CREATE POLICY "Users can create their own tasks." ON public.personal_tasks FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'personal_tasks' AND policyname = 'Users can update their own tasks.') THEN
    CREATE POLICY "Users can update their own tasks." ON public.personal_tasks FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'personal_tasks' AND policyname = 'Users can delete their own tasks.') THEN
    CREATE POLICY "Users can delete their own tasks." ON public.personal_tasks FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_personal_tasks_owner_completed ON public.personal_tasks (owner_id, is_completed, due_date);
CREATE INDEX IF NOT EXISTS idx_personal_tasks_owner_deleted ON public.personal_tasks (owner_id, deleted_at);

-- 2.2 Task Templates (Recurring task definitions)
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_template text NOT NULL,
  iv text NOT NULL,
  checksum text NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  schema_version integer NOT NULL DEFAULT 1,
  rrule text NOT NULL,
  active_from timestamp with time zone NOT NULL DEFAULT now(),
  active_until timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_templates' AND policyname = 'Users can manage their own task templates.') THEN
    CREATE POLICY "Users can manage their own task templates." ON public.task_templates FOR ALL TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
END $$;

-- 2.3 Task History (Encrypted audit diffs)
CREATE TABLE IF NOT EXISTS public.task_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.personal_tasks(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  encrypted_diff text NOT NULL,
  iv text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_history' AND policyname = 'Users can manage their own task history.') THEN
    CREATE POLICY "Users can manage their own task history." ON public.task_history FOR ALL TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON public.task_history (task_id);

-- 2.4 Task Attachments
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.personal_tasks(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_type text NOT NULL,
  encrypted_metadata text NOT NULL,
  iv text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_attachments' AND policyname = 'Users can manage their own task attachments.') THEN
    CREATE POLICY "Users can manage their own task attachments." ON public.task_attachments FOR ALL TO authenticated USING (owner_id = (SELECT auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments (task_id);

-- =============================================================================
-- SECTION 3: STRICTLY PRIVATE STORAGE BUCKETS & RLS
-- =============================================================================

-- Ensure private bucket creation (public = false)
INSERT INTO storage.buckets (id, name, public)
VALUES ('diary-images', 'diary-images', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('diary-audio', 'diary-audio', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage RLS: Owner Folder Isolation (storage.foldername(name))[1] = auth.uid()::text
DO $$ BEGIN
  -- diary-images
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read their own images') THEN
    CREATE POLICY "Users can read their own images" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'diary-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own images') THEN
    CREATE POLICY "Users can upload their own images" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'diary-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own images') THEN
    CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'diary-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own images') THEN
    CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'diary-images' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;

  -- diary-audio
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read their own audio') THEN
    CREATE POLICY "Users can read their own audio" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'diary-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own audio') THEN
    CREATE POLICY "Users can upload their own audio" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'diary-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own audio') THEN
    CREATE POLICY "Users can update their own audio" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'diary-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own audio') THEN
    CREATE POLICY "Users can delete their own audio" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'diary-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;

  -- avatars
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read their own avatars') THEN
    CREATE POLICY "Users can read their own avatars" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own avatars') THEN
    CREATE POLICY "Users can upload their own avatars" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own avatars') THEN
    CREATE POLICY "Users can update their own avatars" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own avatars') THEN
    CREATE POLICY "Users can delete their own avatars" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
END $$;
