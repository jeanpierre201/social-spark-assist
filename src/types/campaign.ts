
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'draft' | 'completed' | 'archived';
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  joined_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CampaignInvitation {
  id: string;
  campaign_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}
