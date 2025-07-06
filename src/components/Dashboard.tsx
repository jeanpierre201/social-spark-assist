
import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useSocialAccounts } from '@/hooks/useSocialAccounts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  BarChart3, 
  Users, 
  Calendar,
  Settings,
  Crown,
  Zap,
  TrendingUp,
  Target,
  MessageSquare,
  FileText,
  CalendarDays
} from 'lucide-react';
import ProAnalytics from './ProAnalytics';
import TeamCollaboration from './TeamCollaboration';
import SocialMediaSettings from './SocialMediaSettings';
import NavigationTabs from './content/NavigationTabs';
import { usePostsManager } from '@/hooks/usePostsManager';
import UsageIndicators from './starter/UsageIndicators';
import ContentGenerationForm from './content/ContentGenerationForm';
import PostsDisplay from './content/PostsDisplay';

const Dashboard = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const { accounts, metrics } = useSocialAccounts();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const socialAccountsRef = useRef<HTMLDivElement>(null);

  // Add posts manager for content generation
  const {
    posts,
    currentMonthPosts,
    postLimit,
    createPostMutation,
    updatePostMutation,
    deletePostMutation
  } = usePostsManager();

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';
  const hasAnyPlan = subscribed && (subscriptionTier === 'Pro' || subscriptionTier === 'Starter');

  // Check if we're coming from content generator
  const isFromContentGenerator = location.pathname === '/dashboard' && location.state?.fromContentGenerator;

  console.log('Dashboard: Current subscription info', { subscribed, subscriptionTier, isProUser, isStarterUser });

  const handleContentGeneration = () => {
    console.log('Navigating to content generator for user:', { subscriptionTier, subscribed });
    if (isProUser) {
      navigate('/content-generator');
    } else if (isStarterUser) {
      navigate('/content-generator-starter');
    } else {
      navigate('/content-generator');
    }
  };

  const handleViewAllPosts = () => {
    if (isProUser) {
      navigate('/content-generator', { state: { scrollToPosts: true } });
    } else if (isStarterUser) {
      navigate('/content-generator-starter', { state: { scrollToPosts: true } });
    } else {
      navigate('/content-generator', { state: { scrollToPosts: true } });
    }
  };

  const handleCalendarView = () => {
    if (isProUser) {
      navigate('/content-generator', { state: { scrollToPosts: true, viewMode: 'calendar' } });
    } else if (isStarterUser) {
      navigate('/content-generator-starter', { state: { scrollToPosts: true, viewMode: 'calendar' } });
    } else {
      navigate('/content-generator', { state: { scrollToPosts: true, viewMode: 'calendar' } });
    }
  };

  const handleConnectAccounts = () => {
    if (isProUser) {
      setActiveTab('social');
    } else {
      setActiveTab('social');
      // Scroll to social accounts section after a brief delay to ensure it's rendered
      setTimeout(() => {
        socialAccountsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start' 
        });
      }, 100);
    }
  };

  // Content Generator handlers
  const handleEditPost = (post: any) => {
    // This could be expanded to open an edit modal or form
    console.log('Edit post:', post);
  };

  const handleUpdatePost = async (post: any, newContent: string) => {
    updatePostMutation.mutate({ 
      id: post.id, 
      content: newContent,
      scheduled_date: post.scheduled_date,
      scheduled_time: post.scheduled_time
    });
  };

  const handleDeletePost = async (id: string) => {
    deletePostMutation.mutate(id);
  };

  const handlePostCreated = (newPost: any) => {
    createPostMutation.mutate(newPost);
  };

  // Calculate real metrics - only show for subscribed users
  const totalFollowers = subscribed ? metrics.reduce((sum, metric) => sum + (metric.followers_count || 0), 0) : 0;
  const totalPosts = subscribed ? posts.length : 0;
  const avgEngagementRate = subscribed && metrics.length > 0 
    ? (metrics.reduce((sum, metric) => sum + (metric.engagement_rate || 0), 0) / metrics.length).toFixed(1)
    : null;
  
  // Calculate scheduled posts (posts with future scheduled date/time) - only for subscribed users
  const now = new Date();
  const scheduledPosts = subscribed ? posts.filter(post => {
    if (!post.scheduled_date || !post.scheduled_time) return false;
    const scheduledDateTime = new Date(`${post.scheduled_date}T${post.scheduled_time}`);
    return scheduledDateTime > now;
  }) : [];
  const totalScheduledPosts = scheduledPosts.length;

  // Determine if we should show the Content Generator tab in NavigationTabs
  const shouldShowContentGeneratorTab = !isFromContentGenerator;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Pro Dashboard
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Welcome back, {user?.email}
                {isProUser && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Crown className="h-3 w-3 mr-1 text-purple-600" />
                    Pro Plan (100 posts/month)
                  </Badge>
                )}
                {isStarterUser && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Zap className="h-3 w-3 mr-1 text-blue-600" />
                    Starter Plan (10 posts/month)
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <span>Home</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Pro Users Only */}
        <NavigationTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isProUser={isProUser}
          showContentGenerator={shouldShowContentGeneratorTab}
        />

        {/* Tab Content for Pro Users */}
        {isProUser && activeTab === 'content' && (
          <>
            {/* Usage Indicators */}
            <UsageIndicators 
              monthlyPosts={currentMonthPosts} 
              daysRemaining={30}
              maxPosts={postLimit}
              isProPlan={isProUser}
            />

            {/* Content Generation Form */}
            <div className="mb-6">
              <ContentGenerationForm
                currentMonthPosts={currentMonthPosts}
                isProUser={isProUser}
                isStarterUser={isStarterUser}
                onPostCreated={handlePostCreated}
              />
            </div>

            {/* Display Generated Posts */}
            <PostsDisplay
              posts={posts}
              onEditPost={handleEditPost}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
            />
          </>
        )}
        {isProUser && activeTab === 'analytics' && <ProAnalytics />}
        {isProUser && activeTab === 'team' && <TeamCollaboration />}
        {isProUser && activeTab === 'social' && <SocialMediaSettings />}
        
        {/* Overview Tab or Default View */}
        {(!isProUser || activeTab === 'overview') && (
          <>
            {/* Quick Stats - Only show for subscribed users */}
            {subscribed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className={isProUser ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : isStarterUser ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
                    <Sparkles className={`h-4 w-4 ${isProUser ? 'text-purple-600' : isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalPosts || '--'}</div>
                    <p className="text-xs text-muted-foreground">
                      {isProUser 
                        ? `${currentMonthPosts}/100 this month`
                        : isStarterUser 
                          ? `${currentMonthPosts}/10 this month`
                          : 'No posts yet'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card className={isProUser ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : isStarterUser ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <TrendingUp className={`h-4 w-4 ${isProUser ? 'text-purple-600' : isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgEngagementRate ? `${avgEngagementRate}%` : '--'}</div>
                    <p className="text-xs text-muted-foreground">
                      {avgEngagementRate ? 'Average across platforms' : 'No data available'}
                    </p>
                  </CardContent>
                </Card>

                <Card className={isProUser ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : isStarterUser ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                    <Calendar className={`h-4 w-4 ${isProUser ? 'text-purple-600' : isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalScheduledPosts || '--'}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalScheduledPosts ? 'Ready to publish' : 'No scheduled posts'}
                    </p>
                  </CardContent>
                </Card>

                <Card className={isProUser ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : isStarterUser ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : ""}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {isProUser ? 'Team Members' : 'Total Reach'}
                    </CardTitle>
                    {isProUser ? (
                      <Users className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Target className={`h-4 w-4 ${isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {isProUser ? '3' : totalFollowers ? totalFollowers.toLocaleString() : '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isProUser ? 'Active collaborators' : totalFollowers ? 'Total followers' : 'No followers data'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className={`h-5 w-5 mr-2 ${isProUser ? 'text-purple-600' : isStarterUser ? 'text-blue-600' : 'text-blue-600'}`} />
                    Content Generation
                  </CardTitle>
                  <CardDescription>
                    {isProUser 
                      ? 'Create up to 100 posts per month with AI assistance and advanced variations'
                      : isStarterUser
                        ? 'Generate up to 10 posts per month with AI assistance'
                        : 'Create engaging social media content with AI'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => {
                      if (isProUser) {
                        setActiveTab('content');
                      } else {
                        handleContentGeneration();
                      }
                    }}
                    className={`w-full ${
                      isProUser 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                        : isStarterUser
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : ''
                    }`}
                  >
                    Generate Content
                  </Button>
                </CardContent>
              </Card>

              {/* Posts Management Card - Only show for subscribed users */}
              {hasAnyPlan && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className={`h-5 w-5 mr-2 ${isProUser ? 'text-purple-600' : 'text-blue-600'}`} />
                      Manage Posts
                    </CardTitle>
                    <CardDescription>
                      View, edit, and organize your generated content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleViewAllPosts}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View All Posts
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleCalendarView}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Calendar View
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Analytics Card - Only show for Pro users */}
              {isProUser && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                      Advanced Analytics
                    </CardTitle>
                    <CardDescription>
                      Deep insights, competitor analysis, and performance tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('analytics')}
                    >
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Social Accounts / Team Card - Only show for subscribed users */}
              {subscribed && (
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className={`h-5 w-5 mr-2 ${isProUser ? 'text-purple-600' : 'text-blue-600'}`} />
                      {isProUser ? 'Team Collaboration' : 'Social Accounts'}
                    </CardTitle>
                    <CardDescription>
                      {isProUser 
                        ? 'Manage team members, roles, and collaborative workflows'
                        : 'Connect and manage your social media accounts'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleConnectAccounts}
                    >
                      {isProUser ? 'Manage Team' : 'Connect Accounts'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Show Social Accounts tab for Starter users */}
            {isStarterUser && activeTab === 'social' && (
              <div className="mt-8" ref={socialAccountsRef}>
                <SocialMediaSettings />
              </div>
            )}

            {/* Upgrade Prompts for non-subscribed users only */}
            {!subscribed && (
              <div className="mt-8">
                <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-700">
                      <Zap className="h-5 w-5 mr-2" />
                      Get Started with Starter Plan
                    </CardTitle>
                    <CardDescription>
                      Unlock AI-powered content generation and scheduling
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm">10 AI-Generated Posts</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm">Post Scheduling</span>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm">Basic Analytics</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => navigate('/#pricing')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start with Starter Plan
                      </Button>
                      <Button 
                        onClick={() => navigate('/upgrade-pro')}
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Go Pro Instead
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
