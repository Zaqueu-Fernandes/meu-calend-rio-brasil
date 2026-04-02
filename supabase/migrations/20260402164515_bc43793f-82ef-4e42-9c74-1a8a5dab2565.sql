
SELECT cron.schedule(
  'check-alarms-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mojasnovcwxulhxhgyqs.supabase.co/functions/v1/check-alarms',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vamFzbm92Y3d4dWxoeGhneXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzcyNzcsImV4cCI6MjA4NjU1MzI3N30.RjJBKA_IcO-2XdRzJqP5xD4HNvmdNsEbCjnT_PW9kLg"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
