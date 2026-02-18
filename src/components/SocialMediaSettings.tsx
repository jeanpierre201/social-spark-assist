import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { useInstagramAuth } from '@/hooks/useInstagramAuth';
import { useTwitterAuth } from '@/hooks/useTwitterAuth';
import { useMastodonAuth } from '@/hooks/useMastodonAuth';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSubscription } from '@/hooks/useSubscription';
import TelegramConnectDialog from '@/components/TelegramConnectDialog';
import { 
  Instagram, 
  Facebook, 
  Linkedin,
  Music,
  Send,
  Plus,
  Unlink,
  RefreshCw,
  Lock,
  Share2
} from 'lucide-react';
import PlatformIcon from '@/components/PlatformIcon';
import { Link } from 'react-router-dom';

// Custom Mastodon icon
const MastodonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
    <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.667-1.668 1.976v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
  </svg>
);

type SubscriptionTier = 'Free' | 'Starter' | 'Pro';

const SocialMediaSettings = () => {
  const { accounts, metrics, loading, connectAccount, disconnectAccount, refreshMetrics, refetchAccounts } = useSocialAccounts();
  const { connectFacebook, isConnecting: isFacebookConnecting } = useFacebookAuth();
  const { connectInstagram, isConnecting: isInstagramConnecting } = useInstagramAuth();
  const { connectTwitter, isConnecting: isTwitterConnecting } = useTwitterAuth();
  const { connectMastodon, isConnecting: isMastodonConnecting } = useMastodonAuth(refetchAccounts);
  const { 
    connectTelegram, 
    isConnecting: isTelegramConnecting, 
    showDialog: showTelegramDialog,
    openConnectionDialog: openTelegramDialog,
    closeConnectionDialog: closeTelegramDialog
  } = useTelegramAuth(refetchAccounts);
  const { subscriptionTier, subscribed } = useSubscription();

  const handleMastodonConnect = async () => {
    await connectMastodon();
  };

  // Determine user's effective tier
  const getUserTier = (): SubscriptionTier => {
    if (!subscribed || !subscriptionTier) return 'Free';
    if (subscriptionTier === 'Pro') return 'Pro';
    if (subscriptionTier === 'Starter') return 'Starter';
    return 'Free';
  };

  const userTier = getUserTier();

  // Check if user can access a platform based on tier
  const canAccessPlatform = (platformTier: SubscriptionTier): boolean => {
    const tierOrder: SubscriptionTier[] = ['Free', 'Starter', 'Pro'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const platformTierIndex = tierOrder.indexOf(platformTier);
    return userTierIndex >= platformTierIndex;
  };

  // Get upgrade link based on required tier
  const getUpgradeLink = (tier: SubscriptionTier): string => {
    if (tier === 'Starter') return '/upgrade/starter';
    if (tier === 'Pro') return '/upgrade/pro';
    return '/upgrade/starter';
  };

  const platforms = [
    { id: 'mastodon', name: 'Mastodon', icon: MastodonIcon, color: 'bg-purple-600', tier: 'Free' as SubscriptionTier },
    { id: 'telegram', name: 'Telegram', icon: Send, color: 'bg-blue-400', tier: 'Free' as SubscriptionTier },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500', tier: 'Starter' as SubscriptionTier },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', tier: 'Starter' as SubscriptionTier },
    { id: 'tiktok', name: 'TikTok', icon: Music, color: 'bg-black', tier: 'Starter' as SubscriptionTier, comingSoon: true },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', tier: 'Pro' as SubscriptionTier },
    { id: 'x', name: 'X (Twitter)', icon: () => <PlatformIcon platform="x" size={20} className="text-white" />, color: 'bg-black', tier: 'Pro' as SubscriptionTier, comingSoon: true },
  ];

  const getAccountByPlatform = (platform: string) => {
    return accounts.find(acc => acc.platform === platform);
  };

  const getMetricsByPlatform = (platform: string) => {
    return metrics.find(m => m.platform === platform);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading social media accounts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Social Media Accounts
            </CardTitle>
            <CardDescription className="mt-2">
              Connect your social media accounts to get real-time analytics
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refreshMetrics} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {platforms.map((platform) => {
          const account = getAccountByPlatform(platform.id);
          const platformMetrics = getMetricsByPlatform(platform.id);
          const IconComponent = platform.icon;
          const hasAccess = canAccessPlatform(platform.tier);
          const isLocked = !hasAccess;

          return (
            <div 
              key={platform.id} 
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3 ${isLocked ? 'opacity-60 bg-muted/30' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${platform.color} ${isLocked ? 'opacity-50' : ''}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{platform.name}</h3>
                    {platform.tier && (
                      <Badge variant="outline" className="text-xs">
                        {platform.tier}
                      </Badge>
                    )}
                    {platform.comingSoon && (
                      <Badge variant="secondary" className="text-xs">
                        Soon
                      </Badge>
                    )}
                    {isLocked && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  {isLocked ? (
                    <p className="text-sm text-muted-foreground">
                      Upgrade to {platform.tier} to unlock
                    </p>
                  ) : account ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                      {account.username && (
                        <span className="text-sm text-muted-foreground">
                          @{account.username}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                  {platformMetrics && !isLocked && (
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{platformMetrics.followers_count} followers</span>
                      <span>{platformMetrics.engagement_rate}% engagement</span>
                      <span>{platformMetrics.posts_count} posts</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-auto">
                {isLocked ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <Link to={getUpgradeLink(platform.tier)}>
                      <Lock className="h-4 w-4 mr-2" />
                      Upgrade
                    </Link>
                  </Button>
                ) : account ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => disconnectAccount(account.id)}
                    className="w-full sm:w-auto"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (platform.id === 'facebook') {
                        connectFacebook();
                      } else if (platform.id === 'instagram') {
                        connectInstagram();
                      } else if (platform.id === 'twitter' || platform.id === 'x') {
                        connectTwitter();
                      } else if (platform.id === 'mastodon') {
                        handleMastodonConnect();
                      } else if (platform.id === 'telegram') {
                        openTelegramDialog();
                      } else {
                        connectAccount(platform.id);
                      }
                    }}
                    disabled={
                      (platform.id === 'facebook' && isFacebookConnecting) ||
                      (platform.id === 'instagram' && isInstagramConnecting) ||
                      ((platform.id === 'twitter' || platform.id === 'x') && isTwitterConnecting) ||
                      (platform.id === 'mastodon' && isMastodonConnecting) ||
                      (platform.id === 'telegram' && isTelegramConnecting) ||
                      platform.comingSoon
                    }
                    className="w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {(platform.id === 'facebook' && isFacebookConnecting) || 
                     (platform.id === 'instagram' && isInstagramConnecting) ||
                     ((platform.id === 'twitter' || platform.id === 'x') && isTwitterConnecting) ||
                     (platform.id === 'mastodon' && isMastodonConnecting) ||
                     (platform.id === 'telegram' && isTelegramConnecting)
                      ? 'Connecting...' 
                      : platform.comingSoon 
                        ? 'Coming Soon'
                        : 'Connect'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {accounts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">No accounts connected yet</p>
            <p className="text-sm">Connect your social media accounts to see real analytics</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
              <p className="text-sm font-medium text-blue-900 mb-2">Setup Required:</p>
              <p className="text-sm text-blue-800">
                Configure OAuth providers in your Supabase Dashboard under Authentication → Providers to enable social media connections.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <TelegramConnectDialog
      open={showTelegramDialog}
      onClose={closeTelegramDialog}
      onConnect={connectTelegram}
      isConnecting={isTelegramConnecting}
    />
    </>
  );
};

export default SocialMediaSettings;
