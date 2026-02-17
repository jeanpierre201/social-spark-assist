-- Fix existing promo code user whose created_at wasn't reset
UPDATE public.subscribers 
SET created_at = NOW() 
WHERE user_id = 'bb7ef1e6-bc65-4f46-9de8-630cca1f317b' 
AND subscribed = true;