import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { useTwitterAuth } from '@/hooks/useTwitterAuth';
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin,
  Music,
  Ghost,
  Plus,
  Unlink,
  RefreshCw 
} from 'lucide-react';

const SocialMediaSettings = () => {
  const { accounts, metrics, loading, connectAccount, disconnectAccount, refreshMetrics } = useSocialAccounts();
  const { connectFacebook, isConnecting: isFacebookConnecting } = useFacebookAuth();
  const { connectTwitter, isConnecting: isTwitterConnecting } = useTwitterAuth();

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-blue-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
    { id: 'tiktok', name: 'TikTok', icon: Music, color: 'bg-black' },
    { id: 'snapchat', name: 'Snapchat', icon: Ghost, color: 'bg-yellow-500' }
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Social Media Accounts</CardTitle>
            <CardDescription>
              Connect your social media accounts to get real-time analytics
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refreshMetrics}>
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

          return (
            <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${platform.color}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">{platform.name}</h3>
                  {account ? (
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
                  {platformMetrics && (
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{platformMetrics.followers_count} followers</span>
                      <span>{platformMetrics.engagement_rate}% engagement</span>
                      <span>{platformMetrics.posts_count} posts</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                {account ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => disconnectAccount(account.id)}
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
                      } else if (platform.id === 'twitter') {
                        connectTwitter();
                      } else {
                        connectAccount(platform.id);
                      }
                    }}
                    disabled={
                      (platform.id === 'facebook' && isFacebookConnecting) ||
                      (platform.id === 'twitter' && isTwitterConnecting)
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {(platform.id === 'facebook' && isFacebookConnecting) || 
                     (platform.id === 'twitter' && isTwitterConnecting) 
                      ? 'Connecting...' 
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
  );
};

export default SocialMediaSettings;
