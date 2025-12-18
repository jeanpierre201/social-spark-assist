-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('Starter', 'Pro')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  redeemed_by_user_id UUID NULL,
  redeemed_by_email TEXT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admins can view all promo codes
CREATE POLICY "Admins can view all promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Admins can create promo codes
CREATE POLICY "Admins can create promo codes" 
ON public.promo_codes 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') AND created_by = auth.uid());

-- Admins can update promo codes
CREATE POLICY "Admins can update promo codes" 
ON public.promo_codes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete promo codes
CREATE POLICY "Admins can delete promo codes" 
ON public.promo_codes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Create function to generate random promo code
CREATE OR REPLACE FUNCTION public.generate_promo_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create function to redeem promo code (with transaction safety)
CREATE OR REPLACE FUNCTION public.redeem_promo_code(
  promo_code_input TEXT,
  user_uuid UUID,
  user_email_input TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Mark promo code as used
  UPDATE public.promo_codes
  SET 
    used_count = used_count + 1,
    redeemed_by_user_id = user_uuid,
    redeemed_by_email = user_email_input,
    redeemed_at = NOW(),
    updated_at = NOW()
  WHERE id = promo_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'tier', promo_record.subscription_tier,
    'subscription_end', new_subscription_end
  );
END;
$$;

-- Create index for fast code lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes (code);
CREATE INDEX idx_promo_codes_expires_at ON public.promo_codes (expires_at);
CREATE INDEX idx_promo_codes_is_active ON public.promo_codes (is_active);