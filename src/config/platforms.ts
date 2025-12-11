// Platform configuration for tier-based access

export type PlatformStatus = 'available' | 'beta' | 'coming';
export type SubscriptionTier = 'Free' | 'Starter' | 'Pro';

export interface PlatformConfig {
  id: string;
  name: string;
  icon: string; // Lucide icon name or custom
  tier: SubscriptionTier;
  status: PlatformStatus;
  supportsHashtags: boolean;
  supportsAnalytics: boolean;
  color: string; // Brand color for the platform
  description?: string;
}

export const platforms: PlatformConfig[] = [
  // Free tier platforms
  {
    id: 'mastodon',
    name: 'Mastodon',
    icon: 'mastodon',
    tier: 'Free',
    status: 'available',
    supportsHashtags: true,
    supportsAnalytics: false,
    color: '#6364FF',
    description: 'Decentralized social network'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'telegram',
    tier: 'Free',
    status: 'available',
    supportsHashtags: false,
    supportsAnalytics: false,
    color: '#0088CC',
    description: 'Messaging platform'
  },
  // Starter tier platforms
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    tier: 'Starter',
    status: 'available',
    supportsHashtags: true,
    supportsAnalytics: true,
    color: '#E4405F',
    description: 'Photo & video sharing'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    tier: 'Starter',
    status: 'available',
    supportsHashtags: true,
    supportsAnalytics: true,
    color: '#1877F2',
    description: 'Social networking'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'tiktok',
    tier: 'Starter',
    status: 'beta',
    supportsHashtags: true,
    supportsAnalytics: true,
    color: '#000000',
    description: 'Short-form video'
  },
  // Pro tier platforms
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    tier: 'Pro',
    status: 'available',
    supportsHashtags: true,
    supportsAnalytics: true,
    color: '#0A66C2',
    description: 'Professional networking'
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    icon: 'x',
    tier: 'Pro',
    status: 'coming',
    supportsHashtags: true,
    supportsAnalytics: true,
    color: '#000000',
    description: 'Microblogging platform'
  }
];

export const getPlatformsByTier = (tier: SubscriptionTier): PlatformConfig[] => {
  const tierOrder: SubscriptionTier[] = ['Free', 'Starter', 'Pro'];
  const tierIndex = tierOrder.indexOf(tier);
  
  return platforms.filter(p => {
    const platformTierIndex = tierOrder.indexOf(p.tier);
    return platformTierIndex <= tierIndex;
  });
};

export const getFreePlatforms = (): PlatformConfig[] => 
  platforms.filter(p => p.tier === 'Free');

export const getStarterPlatforms = (): PlatformConfig[] => 
  platforms.filter(p => p.tier === 'Starter');

export const getProPlatforms = (): PlatformConfig[] => 
  platforms.filter(p => p.tier === 'Pro');

export const getStatusBadge = (status: PlatformStatus): { label: string; className: string } => {
  switch (status) {
    case 'beta':
      return { label: 'β', className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' };
    case 'coming':
      return { label: 'Soon', className: 'bg-muted text-muted-foreground' };
    default:
      return { label: '', className: '' };
  }
};

export const analyticsFeaturesByTier: Record<SubscriptionTier, string[]> = {
  Free: ['Post count', 'Basic activity'],
  Starter: ['Engagement rate', 'Total reach', 'Basic insights'],
  Pro: ['Advanced analytics', 'Competitor analysis', 'Custom reports']
};
