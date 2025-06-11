
-- Create posts table to track user's generated content
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  industry TEXT NOT NULL,
  goal TEXT NOT NULL,
  niche_info TEXT,
  generated_caption TEXT NOT NULL,
  generated_hashtags TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
CREATE POLICY "Users can view own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to check monthly post limit for free users
CREATE OR REPLACE FUNCTION public.get_monthly_post_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.posts
    WHERE user_id = user_uuid
    AND created_at >= DATE_TRUNC('month', NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for better performance
CREATE INDEX idx_posts_user_created ON public.posts(user_id, created_at);
