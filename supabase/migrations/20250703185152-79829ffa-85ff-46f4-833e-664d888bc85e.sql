
-- Create a security definer function to check if user can access campaign
CREATE OR REPLACE FUNCTION public.user_can_access_campaign(campaign_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_uuid AND created_by = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Campaign admins can add members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign admins can remove members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign admins can update member roles" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can view campaign members for campaigns they have access to" ON public.campaign_members;
DROP POLICY IF EXISTS "Users can view campaign members for campaigns they have access" ON public.campaign_members;

-- Create new policies using the security definer function
CREATE POLICY "Campaign creators can add members" 
  ON public.campaign_members 
  FOR INSERT 
  WITH CHECK (public.user_can_access_campaign(campaign_id));

CREATE POLICY "Campaign creators can remove members" 
  ON public.campaign_members 
  FOR DELETE 
  USING (public.user_can_access_campaign(campaign_id));

CREATE POLICY "Campaign creators can update member roles" 
  ON public.campaign_members 
  FOR UPDATE 
  USING (public.user_can_access_campaign(campaign_id));

CREATE POLICY "Campaign creators can view members" 
  ON public.campaign_members 
  FOR SELECT 
  USING (public.user_can_access_campaign(campaign_id));
