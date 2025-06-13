
-- Create table for social media account connections
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- 'instagram', 'twitter', 'facebook', 'linkedin'
  platform_user_id TEXT NOT NULL,
  username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_data JSONB, -- Store additional account info
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Create table for social media metrics
CREATE TABLE public.social_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0, -- Percentage with 2 decimal places
  avg_likes DECIMAL(10,2) DEFAULT 0,
  avg_comments DECIMAL(10,2) DEFAULT 0,
  scheduled_posts_count INTEGER DEFAULT 0,
  metrics_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(social_account_id, metrics_date)
);

-- Enable RLS on both tables
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for social_accounts
CREATE POLICY "Users can view their own social accounts" 
  ON public.social_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social accounts" 
  ON public.social_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts" 
  ON public.social_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts" 
  ON public.social_accounts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for social_metrics
CREATE POLICY "Users can view their own social metrics" 
  ON public.social_metrics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social metrics" 
  ON public.social_metrics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social metrics" 
  ON public.social_metrics 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social metrics" 
  ON public.social_metrics 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to get latest metrics for a user
CREATE OR REPLACE FUNCTION public.get_user_latest_metrics(user_uuid uuid)
RETURNS TABLE (
  platform text,
  followers_count integer,
  engagement_rate decimal,
  posts_count integer,
  scheduled_posts_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sm.platform)
    sm.platform,
    sm.followers_count,
    sm.engagement_rate,
    sm.posts_count,
    sm.scheduled_posts_count
  FROM public.social_metrics sm
  WHERE sm.user_id = user_uuid
  ORDER BY sm.platform, sm.metrics_date DESC;
END;
$function$;
