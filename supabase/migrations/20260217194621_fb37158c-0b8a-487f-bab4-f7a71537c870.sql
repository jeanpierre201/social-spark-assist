
-- Remove the redeemed_by_email column from promo_codes
ALTER TABLE public.promo_codes DROP COLUMN IF EXISTS redeemed_by_email;

-- Update the redeem_promo_code function to remove email storage
CREATE OR REPLACE FUNCTION public.redeem_promo_code(promo_code_input text, user_uuid uuid, user_email_input text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  promo_record RECORD;
  new_subscription_end TIMESTAMP WITH TIME ZONE;
  existing_subscriber RECORD;
BEGIN
  -- Lock and fetch the promo code
  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE code = UPPER(promo_code_input)
  AND is_active = true
  FOR UPDATE;

  -- Validate code exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid promo code');
  END IF;

  -- Validate not expired
  IF promo_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Promo code has expired');
  END IF;

  -- Validate not fully used
  IF promo_record.used_count >= promo_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Promo code has already been used');
  END IF;

  -- Calculate new subscription end (30 days from now)
  new_subscription_end := NOW() + INTERVAL '30 days';

  -- Check if user already has a subscription record
  SELECT * INTO existing_subscriber
  FROM public.subscribers
  WHERE user_id = user_uuid OR email = user_email_input
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Update existing subscription
    UPDATE public.subscribers
    SET 
      subscribed = true,
      subscription_tier = promo_record.subscription_tier,
      subscription_end = new_subscription_end,
      updated_at = NOW()
    WHERE id = existing_subscriber.id;
  ELSE
    -- Create new subscription record
    INSERT INTO public.subscribers (
      user_id,
      email,
      subscribed,
      subscription_tier,
      subscription_end
    ) VALUES (
      user_uuid,
      user_email_input,
      true,
      promo_record.subscription_tier,
      new_subscription_end
    );
  END IF;

  -- Mark promo code as used (no longer storing email)
  UPDATE public.promo_codes
  SET 
    used_count = used_count + 1,
    redeemed_by_user_id = user_uuid,
    redeemed_at = NOW(),
    updated_at = NOW()
  WHERE id = promo_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'tier', promo_record.subscription_tier,
    'subscription_end', new_subscription_end
  );
END;
$function$;
