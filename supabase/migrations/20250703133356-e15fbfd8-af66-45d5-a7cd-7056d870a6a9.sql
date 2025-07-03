
-- Create enum for user roles in campaigns
CREATE TYPE public.campaign_role AS ENUM ('admin', 'editor', 'viewer');

-- Create campaigns/projects table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'completed', 'archived'))
);

-- Create campaign members table (for team collaboration)
CREATE TABLE public.campaign_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role campaign_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Add constraint to limit collaborators to 5 per campaign
ALTER TABLE public.campaign_members 
ADD CONSTRAINT max_collaborators_per_campaign 
CHECK (
  (SELECT COUNT(*) FROM public.campaign_members WHERE campaign_id = campaign_members.campaign_id) <= 5
);

-- Create campaign invitations table (for pending invites)
CREATE TABLE public.campaign_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role campaign_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  UNIQUE(campaign_id, email)
);

-- Enable RLS on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns they are members of or created"
  ON public.campaigns FOR SELECT
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Only campaign admins can update campaigns"
  ON public.campaigns FOR UPDATE
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only campaign creators can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for campaign_members
CREATE POLICY "Users can view campaign members for campaigns they belong to"
  ON public.campaign_members FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only campaign admins can add members"
  ON public.campaign_members FOR INSERT
  WITH CHECK (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only campaign admins can update member roles"
  ON public.campaign_members FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only campaign admins can remove members"
  ON public.campaign_members FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for campaign_invitations
CREATE POLICY "Users can view invitations for campaigns they admin"
  ON public.campaign_invitations FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only campaign admins can create invitations"
  ON public.campaign_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only campaign admins can update invitations"
  ON public.campaign_invitations FOR UPDATE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only campaign admins can delete invitations"
  ON public.campaign_invitations FOR DELETE
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE created_by = auth.uid()
      UNION
      SELECT campaign_id FROM public.campaign_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically add campaign creator as admin member
CREATE OR REPLACE FUNCTION public.add_campaign_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.campaign_members (campaign_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'admin', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add creator as admin when campaign is created
CREATE TRIGGER add_campaign_creator_as_admin_trigger
  AFTER INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.add_campaign_creator_as_admin();

-- Function to check if user can invite more members (max 5 limit)
CREATE OR REPLACE FUNCTION public.can_add_campaign_member(campaign_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.campaign_members 
    WHERE campaign_id = campaign_uuid
  ) < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
