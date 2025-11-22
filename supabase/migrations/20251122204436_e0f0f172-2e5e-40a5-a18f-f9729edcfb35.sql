-- Phase 2: Add timezone support to profiles and posts
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS user_timezone TEXT DEFAULT 'UTC';

-- Phase 3: Add social platform support and error tracking to posts
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS social_platforms JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add 'failed' to status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'posts_status_check'
  ) THEN
    ALTER TABLE posts ADD CONSTRAINT posts_status_check 
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived', 'failed'));
  END IF;
END $$;