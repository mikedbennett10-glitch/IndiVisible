-- Enable pg_cron and pg_net for scheduled push notification delivery
-- NOTE: pg_cron must be enabled in your Supabase project dashboard first:
--   Database > Extensions > search "pg_cron" > Enable

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ==========================================================================
-- CRON JOB: Call the send-push-notifications Edge Function every minute
-- ==========================================================================
-- After deploying the Edge Function, run this in the SQL Editor.
-- Replace <YOUR_PROJECT_REF> with your Supabase project reference (e.g. abcdefghijkl)
-- Replace <YOUR_SERVICE_ROLE_KEY> with your service role key from Settings > API

-- select cron.schedule(
--   'send-push-notifications',     -- job name
--   '* * * * *',                    -- every minute
--   $$
--   select net.http_post(
--     url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-push-notifications',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
--     ),
--     body := '{}'::jsonb
--   ) as request_id;
--   $$
-- );

-- To check scheduled jobs:   select * from cron.job;
-- To remove the job:         select cron.unschedule('send-push-notifications');
