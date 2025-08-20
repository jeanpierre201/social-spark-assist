-- Fix remaining SECURITY DEFINER functions by adding SET search_path

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

-- Fix get_monthly_post_count function
CREATE OR REPLACE FUNCTION public.get_monthly_post_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.posts
    WHERE user_id = user_uuid
    AND created_at >= DATE_TRUNC('month', NOW())
  );
END;
$$;

-- Fix user_can_access_campaign function
CREATE OR REPLACE FUNCTION public.user_can_access_campaign(campaign_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_uuid AND created_by = auth.uid()
  );
END;
$$;

-- Fix get_posts_count_in_period function
CREATE OR REPLACE FUNCTION public.get_posts_count_in_period(user_uuid uuid, start_date timestamp with time zone, end_date timestamp with time zone)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.posts
    WHERE user_id = user_uuid
    AND created_at >= start_date
    AND created_at <= end_date
  );
END;
$$;

-- Fix get_user_latest_metrics function
CREATE OR REPLACE FUNCTION public.get_user_latest_metrics(user_uuid uuid)
RETURNS TABLE(platform text, followers_count integer, engagement_rate numeric, posts_count integer, scheduled_posts_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Fix get_monthly_post_count_with_limit function
CREATE OR REPLACE FUNCTION public.get_monthly_post_count_with_limit(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_count integer;
  user_tier text;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.subscribers
  WHERE user_id = user_uuid OR email IN (
    SELECT email FROM auth.users WHERE id = user_uuid
  )
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Get current month post count
  SELECT COUNT(*) INTO post_count
  FROM public.posts
  WHERE user_id = user_uuid
  AND created_at >= DATE_TRUNC('month', NOW());

  RETURN post_count;
END;
$$;

-- Fix increment_monthly_usage function
CREATE OR REPLACE FUNCTION public.increment_monthly_usage(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month DATE;
  current_count INTEGER;
BEGIN
  -- Get the first day of current month
  current_month := date_trunc('month', now())::DATE;
  
  -- Insert or update monthly usage
  INSERT INTO public.monthly_usage (user_id, month_year, posts_created)
  VALUES (user_uuid, current_month, 1)
  ON CONFLICT (user_id, month_year) 
  DO UPDATE SET 
    posts_created = monthly_usage.posts_created + 1,
    updated_at = now();
  
  -- Return the updated count
  SELECT posts_created INTO current_count
  FROM public.monthly_usage
  WHERE user_id = user_uuid AND month_year = current_month;
  
  RETURN current_count;
END;
$$;

-- Fix get_monthly_usage_count function
CREATE OR REPLACE FUNCTION public.get_monthly_usage_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month DATE;
  usage_count INTEGER;
BEGIN
  -- Get the first day of current month
  current_month := date_trunc('month', now())::DATE;
  
  -- Get current month's usage count
  SELECT posts_created INTO usage_count
  FROM public.monthly_usage
  WHERE user_id = user_uuid AND month_year = current_month;
  
  -- Return 0 if no record found
  RETURN COALESCE(usage_count, 0);
END;
$$;

-- Fix extend_creation_period function
CREATE OR REPLACE FUNCTION public.extend_creation_period(user_uuid uuid, extension_days integer DEFAULT 30)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_subscriber_record RECORD;
  new_start_date DATE;
BEGIN
  -- Get current subscriber record
  SELECT * INTO current_subscriber_record
  FROM public.subscribers
  WHERE user_id = user_uuid 
    AND subscribed = true 
    AND subscription_tier IN ('Starter', 'Pro');
    
  -- Check if subscriber exists and is eligible
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Calculate new start date (current date for extension)
  new_start_date := CURRENT_DATE;
  
  -- Update the subscriber record with new creation start date
  UPDATE public.subscribers
  SET 
    created_at = new_start_date::timestamp with time zone,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN true;
END;
$$;

-- Fix get_previous_period_posts_count function
CREATE OR REPLACE FUNCTION public.get_previous_period_posts_count(user_uuid uuid, subscription_start timestamp with time zone)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  previous_period_start timestamp with time zone;
  previous_period_end timestamp with time zone;
BEGIN
  -- Calculate previous 30-day period (30 days before subscription start)
  previous_period_start := subscription_start - INTERVAL '30 days';
  previous_period_end := subscription_start;
  
  RETURN (
    SELECT COUNT(*)
    FROM public.posts
    WHERE user_id = user_uuid
    AND created_at >= previous_period_start
    AND created_at < previous_period_end
  );
END;
$$;

-- Fix get_current_period_posts_count function
CREATE OR REPLACE FUNCTION public.get_current_period_posts_count(user_uuid uuid, subscription_start timestamp with time zone)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  period_end timestamp with time zone;
BEGIN
  -- Calculate current 30-day period end
  period_end := subscription_start + INTERVAL '30 days';
  
  RETURN (
    SELECT COUNT(*)
    FROM public.posts
    WHERE user_id = user_uuid
    AND created_at >= subscription_start
    AND created_at <= period_end
  );
END;
$$;