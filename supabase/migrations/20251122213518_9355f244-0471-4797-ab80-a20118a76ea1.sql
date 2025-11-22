-- Add 'rescheduled' status to posts
ALTER TABLE posts 
  DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE posts 
  ADD CONSTRAINT posts_status_check 
  CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'rescheduled'));

-- Add index for faster scheduled post queries
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_lookup 
  ON posts (status, scheduled_date, scheduled_time) 
  WHERE status IN ('scheduled', 'rescheduled');