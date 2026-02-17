
-- =============================================
-- BRANDS TABLE
-- =============================================
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  voice_tone TEXT DEFAULT 'professional',
  color_primary TEXT,
  color_secondary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT brands_user_unique UNIQUE (user_id)
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand"
  ON public.brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own brand"
  ON public.brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand"
  ON public.brands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand"
  ON public.brands FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- CONTENT HISTORY TABLE
-- =============================================
CREATE TABLE public.content_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  input_industry TEXT,
  input_goal TEXT,
  input_niche_info TEXT,
  generated_caption TEXT,
  generated_hashtags TEXT[],
  media_url TEXT,
  was_published BOOLEAN DEFAULT false,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content history"
  ON public.content_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own content history"
  ON public.content_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content history"
  ON public.content_history FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- ADD brand_id AND campaign_id TO POSTS
-- =============================================
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- =============================================
-- TRIGGER FOR brands updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brands_updated_at();
