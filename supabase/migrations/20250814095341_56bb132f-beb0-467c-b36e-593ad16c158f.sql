-- Security Enhancement: Protect Social Media Tokens
-- Create secure functions to handle token access and updates

-- Create a security definer function to get tokens only when absolutely necessary
CREATE OR REPLACE FUNCTION public.get_social_account_tokens(account_id uuid)
RETURNS TABLE(access_token text, refresh_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the account belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.social_accounts 
    WHERE id = account_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Account not found or unauthorized';
  END IF;
  
  -- Return the tokens only if ownership is verified
  RETURN QUERY
  SELECT sa.access_token, sa.refresh_token
  FROM public.social_accounts sa
  WHERE sa.id = account_id AND sa.user_id = auth.uid();
END;
$$;

-- Create a function to update tokens securely
CREATE OR REPLACE FUNCTION public.update_social_account_tokens(
  account_id uuid,
  new_access_token text,
  new_refresh_token text DEFAULT NULL,
  new_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the account belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.social_accounts 
    WHERE id = account_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Account not found or unauthorized';
  END IF;
  
  -- Update the tokens
  UPDATE public.social_accounts
  SET 
    access_token = new_access_token,
    refresh_token = COALESCE(new_refresh_token, refresh_token),
    token_expires_at = COALESCE(new_expires_at, token_expires_at),
    updated_at = now()
  WHERE id = account_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Add a trigger to log token access attempts for audit purposes
CREATE OR REPLACE FUNCTION public.log_token_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if tokens are being accessed
  IF TG_OP = 'SELECT' AND (NEW.access_token IS NOT NULL OR NEW.refresh_token IS NOT NULL) THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, timestamp)
    VALUES (auth.uid(), 'token_access', 'social_accounts', NEW.id, now())
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;