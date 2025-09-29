-- Enable cron and net extensions for scheduled functions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule property sync from Bayut API - 4 times per day (every 6 hours)
SELECT cron.schedule(
  'bayut-property-sync',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://guiuvgtexjehvmeefxqu.supabase.co/functions/v1/property-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aXV2Z3RleGplaHZtZWVmeHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjY2MTcsImV4cCI6MjA3NDEwMjYxN30.KD093Ah-Bnz2ZQaYvLGPhV37E-vsnlyol4sfOzvNeVA"}'::jsonb,
        body:='{"purpose": "for-sale", "pages": 2}'::jsonb
    ) as request_id;
  $$
);

-- Schedule property sync for rental properties - 4 times per day (offset by 3 hours)
SELECT cron.schedule(
  'bayut-rental-sync',
  '0 3,9,15,21 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://guiuvgtexjehvmeefxqu.supabase.co/functions/v1/property-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aXV2Z3RleGplaHZtZWVmeHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjY2MTcsImV4cCI6MjA3NDEwMjYxN30.KD093Ah-Bnz2ZQaYvLGPhV37E-vsnlyol4sfOzvNeVA"}'::jsonb,
        body:='{"purpose": "for-rent", "pages": 2}'::jsonb
    ) as request_id;
  $$
);

-- Schedule Telegram scraping - twice per day
SELECT cron.schedule(
  'telegram-scraping-sync',
  '0 1,13 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://guiuvgtexjehvmeefxqu.supabase.co/functions/v1/property-scraper',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1aXV2Z3RleGplaHZtZWVmeHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjY2MTcsImV4cCI6MjA3NDEwMjYxN30.KD093Ah-Bnz2ZQaYvLGPhV37E-vsnlyol4sfOzvNeVA"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Create a table to track cron job executions
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL,
    response_data JSONB,
    error_message TEXT
);

-- Enable RLS for cron_job_logs
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to cron job logs
CREATE POLICY "Allow public access to cron job logs" 
ON public.cron_job_logs 
FOR ALL
USING (true);