-- Enable real-time for posts table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Note: The table should already be part of supabase_realtime publication
-- This ensures real-time updates work for post status changes