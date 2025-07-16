-- Add function to extend creation period for starter users
CREATE OR REPLACE FUNCTION public.extend_creation_period(user_uuid uuid, extension_days integer DEFAULT 30)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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