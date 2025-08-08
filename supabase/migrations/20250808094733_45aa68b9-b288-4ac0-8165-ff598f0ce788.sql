-- Fix infinite recursion in campaign_members RLS policy
-- The issue is in the SELECT policy which references itself through a UNION with campaign_members

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view campaign members for their campaigns" ON public.campaign_members;

-- Create a new policy without infinite recursion
CREATE POLICY "Users can view campaign members for their campaigns" 
ON public.campaign_members 
FOR SELECT 
USING (
  -- Users can view members of campaigns they created
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE created_by = auth.uid()
  )
  OR
  -- Users can view members of campaigns they are part of (direct check without recursion)
  user_id = auth.uid()
);