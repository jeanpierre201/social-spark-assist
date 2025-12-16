import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { useMastodonAuth } from '@/hooks/useMastodonAuth';
import { Send, Plus, Unlink } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom Mastodon icon
const MastodonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
    <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.667-1.668 1.976v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"/>
  </svg>
);

const FreeSocialMediaSettings = () => {
  const { accounts, loading, disconnectAccount, refetchAccounts } = useSocialAccounts();
  const { connectMastodon, isConnecting: isMastodonConnecting } = useMastodonAuth(refetchAccounts);

  const handleMastodonConnect = async () => {
    await connectMastodon();
  };

  const freePlatforms = [
    { id: 'mastodon', name: 'Mastodon', icon: MastodonIcon, color: 'bg-purple-600' },
    { id: 'telegram', name: 'Telegram', icon: Send, color: 'bg-blue-400', comingSoon: true },
  ];

  const getAccountByPlatform = (platform: string) => {
    return accounts.find(acc => acc.platform === platform);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading accounts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connect Social Accounts</CardTitle>
        <CardDescription>
          Connect Mastodon or Telegram to post your content (Free tier)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {freePlatforms.map((platform) => {
          const account = getAccountByPlatform(platform.id);
          const IconComponent = platform.icon;

          return (
            <div key={platform.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${platform.color} shrink-0`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{platform.name}</h3>
                    {platform.comingSoon && (
                      <Badge variant="secondary" className="text-xs">
                        Soon
                      </Badge>
                    )}
                  </div>
                  {account ? (
                    <div className="flex items-center flex-wrap gap-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Connected
                      </Badge>
                      {account.username && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          @{account.username}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end sm:shrink-0">
                {account ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => disconnectAccount(account.id)}
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (platform.id === 'mastodon') {
                        handleMastodonConnect();
                      }
                    }}
                    disabled={
                      (platform.id === 'mastodon' && isMastodonConnecting) ||
                      platform.comingSoon
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {platform.id === 'mastodon' && isMastodonConnecting
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

        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground">
            Want more platforms?{' '}
            <Link to="/#pricing" className="text-primary hover:underline">
              Upgrade your plan
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreeSocialMediaSettings;
