-- Add platform_results JSONB column to track per-platform publish status
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS platform_results jsonb DEFAULT '{}'::jsonb;

-- Update status constraint to include 'partially_published'
-- First drop the existing constraint if it exists
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_status_check;

-- Add the updated constraint with partially_published
ALTER TABLE public.posts ADD CONSTRAINT posts_status_check 
CHECK (status IN ('draft', 'ready', 'scheduled', 'published', 'failed', 'rescheduled', 'archived', 'partially_published'));

-- Add a comment to document the platform_results structure
COMMENT ON COLUMN public.posts.platform_results IS 'JSON object tracking per-platform publish status. Structure: { "platform_name": { "status": "success|failed|pending", "published_at": "ISO date", "post_id": "platform post id", "error": "error message", "attempted_at": "ISO date" } }';