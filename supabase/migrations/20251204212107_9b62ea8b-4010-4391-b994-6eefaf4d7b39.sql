-- Drop the existing constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;

-- Recreate with the new 'ready' status included
ALTER TABLE posts ADD CONSTRAINT posts_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'ready'::text, 'scheduled'::text, 'published'::text, 'failed'::text, 'rescheduled'::text]));