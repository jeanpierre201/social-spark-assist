
-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'completed', 'archived'))
);

-- Create campaign_members table
CREATE TABLE public.campaign_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign_invitations table
CREATE TABLE public.campaign_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns they created or are members of" 
  ON public.campaigns 
  FOR SELECT 
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaigns.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns" 
  ON public.campaigns 
  FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Campaign creators can update their campaigns" 
  ON public.campaigns 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Campaign creators can delete their campaigns" 
  ON public.campaigns 
  FOR DELETE 
  USING (created_by = auth.uid());

-- RLS Policies for campaign_members
CREATE POLICY "Users can view campaign members for campaigns they have access to" 
  ON public.campaign_members 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.campaign_members cm2 
          WHERE cm2.campaign_id = campaigns.id AND cm2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Campaign admins can add members" 
  ON public.campaign_members 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaign_members.campaign_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Campaign admins can update member roles" 
  ON public.campaign_members 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaign_members.campaign_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Campaign admins can remove members" 
  ON public.campaign_members 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaign_members.campaign_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for campaign_invitations
CREATE POLICY "Users can view invitations for campaigns they have access to" 
  ON public.campaign_invitations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND (
        created_by = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.campaign_members 
          WHERE campaign_id = campaigns.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Campaign admins can create invitations" 
  ON public.campaign_invitations 
  FOR INSERT 
  WITH CHECK (
    invited_by = auth.uid() AND
    (EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaign_invitations.campaign_id AND user_id = auth.uid() AND role = 'admin'
    ))
  );

CREATE POLICY "Campaign admins can update invitations" 
  ON public.campaign_invitations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaign_invitations.campaign_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Campaign admins can delete invitations" 
  ON public.campaign_invitations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.campaign_members 
      WHERE campaign_id = campaign_invitations.campaign_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_campaign_members_campaign_id ON public.campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user_id ON public.campaign_members(user_id);
CREATE INDEX idx_campaign_invitations_campaign_id ON public.campaign_invitations(campaign_id);
CREATE INDEX idx_campaign_invitations_email ON public.campaign_invitations(email);
