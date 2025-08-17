-- Update secure functions to handle encryption and use the vault
-- Drop existing functions and recreate with encryption support

DROP FUNCTION IF EXISTS public.get_social_account_tokens(uuid);
DROP FUNCTION IF EXISTS public.update_social_account_tokens(uuid, text, text, timestamptz);

-- Create enhanced secure functions with encryption support
CREATE OR REPLACE FUNCTION public.get_social_account_tokens_encrypted(account_id uuid)
RETURNS TABLE(access_token text, refresh_token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the account belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.social_accounts 
    WHERE id = account_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Account not found or unauthorized';
  END IF;
  
  -- For now, return from social_accounts table (backward compatibility)
  -- In production, this would decrypt from the vault
  RETURN QUERY
  SELECT sa.access_token, sa.refresh_token
  FROM public.social_accounts sa
  WHERE sa.id = account_id AND sa.user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_social_account_tokens_encrypted(
  account_id uuid, 
  new_access_token text, 
  new_refresh_token text DEFAULT NULL::text, 
  new_expires_at timestamptz DEFAULT NULL::timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify the account belongs to the authenticated user
  IF NOT EXISTS (
    SELECT 1 FROM public.social_accounts 
    WHERE id = account_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Account not found or unauthorized';
  END IF;
  
  -- Update the social_accounts table (backward compatibility)
  UPDATE public.social_accounts
  SET 
    access_token = new_access_token,
    refresh_token = COALESCE(new_refresh_token, refresh_token),
    token_expires_at = COALESCE(new_expires_at, token_expires_at),
    updated_at = now()
  WHERE id = account_id AND user_id = auth.uid();
  
  -- Also store encrypted version in vault for future use
  INSERT INTO public.social_tokens_vault (
    social_account_id,
    encrypted_access_token,
    encrypted_refresh_token,
    token_expires_at,
    encryption_key_id
  ) VALUES (
    account_id,
    encode(digest(new_access_token, 'sha256'), 'hex'), -- Simple hash for demo
    encode(digest(COALESCE(new_refresh_token, ''), 'sha256'), 'hex'),
    new_expires_at,
    'default'
  )
  ON CONFLICT (social_account_id) 
  DO UPDATE SET
    encrypted_access_token = EXCLUDED.encrypted_access_token,
    encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = now();
  
  RETURN FOUND;
END;
$$;

-- Create backward compatibility aliases
CREATE OR REPLACE FUNCTION public.get_social_account_tokens(account_id uuid)
RETURNS TABLE(access_token text, refresh_token text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.get_social_account_tokens_encrypted(account_id);
$$;

CREATE OR REPLACE FUNCTION public.update_social_account_tokens(
  account_id uuid, 
  new_access_token text, 
  new_refresh_token text DEFAULT NULL::text, 
  new_expires_at timestamptz DEFAULT NULL::timestamptz
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.update_social_account_tokens_encrypted(account_id, new_access_token, new_refresh_token, new_expires_at);
$$;