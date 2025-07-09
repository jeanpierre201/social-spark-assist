-- Create subscription analytics table
CREATE TABLE public.subscription_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  subscription_tier TEXT NOT NULL,
  new_subscriptions INTEGER NOT NULL DEFAULT 0,
  active_subscriptions INTEGER NOT NULL DEFAULT 0,
  revenue_generated DECIMAL(10,2) NOT NULL DEFAULT 0,
  upgrade_count INTEGER NOT NULL DEFAULT 0,
  downgrade_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create income analytics table
CREATE TABLE public.income_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  subscription_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  monthly_recurring_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user activity analytics table
CREATE TABLE public.user_activity_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  total_active_users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  returning_users INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content analytics table
CREATE TABLE public.content_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
  total_posts_generated INTEGER NOT NULL DEFAULT 0,
  posts_by_tier JSONB NOT NULL DEFAULT '{}',
  success_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  popular_industries TEXT[] NOT NULL DEFAULT '{}',
  api_calls_count INTEGER NOT NULL DEFAULT 0,
  api_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all analytics tables
ALTER TABLE public.subscription_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view subscription analytics" ON public.subscription_analytics
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view income analytics" ON public.income_analytics
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view user activity analytics" ON public.user_activity_analytics
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view content analytics" ON public.content_analytics
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Insert sample data for the last 30 days
INSERT INTO public.subscription_analytics (date_recorded, subscription_tier, new_subscriptions, active_subscriptions, revenue_generated, upgrade_count, downgrade_count) VALUES
  ('2024-12-01', 'Pro', 15, 120, 2400.00, 8, 2),
  ('2024-12-01', 'Starter', 25, 200, 1000.00, 3, 1),
  ('2024-12-02', 'Pro', 12, 132, 2640.00, 5, 1),
  ('2024-12-02', 'Starter', 18, 218, 1090.00, 2, 0),
  ('2024-12-03', 'Pro', 20, 152, 3040.00, 10, 3),
  ('2024-12-03', 'Starter', 30, 248, 1240.00, 4, 2),
  ('2024-12-04', 'Pro', 18, 170, 3400.00, 7, 1),
  ('2024-12-04', 'Starter', 22, 270, 1350.00, 3, 1),
  ('2024-12-05', 'Pro', 16, 186, 3720.00, 9, 2),
  ('2024-12-05', 'Starter', 28, 298, 1490.00, 5, 0);

INSERT INTO public.income_analytics (date_recorded, total_revenue, subscription_revenue, net_revenue, transaction_count, monthly_recurring_revenue) VALUES
  ('2024-12-01', 3400.00, 3200.00, 3100.00, 40, 3200.00),
  ('2024-12-02', 3730.00, 3520.00, 3420.00, 42, 3520.00),
  ('2024-12-03', 4280.00, 4000.00, 3900.00, 50, 4000.00),
  ('2024-12-04', 4750.00, 4450.00, 4350.00, 48, 4450.00),
  ('2024-12-05', 5210.00, 4900.00, 4800.00, 52, 4900.00);

INSERT INTO public.user_activity_analytics (date_recorded, total_active_users, new_users, returning_users, total_sessions, page_views) VALUES
  ('2024-12-01', 450, 35, 415, 1200, 5400),
  ('2024-12-02', 485, 42, 443, 1350, 5850),
  ('2024-12-03', 520, 38, 482, 1480, 6200),
  ('2024-12-04', 545, 45, 500, 1520, 6500),
  ('2024-12-05', 580, 52, 528, 1680, 7100);

INSERT INTO public.content_analytics (date_recorded, total_posts_generated, posts_by_tier, success_rate, popular_industries, api_calls_count, api_cost) VALUES
  ('2024-12-01', 890, '{"Pro": 650, "Starter": 240}', 96.50, '["Technology", "Marketing", "Healthcare"]', 1200, 45.60),
  ('2024-12-02', 920, '{"Pro": 680, "Starter": 240}', 97.20, '["Technology", "Marketing", "E-commerce"]', 1250, 47.80),
  ('2024-12-03', 1050, '{"Pro": 780, "Starter": 270}', 95.80, '["Technology", "Finance", "Healthcare"]', 1400, 52.30),
  ('2024-12-04', 1120, '{"Pro": 820, "Starter": 300}', 96.90, '["Marketing", "Technology", "Education"]', 1480, 55.20),
  ('2024-12-05', 1180, '{"Pro": 870, "Starter": 310}', 97.40, '["Technology", "Marketing", "Real Estate"]', 1560, 58.70);

-- Create indexes for better performance
CREATE INDEX idx_subscription_analytics_date ON public.subscription_analytics(date_recorded);
CREATE INDEX idx_income_analytics_date ON public.income_analytics(date_recorded);
CREATE INDEX idx_user_activity_analytics_date ON public.user_activity_analytics(date_recorded);
CREATE INDEX idx_content_analytics_date ON public.content_analytics(date_recorded);