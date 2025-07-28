-- Update the check constraint on posts.selected_image_type to support more granular AI image tracking
-- First, let's see what constraint exists currently and drop it
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_selected_image_type_check' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE public.posts DROP CONSTRAINT posts_selected_image_type_check;
    END IF;
END $$;

-- Add new constraint with expanded values for better analytics
ALTER TABLE public.posts 
ADD CONSTRAINT posts_selected_image_type_check 
CHECK (selected_image_type IN ('none', 'uploaded', 'ai_generated_1', 'ai_generated_2'));

-- Update any existing 'ai_generated' values to 'ai_generated_1' for consistency
-- (since we can't determine which one was actually selected from existing data)
UPDATE public.posts 
SET selected_image_type = 'ai_generated_1' 
WHERE selected_image_type = 'ai_generated';