
-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'developer', 'viewer');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role 
    WHEN 'admin' THEN 1
    WHEN 'developer' THEN 2
    WHEN 'viewer' THEN 3
  END
  LIMIT 1
$$;

-- Subscription analytics table
CREATE TABLE public.subscription_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    subscription_tier TEXT NOT NULL,
    new_subscriptions INTEGER DEFAULT 0,
    cancelled_subscriptions INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    upgrade_count INTEGER DEFAULT 0,
    downgrade_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date_recorded, subscription_tier)
);

-- Income analytics table
CREATE TABLE public.income_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    subscription_revenue DECIMAL(10,2) DEFAULT 0,
    one_time_revenue DECIMAL(10,2) DEFAULT 0,
    refunds DECIMAL(10,2) DEFAULT 0,
    net_revenue DECIMAL(10,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    average_revenue_per_user DECIMAL(10,2) DEFAULT 0,
    monthly_recurring_revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date_recorded)
);

-- User activity tracking table
CREATE TABLE public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    activity_details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    INDEX (user_id, created_at),
    INDEX (activity_type, created_at)
);

-- Daily user activity summary
CREATE TABLE public.daily_user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    total_active_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    returning_users INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    average_session_duration INTERVAL,
    page_views INTEGER DEFAULT 0,
    unique_page_views INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date_recorded)
);

-- Content generation analytics
CREATE TABLE public.content_generation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
    total_posts_generated INTEGER DEFAULT 0,
    posts_by_tier JSONB DEFAULT '{}',
    average_generation_time DECIMAL(8,2) DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    popular_industries JSONB DEFAULT '[]',
    popular_goals JSONB DEFAULT '[]',
    api_calls_count INTEGER DEFAULT 0,
    api_cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(date_recorded)
);

-- Usage pattern analysis
CREATE TABLE public.usage_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_tier TEXT,
    posts_generated_monthly INTEGER DEFAULT 0,
    posts_scheduled_monthly INTEGER DEFAULT 0,
    most_active_hour INTEGER,
    most_active_day TEXT,
    preferred_industries JSONB DEFAULT '[]',
    preferred_goals JSONB DEFAULT '[]',
    feature_usage JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE,
    month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, month_year)
);

-- Performance metrics table
CREATE TABLE public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_recorded TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    metric_unit TEXT,
    category TEXT NOT NULL, -- 'system', 'api', 'database', 'user_experience'
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    INDEX (metric_name, date_recorded),
    INDEX (category, date_recorded)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analytics tables (Admin only)
CREATE POLICY "Only admins can view subscription analytics" ON public.subscription_analytics
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage subscription analytics" ON public.subscription_analytics
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view income analytics" ON public.income_analytics
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage income analytics" ON public.income_analytics
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all user activity" ON public.user_activity_logs
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own activity" ON public.user_activity_logs
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs" ON public.user_activity_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view daily activity" ON public.daily_user_activity
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage daily activity" ON public.daily_user_activity
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can view content analytics" ON public.content_generation_analytics
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage content analytics" ON public.content_generation_analytics
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own usage patterns" ON public.usage_patterns
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all usage patterns" ON public.usage_patterns
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage usage patterns" ON public.usage_patterns
FOR ALL USING (true);

CREATE POLICY "Only admins can view performance metrics" ON public.performance_metrics
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage performance metrics" ON public.performance_metrics
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Helper functions for analytics
CREATE OR REPLACE FUNCTION public.get_subscription_trends(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    date_recorded DATE,
    subscription_tier TEXT,
    new_subscriptions INTEGER,
    active_subscriptions INTEGER,
    revenue_generated DECIMAL(10,2)
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    sa.date_recorded,
    sa.subscription_tier,
    sa.new_subscriptions,
    sa.active_subscriptions,
    sa.revenue_generated
  FROM public.subscription_analytics sa
  WHERE sa.date_recorded >= CURRENT_DATE - INTERVAL '1 day' * days_back
  ORDER BY sa.date_recorded DESC, sa.subscription_tier;
$$;

CREATE OR REPLACE FUNCTION public.get_revenue_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    total_revenue DECIMAL(10,2),
    avg_daily_revenue DECIMAL(10,2),
    growth_rate DECIMAL(5,2)
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  WITH revenue_data AS (
    SELECT 
      SUM(total_revenue) as total_rev,
      AVG(total_revenue) as avg_daily_rev,
      COUNT(*) as days_count
    FROM public.income_analytics 
    WHERE date_recorded >= CURRENT_DATE - INTERVAL '1 day' * days_back
  )
  SELECT 
    total_rev,
    avg_daily_rev,
    CASE 
      WHEN days_count > 1 THEN 
        ((avg_daily_rev - LAG(avg_daily_rev) OVER()) / NULLIF(LAG(avg_daily_rev) OVER(), 0)) * 100
      ELSE 0 
    END as growth_rate
  FROM revenue_data;
$$;
