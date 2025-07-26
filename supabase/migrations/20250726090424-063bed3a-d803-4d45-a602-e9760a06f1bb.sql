-- Add columns to support multiple images and AI generation tracking
ALTER TABLE public.posts 
ADD COLUMN uploaded_image_url TEXT,
ADD COLUMN ai_generated_image_1_url TEXT,
ADD COLUMN ai_generated_image_2_url TEXT,
ADD COLUMN selected_image_type TEXT DEFAULT 'none' CHECK (selected_image_type IN ('none', 'uploaded', 'ai_1', 'ai_2')),
ADD COLUMN ai_generations_count INTEGER DEFAULT 0 CHECK (ai_generations_count >= 0 AND ai_generations_count <= 2),
ADD COLUMN ai_image_prompts JSONB DEFAULT '[]'::jsonb;

-- Update existing posts to maintain compatibility
UPDATE public.posts 
SET selected_image_type = CASE 
  WHEN media_url IS NOT NULL THEN 'uploaded'
  ELSE 'none'
END,
uploaded_image_url = CASE 
  WHEN media_url IS NOT NULL THEN media_url
  ELSE NULL
END;

-- Create index for better performance
CREATE INDEX idx_posts_selected_image_type ON public.posts(selected_image_type);
CREATE INDEX idx_posts_ai_generations_count ON public.posts(ai_generations_count);