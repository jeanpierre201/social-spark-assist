
-- Create a table for storing detailed analytics data
CREATE TABLE public.analytics_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'engagement', 'reach', 'impressions', 'clicks', 'saves', 'shares'
  metric_value NUMERIC NOT NULL DEFAULT 0,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  time_period TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  post_id UUID NULL, -- reference to specific posts if applicable
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for competitor analysis data
CREATE TABLE public.competitor_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  competitor_handle TEXT NOT NULL,
  platform TEXT NOT NULL,
  followers_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  posts_per_week INTEGER DEFAULT 0,
  avg_likes NUMERIC DEFAULT 0,
  avg_comments NUMERIC DEFAULT 0,
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for content performance insights
CREATE TABLE public.content_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'video', 'image', 'carousel', 'story', 'text'
  platform TEXT NOT NULL,
  total_posts INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC DEFAULT 0,
  avg_reach INTEGER DEFAULT 0,
  avg_impressions INTEGER DEFAULT 0,
  best_performing_time TIME,
  best_performing_day TEXT,
  date_analyzed DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create a table for audience demographics
CREATE TABLE public.audience_demographics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  age_group TEXT NOT NULL, -- '18-24', '25-34', '35-44', '45-54', '55+'
  gender TEXT NOT NULL, -- 'male', 'female', 'other'
  location TEXT NOT NULL,
  percentage NUMERIC NOT NULL DEFAULT 0,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to all analytics tables
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_demographics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics_data
CREATE POLICY "Users can view their own analytics data" 
  ON public.analytics_data 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics data" 
  ON public.analytics_data 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics data" 
  ON public.analytics_data 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analytics data" 
  ON public.analytics_data 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for competitor_analysis
CREATE POLICY "Users can view their own competitor analysis" 
  ON public.competitor_analysis 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitor analysis" 
  ON public.competitor_analysis 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor analysis" 
  ON public.competitor_analysis 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor analysis" 
  ON public.competitor_analysis 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for content_insights
CREATE POLICY "Users can view their own content insights" 
  ON public.content_insights 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content insights" 
  ON public.content_insights 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content insights" 
  ON public.content_insights 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content insights" 
  ON public.content_insights 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for audience_demographics
CREATE POLICY "Users can view their own audience demographics" 
  ON public.audience_demographics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audience demographics" 
  ON public.audience_demographics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audience demographics" 
  ON public.audience_demographics 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audience demographics" 
  ON public.audience_demographics 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_analytics_data_user_platform_date ON public.analytics_data(user_id, platform, date_recorded);
CREATE INDEX idx_competitor_analysis_user_platform ON public.competitor_analysis(user_id, platform);
CREATE INDEX idx_content_insights_user_platform_date ON public.content_insights(user_id, platform, date_analyzed);
CREATE INDEX idx_audience_demographics_user_platform_date ON public.audience_demographics(user_id, platform, date_recorded);
