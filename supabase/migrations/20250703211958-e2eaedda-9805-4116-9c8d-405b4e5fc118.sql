
-- Ensure jeanpierre201@hotmail.com has a proper Pro subscription
INSERT INTO public.subscribers (email, subscribed, subscription_tier, subscription_end, updated_at)
VALUES (
  'jeanpierre201@hotmail.com',
  true,
  'Pro',
  NOW() + INTERVAL '30 days',
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  subscribed = true,
  subscription_tier = 'Pro',
  subscription_end = NOW() + INTERVAL '30 days',
  updated_at = NOW();
