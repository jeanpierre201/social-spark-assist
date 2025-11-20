-- First, update any null subscription_tiers to 'Free'
UPDATE public.subscribers 
SET subscription_tier = 'Free' 
WHERE subscription_tier IS NULL;

-- Now add constraints to ensure subscription_tier is never null
ALTER TABLE public.subscribers 
ALTER COLUMN subscription_tier SET DEFAULT 'Free',
ALTER COLUMN subscription_tier SET NOT NULL;

-- Create a function to check if a user has active access
CREATE OR REPLACE FUNCTION public.user_has_active_access(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT subscription_tier, subscribed, subscription_end
  INTO sub_record
  FROM public.subscribers
  WHERE user_id = user_uuid OR email = (SELECT email FROM auth.users WHERE id = user_uuid)
  ORDER BY updated_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Free users always have access
  IF sub_record.subscription_tier = 'Free' THEN
    RETURN true;
  END IF;
  
  -- Starter/Pro users need active paid subscription
  IF sub_record.subscription_tier IN ('Starter', 'Pro') THEN
    RETURN sub_record.subscribed = true AND 
           (sub_record.subscription_end IS NULL OR sub_record.subscription_end > NOW());
  END IF;
  
  RETURN false;
END;
$$;

-- Create a function to check if user can create content (30-day window for Pro/Starter)
CREATE OR REPLACE FUNCTION public.user_can_create_content(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
  days_since_start integer;
BEGIN
  SELECT subscription_tier, subscribed, subscription_end, created_at
  INTO sub_record
  FROM public.subscribers
  WHERE user_id = user_uuid OR email = (SELECT email FROM auth.users WHERE id = user_uuid)
  ORDER BY updated_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Free users can always create content
  IF sub_record.subscription_tier = 'Free' THEN
    RETURN true;
  END IF;
  
  -- Starter/Pro: must be within 30 days of subscription start AND actively subscribed
  IF sub_record.subscription_tier IN ('Starter', 'Pro') THEN
    days_since_start := EXTRACT(DAY FROM (NOW() - sub_record.created_at));
    RETURN sub_record.subscribed = true AND days_since_start <= 30;
  END IF;
  
  RETURN false;
END;
$$;

COMMENT ON COLUMN public.subscribers.subscription_tier IS 'User tier: Free (default), Starter, or Pro. Never null.';
COMMENT ON COLUMN public.subscribers.subscribed IS 'Payment status: always true for Free, true for active Starter/Pro subscriptions.';
COMMENT ON COLUMN public.subscribers.subscription_end IS 'Subscription end date for Starter/Pro. NULL for Free users.';