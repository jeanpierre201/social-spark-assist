
-- 1) Helper functions to avoid policy recursion
-- Ensures queries inside run with SECURITY DEFINER and don't trigger RLS/policy recursion

CREATE OR REPLACE FUNCTION public.is_campaign_owner(campaign_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = campaign_uuid
      AND c.created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_campaign_member(campaign_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_members m
    WHERE m.campaign_id = campaign_uuid
      AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_campaign_admin(campaign_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  -- Owner is implicitly an admin; otherwise check explicit admin role
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

-- 2) Replace campaigns policies (remove recursive references)

DROP POLICY IF EXISTS "Campaign creators can delete their campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Campaign creators can update their campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view campaigns they created or are members of" ON public.campaigns;

-- Keep INSERT as before (no recursion)
CREATE POLICY "campaigns_insert_owner"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Owner can UPDATE/DELETE
CREATE POLICY "campaigns_update_owner"
  ON public.campaigns
  FOR UPDATE
  USING (public.is_campaign_owner(id));

CREATE POLICY "campaigns_delete_owner"
  ON public.campaigns
  FOR DELETE
  USING (public.is_campaign_owner(id));

-- View if owner or member
CREATE POLICY "campaigns_select_owner_or_member"
  ON public.campaigns
  FOR SELECT
  USING ((created_by = auth.uid()) OR public.is_campaign_member(id));

-- 3) Replace campaign_members policies (remove recursive references)

DROP POLICY IF EXISTS "Campaign owners can add members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign owners can remove members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign owners can update member roles" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can view campaign members for their campaigns" ON public.campaign_members;

-- Owner can add members
CREATE POLICY "campaign_members_insert_owner"
  ON public.campaign_members
  FOR INSERT
  WITH CHECK (public.is_campaign_owner(campaign_id));

-- Owner can update member roles
CREATE POLICY "campaign_members_update_owner"
  ON public.campaign_members
  FOR UPDATE
  USING (public.is_campaign_owner(campaign_id));

-- Owner can remove members
CREATE POLICY "campaign_members_delete_owner"
  ON public.campaign_members
  FOR DELETE
  USING (public.is_campaign_owner(campaign_id));

-- View: owner or the member themself
CREATE POLICY "campaign_members_select_owner_or_self"
  ON public.campaign_members
  FOR SELECT
  USING (public.is_campaign_owner(campaign_id) OR user_id = auth.uid());

-- 4) Replace campaign_invitations policies (remove recursive references)

DROP POLICY IF EXISTS "Campaign admins can create invitations" ON public.campaign_invitations;
DROP POLICY IF EXISTS "Campaign admins can delete invitations" ON public.campaign_invitations;
DROP POLICY IF EXISTS "Campaign admins can update invitations" ON public.campaign_invitations;
DROP POLICY IF EXISTS "Users can view invitations for campaigns they have access to" ON public.campaign_invitations;

-- Create invitations: inviter must be current user AND is owner or admin
CREATE POLICY "campaign_inv_insert_owner_or_admin"
  ON public.campaign_invitations
  FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND (public.is_campaign_owner(campaign_id) OR public.is_campaign_admin(campaign_id))
  );

-- Update/Delete invitations: owner or admin
CREATE POLICY "campaign_inv_update_owner_or_admin"
  ON public.campaign_invitations
  FOR UPDATE
  USING (public.is_campaign_owner(campaign_id) OR public.is_campaign_admin(campaign_id));

CREATE POLICY "campaign_inv_delete_owner_or_admin"
  ON public.campaign_invitations
  FOR DELETE
  USING (public.is_campaign_owner(campaign_id) OR public.is_campaign_admin(campaign_id));

-- View invitations: owner or any member of the campaign
CREATE POLICY "campaign_inv_select_owner_or_member"
  ON public.campaign_invitations
  FOR SELECT
  USING (public.is_campaign_owner(campaign_id) OR public.is_campaign_member(campaign_id));
