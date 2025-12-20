-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '24:00:00'::interval),
  is_active boolean NOT NULL DEFAULT true,
  last_activity timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.analytics_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  time_period text NOT NULL DEFAULT 'daily'::text,
  post_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_data_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audience_demographics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  age_group text NOT NULL,
  gender text NOT NULL,
  location text NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audience_demographics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.campaign_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer'::text CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text])),
  invited_by uuid NOT NULL,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  accepted_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'cancelled'::text])),
  CONSTRAINT campaign_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_invitations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.campaign_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer'::text CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text])),
  invited_by uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT campaign_members_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_members_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id),
  CONSTRAINT campaign_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'draft'::text, 'completed'::text, 'archived'::text])),
  CONSTRAINT campaigns_pkey PRIMARY KEY (id)
);
CREATE TABLE public.competitor_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  competitor_name text NOT NULL,
  competitor_handle text NOT NULL,
  platform text NOT NULL,
  followers_count integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  posts_per_week integer DEFAULT 0,
  avg_likes numeric DEFAULT 0,
  avg_comments numeric DEFAULT 0,
  last_analyzed timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT competitor_analysis_pkey PRIMARY KEY (id)
);
CREATE TABLE public.content_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  total_posts_generated integer NOT NULL DEFAULT 0,
  posts_by_tier jsonb NOT NULL DEFAULT '{}'::jsonb,
  success_rate numeric NOT NULL DEFAULT 0,
  popular_industries ARRAY NOT NULL DEFAULT '{}'::text[],
  api_calls_count integer NOT NULL DEFAULT 0,
  api_cost numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.content_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL,
  platform text NOT NULL,
  total_posts integer DEFAULT 0,
  avg_engagement_rate numeric DEFAULT 0,
  avg_reach integer DEFAULT 0,
  avg_impressions integer DEFAULT 0,
  best_performing_time time without time zone,
  best_performing_day text,
  date_analyzed date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_insights_pkey PRIMARY KEY (id)
);
CREATE TABLE public.income_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  total_revenue numeric NOT NULL DEFAULT 0,
  subscription_revenue numeric NOT NULL DEFAULT 0,
  net_revenue numeric NOT NULL DEFAULT 0,
  transaction_count integer NOT NULL DEFAULT 0,
  monthly_recurring_revenue numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT income_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.monthly_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_year date NOT NULL,
  posts_created integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_usage_pkey PRIMARY KEY (id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  industry text NOT NULL,
  goal text NOT NULL,
  niche_info text,
  generated_caption text NOT NULL,
  generated_hashtags ARRAY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  scheduled_date date,
  scheduled_time time without time zone,
  media_url text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'ready'::text, 'scheduled'::text, 'published'::text, 'failed'::text, 'rescheduled'::text])),
  posted_at timestamp with time zone,
  uploaded_image_url text,
  ai_generated_image_1_url text,
  ai_generated_image_2_url text,
  selected_image_type text DEFAULT 'none'::text CHECK (selected_image_type = ANY (ARRAY['none'::text, 'uploaded'::text, 'ai_generated_1'::text, 'ai_generated_2'::text])),
  ai_generations_count integer DEFAULT 0 CHECK (ai_generations_count >= 0 AND ai_generations_count <= 2),
  ai_image_prompts jsonb DEFAULT '[]'::jsonb,
  user_timezone text DEFAULT 'UTC'::text,
  social_platforms jsonb DEFAULT '[]'::jsonb,
  error_message text,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  timezone text DEFAULT 'UTC'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  subscription_tier text NOT NULL CHECK (subscription_tier = ANY (ARRAY['Starter'::text, 'Pro'::text])),
  expires_at timestamp with time zone NOT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  redeemed_by_user_id uuid,
  redeemed_by_email text,
  redeemed_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT promo_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.social_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  platform_user_id text NOT NULL,
  username text,
  token_expires_at timestamp with time zone,
  account_data jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT social_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.social_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  social_account_id uuid NOT NULL,
  platform text NOT NULL,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  avg_likes numeric DEFAULT 0,
  avg_comments numeric DEFAULT 0,
  scheduled_posts_count integer DEFAULT 0,
  metrics_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT social_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT social_metrics_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id)
);
CREATE TABLE public.social_tokens_vault (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  social_account_id uuid NOT NULL UNIQUE,
  encrypted_access_token text,
  encrypted_refresh_token text,
  token_expires_at timestamp with time zone,
  encryption_key_id text NOT NULL DEFAULT 'default'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_tokens_vault_pkey PRIMARY KEY (id),
  CONSTRAINT social_tokens_vault_social_account_id_fkey FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id)
);
CREATE TABLE public.subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL UNIQUE,
  stripe_customer_id text,
  subscribed boolean NOT NULL DEFAULT false,
  subscription_tier text NOT NULL DEFAULT 'Free'::text,
  subscription_end timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT subscribers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscription_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  subscription_tier text NOT NULL,
  new_subscriptions integer NOT NULL DEFAULT 0,
  active_subscriptions integer NOT NULL DEFAULT 0,
  revenue_generated numeric NOT NULL DEFAULT 0,
  upgrade_count integer NOT NULL DEFAULT 0,
  downgrade_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscription_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_activity_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  total_active_users integer NOT NULL DEFAULT 0,
  new_users integer NOT NULL DEFAULT 0,
  returning_users integer NOT NULL DEFAULT 0,
  total_sessions integer NOT NULL DEFAULT 0,
  page_views integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_activity_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'developer'::text, 'viewer'::text])),
  assigned_by uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id)
);