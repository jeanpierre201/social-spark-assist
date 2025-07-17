-- Add status field to posts table for better post management
ALTER TABLE public.posts ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived'));

-- Add index for better query performance
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_user_status ON public.posts(user_id, status);

-- Add posted_at timestamp for tracking when posts were published
ALTER TABLE public.posts ADD COLUMN posted_at TIMESTAMP WITH TIME ZONE;

-- Update existing posts to have draft status
UPDATE public.posts SET status = 'draft' WHERE status IS NULL;