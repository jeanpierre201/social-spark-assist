
-- Clean up subscribers table and reset subscription data
DELETE FROM public.subscribers WHERE subscribed = false OR subscription_tier IS NULL;

-- Update remaining subscribers to have clean, consistent data
UPDATE public.subscribers 
SET 
  updated_at = NOW(),
  subscription_end = CASE 
    WHEN subscription_tier = 'Starter' THEN NOW() + INTERVAL '30 days'
    WHEN subscription_tier = 'Pro' THEN NOW() + INTERVAL '30 days'
    ELSE NOW() + INTERVAL '30 days'
  END
WHERE subscribed = true;

-- Ensure we only have valid subscription tiers
UPDATE public.subscribers 
SET subscription_tier = 'Starter' 
WHERE subscription_tier NOT IN ('Starter', 'Pro') AND subscribed = true;
