-- Final security fixes to address remaining critical data exposure issues

-- 1. Remove plaintext tokens from social_accounts table
ALTER TABLE public.social_accounts DROP COLUMN IF EXISTS access_token;
ALTER TABLE public.social_accounts DROP COLUMN IF EXISTS refresh_token;

-- 2. Update campaign_invitations RLS to restrict email access to owners/admins only
DROP POLICY IF EXISTS "campaign_inv_select_owner_or_member" ON public.campaign_invitations;
CREATE POLICY "campaign_inv_select_owner_or_admin" 
ON public.campaign_invitations 
FOR SELECT 
USING (is_campaign_owner(campaign_id) OR is_campaign_admin(campaign_id));

-- 3. Update subscribers RLS to be more restrictive
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT 
USING (
  (user_id = auth.uid()) OR 
  (user_id IS NULL AND email = auth.email()) OR
  -- Only allow admin access to all records
  public.has_role(auth.uid(), 'admin')
);

-- 4. Add additional security to admin_sessions table
DROP POLICY IF EXISTS "Users can view their own admin sessions" ON public.admin_sessions;
CREATE POLICY "Users can view their own admin sessions" ON public.admin_sessions
FOR SELECT 
USING (
  (auth.uid() = user_id) AND 
  public.has_role(auth.uid(), 'admin') AND
  is_active = true AND
  expires_at > now()
);

-- 5. Create audit trigger for sensitive table access
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, timestamp)
  VALUES (
    auth.uid(), 
    TG_OP, 
    TG_TABLE_NAME, 
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    now()
  )
  ON CONFLICT DO NOTHING;
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Create audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs (admin only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for auditing sensitive operations
DROP TRIGGER IF EXISTS audit_admin_sessions ON public.admin_sessions;
CREATE TRIGGER audit_admin_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

DROP TRIGGER IF EXISTS audit_user_roles ON public.user_roles;  
CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_access();

-- 6. Hash admin session tokens (if they contain plaintext)
-- Note: This will invalidate existing sessions for security
UPDATE public.admin_sessions 
SET session_token = encode(digest(session_token, 'sha256'), 'hex')
WHERE length(session_token) != 64; -- Only hash if not already hashed