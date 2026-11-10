-- Migration: 20261110_phase2_performance_indexes_and_rls.sql
-- Description: Establish covering indexes on diaries, media_files, and task foreign keys;
--              optimize RLS policies to use (SELECT auth.uid()) InitPlan subqueries;
--              add missing DELETE policy on storage bucket 'diary-audio'.

-- 1. Covering composite index for timeline queries on diaries
CREATE INDEX IF NOT EXISTS idx_diaries_owner_created 
ON public.diaries (owner_id, created_at DESC);

-- 2. Covering indexes for media_files lookups
CREATE INDEX IF NOT EXISTS idx_media_files_user_id 
ON public.media_files (user_id);

CREATE INDEX IF NOT EXISTS idx_media_files_entry_id 
ON public.media_files (entry_id);

-- 3. Covering indexes for unindexed foreign keys on tasks
CREATE INDEX IF NOT EXISTS idx_task_history_task_id 
ON public.task_history (task_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id 
ON public.task_attachments (task_id);

-- 4. Storage Bucket 'diary-audio' Missing DELETE Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own audio'
  ) THEN
    CREATE POLICY "Users can delete their own audio" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'diary-audio' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
  END IF;
END $$;

-- 5. Optimize public.diaries RLS to use (SELECT auth.uid()) InitPlan subqueries
ALTER POLICY "Users can view their own diary entries." 
ON public.diaries USING (owner_id = (SELECT auth.uid()));

ALTER POLICY "Users can create their own diary entries." 
ON public.diaries WITH CHECK (owner_id = (SELECT auth.uid()));

ALTER POLICY "Users can update their own diary entries." 
ON public.diaries USING (owner_id = (SELECT auth.uid()));

ALTER POLICY "Users can delete their own diary entries." 
ON public.diaries USING (owner_id = (SELECT auth.uid()));
