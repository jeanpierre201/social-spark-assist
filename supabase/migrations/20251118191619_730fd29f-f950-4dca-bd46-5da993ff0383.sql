-- Create a function to clean up old posts for free users (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_free_user_old_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete posts older than 24 hours for users who don't have an active subscription
  DELETE FROM posts
  WHERE user_id IN (
    SELECT user_id 
    FROM subscribers 
    WHERE subscribed = false OR subscription_tier IS NULL
  )
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create a function to check if user is on free plan
CREATE OR REPLACE FUNCTION is_free_user(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_free boolean;
BEGIN
  SELECT COALESCE(NOT subscribed, true)
  INTO is_free
  FROM subscribers
  WHERE user_id = user_uuid OR email = (SELECT email FROM auth.users WHERE id = user_uuid);
  
  RETURN COALESCE(is_free, true);
END;
$$;