
-- Upgrade existing Starter user to Pro Plan
UPDATE public.subscribers 
SET 
  subscription_tier = 'Pro',
  subscription_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE subscription_tier = 'Starter' 
  AND subscribed = true;
