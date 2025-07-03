
-- Drop the problematic RLS policies that are causing infinite recursion
DROP POLICY IF EXISTS "Campaign admins can add members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign admins can remove members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign admins can update member roles" ON public.campaign_members;

-- Create new policies that avoid the recursive reference
CREATE POLICY "Campaign admins can add members" 
  ON public.campaign_members 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Campaign admins can remove members" 
  ON public.campaign_members 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Campaign admins can update member roles" 
  ON public.campaign_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    )
  );

-- Update the SELECT policy to also avoid recursion
DROP POLICY IF EXISTS "Users can view campaign members for campaigns they have access" ON public.campaign_members;

CREATE POLICY "Users can view campaign members for campaigns they have access to" 
  ON public.campaign_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    )
  );
