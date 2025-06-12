
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Clock,
  Image as ImageIcon,
  Hash,
  LogOut,
  Calendar,
  Home,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Post {
  id: string;
  industry: string;
  goal: string;
  generated_caption: string;
  generated_hashtags: string[];
  created_at: string;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string>('');
  const [monthlyPosts, setMonthlyPosts] = useState(0);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const planUsage = {
    postsUsed: monthlyPosts,
    postsLimit: 1, // Free plan limit
    planName: "Free Plan"
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setProfileName('');
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profileData?.full_name) {
        setProfileName(profileData.full_name);
      }

      // Fetch monthly post count
      const { data: monthlyCount } = await supabase.rpc('get_monthly_post_count', {
        user_uuid: user.id
      });
      
      setMonthlyPosts(monthlyCount || 0);

      // Fetch recent posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentPosts(posts || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleUpgrade = () => {
    navigate('/#pricing');
  };

  const displayName = profileName || user?.email || '';

  // Free plan stats - all disabled except total posts
  const stats = [
    {
      title: "Total Posts",
      value: monthlyPosts.toString(),
      change: "This month",
      icon: BarChart3,
      color: "text-blue-600",
      disabled: false
    },
    {
      title: "Engagement Rate",
      value: "—",
      change: "Upgrade to view",
      icon: TrendingUp,
      color: "text-gray-400",
      disabled: true
    },
    {
      title: "Followers",
      value: "—",
      change: "Upgrade to view",
      icon: Users,
      color: "text-gray-400",
      disabled: true
    },
    {
      title: "Scheduled Posts",
      value: "—",
      change: "Upgrade to view",
      icon: Calendar,
      color: "text-gray-400",
      disabled: true
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {displayName}! Here's your social media overview.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleGoHome} className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Plan Usage */}
        <Card className="mb-8 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Sparkles className="h-5 w-5 text-orange-600 mr-2" />
                {planUsage.planName}
              </span>
              <Button onClick={handleUpgrade} size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Upgrade
              </Button>
            </CardTitle>
            <CardDescription>
              You've used {planUsage.postsUsed} of {planUsage.postsLimit} posts this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress 
              value={(planUsage.postsUsed / planUsage.postsLimit) * 100} 
              className="h-3"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.max(0, planUsage.postsLimit - planUsage.postsUsed)} posts remaining
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`hover:shadow-lg transition-shadow ${stat.disabled ? 'opacity-60' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    {stat.title}
                    {stat.disabled && <Lock className="h-3 w-3 ml-2" />}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Content Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                AI Content Generator
              </CardTitle>
              <CardDescription>
                Generate engaging content for your social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 hover:bg-purple-50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <Hash className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Caption & Hashtags</h3>
                        <p className="text-sm text-muted-foreground">Generate captions</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 bg-gray-50 cursor-not-allowed transition-colors relative">
                    <div className="absolute top-2 right-2">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-3 opacity-50">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-semibold">AI Images</h3>
                        <p className="text-sm text-muted-foreground">Upgrade required</p>
                      </div>
                    </div>
                  </Card>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => navigate('/content-generator')}
                >
                  Start Creating Content
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                Recent Content
              </CardTitle>
              <CardDescription>
                Your generated content history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPosts.length > 0 ? (
                  recentPosts.map((post) => (
                    <div key={post.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full mt-2 bg-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{post.industry}</p>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            Generated
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{post.generated_caption}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString()} at {new Date(post.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No content generated yet</p>
                    <p className="text-sm">Create your first post to see it here!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
