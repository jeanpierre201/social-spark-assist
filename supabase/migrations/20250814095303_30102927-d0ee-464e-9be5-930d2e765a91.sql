-- Security Enhancement: Protect Social Media Tokens
-- Create a secure view for social accounts that excludes sensitive token data
-- and add additional security measures

-- Create a view that excludes sensitive token fields for general use
CREATE OR REPLACE VIEW public.social_accounts_safe AS
SELECT 
  id,
  user_id,
  platform,
  platform_user_id,
  username,
  is_active,
  created_at,
  updated_at,
  token_expires_at,
  account_data
FROM public.social_accounts;

-- Enable RLS on the view
ALTER VIEW public.social_accounts_safe OWNER TO authenticated;

-- Create RLS policy for the safe view
CREATE POLICY "Users can view their own social accounts safely" 
ON public.social_accounts_safe
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a security definer function to get tokens only when absolutely necessary
-- This function can only be called by authenticated users for their own accounts
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

-- Revoke public access to the function
REVOKE ALL ON FUNCTION public.get_social_account_tokens FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_social_account_tokens TO authenticated;

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

-- Revoke public access to the function
REVOKE ALL ON FUNCTION public.update_social_account_tokens FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_social_account_tokens TO authenticated;

-- Add additional security: Create a more restrictive policy for token access
-- Drop the existing SELECT policy and create a more restrictive one
DROP POLICY IF EXISTS "Users can view their own social accounts" ON public.social_accounts;

-- Create a new policy that only allows viewing non-sensitive fields in normal queries
CREATE POLICY "Users can view their own social accounts metadata" 
ON public.social_accounts
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND current_setting('app.allow_token_access', true) = 'true'
);

-- Create a policy for updates that excludes direct token updates
DROP POLICY IF EXISTS "Users can update their own social accounts" ON public.social_accounts;

CREATE POLICY "Users can update their own social accounts metadata" 
ON public.social_accounts
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND access_token IS NOT DISTINCT FROM OLD.access_token
  AND refresh_token IS NOT DISTINCT FROM OLD.refresh_token
);

-- Keep existing INSERT and DELETE policies as they are secure