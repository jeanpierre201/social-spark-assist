-- Enable pg_net extension for HTTP requests from cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Grant usage to supabase_read_only_user (used by pg_cron)
GRANT USAGE ON SCHEMA extensions TO supabase_read_only_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO supabase_read_only_user;