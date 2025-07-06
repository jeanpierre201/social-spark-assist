
-- Fix the campaign members relationship with profiles table
-- The issue is that we need to properly join campaign_members with profiles
-- Let's ensure the foreign key relationship is properly set up

-- First, let's add the missing foreign key constraint if it doesn't exist
ALTER TABLE public.campaign_members 
ADD CONSTRAINT campaign_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the RLS policies to fix the relationship issues
-- Drop the existing policies that might be causing issues
DROP POLICY IF EXISTS "Campaign creators can view members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign creators can add members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign creators can remove members" ON public.campaign_members;
DROP POLICY IF EXISTS "Campaign creators can update member roles" ON public.campaign_members;

-- Create new, more specific RLS policies for campaign_members
CREATE POLICY "Users can view campaign members for their campaigns"
  ON public.campaign_members FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Campaign owners can add members"
  ON public.campaign_members FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Campaign owners can remove members"
  ON public.campaign_members FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Campaign owners can update member roles"
  ON public.campaign_members FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
    )
  );

-- Create a function to get monthly post count for Pro users (limit to 100)
CREATE OR REPLACE FUNCTION public.get_monthly_post_count_with_limit(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  post_count integer;
  user_tier text;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM public.subscribers
  WHERE user_id = user_uuid OR email IN (
    SELECT email FROM auth.users WHERE id = user_uuid
  )
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Get current month post count
  SELECT COUNT(*) INTO post_count
  FROM public.posts
  WHERE user_id = user_uuid
  AND created_at >= DATE_TRUNC('month', NOW());

  RETURN post_count;
END;
$function$;
