import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Sparkles, 
  Crown,
  Lock,
  ArrowRight,
  RefreshCw,
  Home,
  Settings,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import StarterPlanPricing from './StarterPlanPricing';
import SocialMediaSettings from './SocialMediaSettings';

interface Post {
  id: string;
  industry: string;
  goal: string;
  generated_caption: string;
  generated_hashtags: string[];
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, checkSubscription } = useSubscription();
  const { accounts, metrics, loading: socialLoading } = useSocialAccounts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSocialSettings, setShowSocialSettings] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to load your content history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, toast]);

  const handleRefreshSubscription = async () => {
    await checkSubscription();
    toast({
      title: "Refreshed",
      description: "Subscription status updated",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate aggregated metrics from connected social accounts
  const aggregatedMetrics = metrics.reduce((acc, metric) => {
    return {
      totalFollowers: acc.totalFollowers + metric.followers_count,
      avgEngagement: (acc.avgEngagement + metric.engagement_rate) / 2,
      totalPosts: acc.totalPosts + metric.posts_count,
      scheduledPosts: acc.scheduledPosts + metric.scheduled_posts_count
    };
  }, { totalFollowers: 0, avgEngagement: 0, totalPosts: 0, scheduledPosts: 0 });

  const LockedCard = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gray-50/80 z-10 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Starter Plan Required</p>
        </div>
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-300">--</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading || socialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
              {subscribed && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                  <Crown className="h-3 w-3 mr-1" />
                  {subscriptionTier}
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline" onClick={() => setShowSocialSettings(!showSocialSettings)}>
              <Settings className="h-4 w-4 mr-2" />
              Social Accounts
            </Button>
            <Button variant="outline" onClick={() => navigate('/support')}>
              <Mail className="h-4 w-4 mr-2" />
              Support
            </Button>
            <Button variant="outline" onClick={handleRefreshSubscription}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button onClick={() => navigate('/content-generator')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content
            </Button>
          </div>
        </div>

        {/* Social Media Settings */}
        {showSocialSettings && <SocialMediaSettings />}

        {/* Connection Status */}
        {accounts.length === 0 && !showSocialSettings && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Connect Social Media Accounts</h3>
                  <p className="text-blue-700">Connect your social accounts to see real analytics and metrics</p>
                </div>
                <Button onClick={() => setShowSocialSettings(true)}>
                  Connect Accounts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Status */}
        {!subscribed && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">Upgrade to Starter Plan</h3>
                  <p className="text-orange-700">Unlock unlimited content generation and premium features</p>
                </div>
                <div className="flex-shrink-0">
                  <StarterPlanPricing />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts Generated</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts.length}</div>
              <p className="text-xs text-muted-foreground">All-time content created</p>
            </CardContent>
          </Card>

          {subscribed ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {accounts.length > 0 ? `${aggregatedMetrics.avgEngagement.toFixed(1)}%` : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {accounts.length > 0 ? 'From connected accounts' : 'Connect accounts to view'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Followers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {accounts.length > 0 ? aggregatedMetrics.totalFollowers.toLocaleString() : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {accounts.length > 0 ? 'Total across all platforms' : 'Connect accounts to view'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {accounts.length > 0 ? aggregatedMetrics.scheduledPosts : '--'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {accounts.length > 0 ? 'Ready to publish' : 'Connect accounts to view'}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <LockedCard 
                title="Engagement Rate" 
                description="Track your social media performance"
                icon={TrendingUp}
              />
              <LockedCard 
                title="Followers" 
                description="Monitor your audience growth"
                icon={Users}
              />
              <LockedCard 
                title="Scheduled Posts" 
                description="Manage your content calendar"
                icon={Calendar}
              />
            </>
          )}
        </div>

        {/* Recent Content */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>Your latest AI-generated social media posts</CardDescription>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No content generated yet</p>
                <p className="mb-4">Start creating engaging social media content with AI</p>
                <Button onClick={() => navigate('/content-generator')}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Your First Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{post.industry}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Goal:</h3>
                      <p className="text-sm">{post.goal}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Generated Caption:</h3>
                      <p className="text-sm bg-gray-50 p-3 rounded">{post.generated_caption}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">Hashtags:</h3>
                      <p className="text-sm text-blue-600">
                        {post.generated_hashtags.map(tag => `#${tag}`).join(' ')}
                      </p>
                    </div>
                  </div>
                ))}
                
                {posts.length >= 5 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => navigate('/content-generator')}>
                      View All Content
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
