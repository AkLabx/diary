-- docs/migrations/20261110_phase10_cron_maintenance.sql
-- Phase 10: Automated Database Maintenance & Vacuum Schedules via pg_cron
-- Target Project Ref: ccgiozknvlknbrkzfcdx

-- 1. Enable pg_cron extension (if supported on compute tier)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Nightly VACUUM ANALYZE at 03:00 UTC
-- Keeps table statistics fresh and reclaims space on high-churn tables (diaries, media_files, task_history)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'nightly-vacuum-analyze',
      '0 3 * * *',
      'VACUUM ANALYZE public.diaries, public.media_files, public.profiles, public.personal_tasks, public.task_history;'
    );
  END IF;
END $$;

-- 3. Weekly cleanup of soft-deleted personal tasks older than 30 days
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'weekly-soft-deleted-tasks-purge',
      '0 4 * * 0',
      'DELETE FROM public.personal_tasks WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval ''30 days'';'
    );
  END IF;
END $$;
