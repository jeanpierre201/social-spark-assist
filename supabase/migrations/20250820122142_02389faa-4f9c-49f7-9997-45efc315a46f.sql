-- Fix SECURITY DEFINER functions by adding SET search_path to 'public'
-- This prevents search path injection attacks

-- Fix is_campaign_owner function
CREATE OR REPLACE FUNCTION public.is_campaign_owner(campaign_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = campaign_uuid
      AND c.created_by = auth.uid()
  );
$$;

-- Fix is_campaign_member function
CREATE OR REPLACE FUNCTION public.is_campaign_member(campaign_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_members m
    WHERE m.campaign_id = campaign_uuid
      AND m.user_id = auth.uid()
  );
$$;

-- Fix is_campaign_admin function
CREATE OR REPLACE FUNCTION public.is_campaign_admin(campaign_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.is_campaign_owner(campaign_uuid)
    OR EXISTS (
      SELECT 1
      FROM public.campaign_members m
      WHERE m.campaign_id = campaign_uuid
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    );
$$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  );
$$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
  ORDER BY 
    CASE role 
      WHEN 'developer' THEN 1
      WHEN 'admin' THEN 2 
      WHEN 'user' THEN 3
      WHEN 'viewer' THEN 4
    END
  LIMIT 1;
$$;

-- Remove the insecure social token functions that return plaintext
-- These will be replaced with secure server-side only handling
DROP FUNCTION IF EXISTS public.get_social_account_tokens_encrypted(uuid);
DROP FUNCTION IF EXISTS public.update_social_account_tokens_encrypted(uuid, text, text, timestamp with time zone);
DROP FUNCTION IF EXISTS public.get_social_account_tokens(uuid);
DROP FUNCTION IF EXISTS public.update_social_account_tokens(uuid, text, text, timestamp with time zone);

-- Create a secure admin-only function to manage user roles
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role text,
  assigner_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins or developers can assign roles
  IF NOT (public.has_role(assigner_user_id, 'admin') OR public.has_role(assigner_user_id, 'developer')) THEN
    RAISE EXCEPTION 'Access denied: Only admins or developers can assign roles';
  END IF;

  -- Deactivate existing roles for the user
  UPDATE public.user_roles 
  SET is_active = false, updated_at = now()
  WHERE user_id = target_user_id;

  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at, is_active)
  VALUES (target_user_id, new_role, assigner_user_id, now(), true)
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = true,
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = EXCLUDED.assigned_at;

  RETURN true;
END;
$$;