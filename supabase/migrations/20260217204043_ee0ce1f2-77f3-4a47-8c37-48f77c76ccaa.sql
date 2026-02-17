
CREATE OR REPLACE FUNCTION public.extend_creation_period(user_uuid uuid, extension_days integer DEFAULT 30)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_subscriber_record RECORD;
BEGIN
  -- Get current subscriber record - must be subscribed, paid tier, AND have active payment
  SELECT * INTO current_subscriber_record
  FROM public.subscribers
  WHERE user_id = user_uuid 
    AND subscribed = true 
    AND subscription_tier IN ('Starter', 'Pro')
    AND subscription_end IS NOT NULL
    AND subscription_end > NOW();
    
  -- Check if subscriber exists and is eligible (active payment)
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update the subscriber record with new creation start date
  UPDATE public.subscribers
  SET 
    created_at = CURRENT_DATE::timestamp with time zone,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  RETURN true;
END;
$function$;
