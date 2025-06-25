
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
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
  MessageSquare
} from 'lucide-react';
import ProAnalytics from './ProAnalytics';
import TeamCollaboration from './TeamCollaboration';

const Dashboard = () => {
  const { user } = useAuth();
  const { subscribed, subscriptionTier, loading } = useSubscription();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const isProUser = subscribed && subscriptionTier === 'Pro';
  const isStarterUser = subscribed && subscriptionTier === 'Starter';

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
                {isProUser ? 'Pro Dashboard' : isStarterUser ? 'Starter Dashboard' : 'Dashboard'}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Welcome back, {user?.email}
                {isProUser && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Crown className="h-3 w-3 mr-1 text-purple-600" />
                    Pro Plan
                  </Badge>
                )}
                {isStarterUser && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Zap className="h-3 w-3 mr-1 text-blue-600" />
                    Starter Plan
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isStarterUser && (
                <Button
                  onClick={() => navigate('/upgrade-pro')}
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
              <Button
                onClick={handleContentGeneration}
                className={`flex items-center space-x-2 ${
                  isProUser 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : isStarterUser
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Content</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Pro Users Only */}
        {isProUser && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Advanced Analytics
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'team'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Team Collaboration
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Content for Pro Users */}
        {isProUser && activeTab === 'analytics' && <ProAnalytics />}
        {isProUser && activeTab === 'team' && <TeamCollaboration />}
        
        {/* Overview Tab or Default View */}
        {(!isProUser || activeTab === 'overview') && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className={isProUser ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : isStarterUser ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
                  <Sparkles className={`h-4 w-4 ${isProUser ? 'text-purple-600' : isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isStarterUser ? '8' : isProUser ? '24' : '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    {isStarterUser ? '+4 this month' : isProUser ? '+12% from last month' : 'Start creating'}
                  </p>
                </CardContent>
              </Card>

              <Card className={isProUser ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : isStarterUser ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <TrendingUp className={`h-4 w-4 ${isProUser ? 'text-purple-600' : isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isStarterUser ? '3.1%' : isProUser ? '4.2%' : '--'}</div>
                  <p className="text-xs text-muted-foreground">
                    {(isStarterUser || isProUser) ? '+0.8% from last week' : 'No data yet'}
                  </p>
                </CardContent>
              </Card>

              <Card className={isProUser ? "border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50" : isStarterUser ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
                  <Calendar className={`h-4 w-4 ${isProUser ? 'text-purple-600' : isStarterUser ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isStarterUser ? '3' : isProUser ? '8' : '0'}</div>
                  <p className="text-xs text-muted-foreground">Next 7 days</p>
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
                    {isProUser ? '3' : isStarterUser ? '8.2K' : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isProUser ? 'Active collaborators' : isStarterUser ? '+2.1K this month' : 'Start posting'}
                  </p>
                </CardContent>
              </Card>
            </div>

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
                      ? 'Create unlimited content with AI assistance and advanced variations'
                      : isStarterUser
                        ? 'Generate up to 10 posts per month with AI assistance'
                        : 'Create engaging social media content with AI'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleContentGeneration}
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

              {/* Social Accounts / Team Card */}
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
                    onClick={() => isProUser ? setActiveTab('team') : navigate('/settings')}
                  >
                    {isProUser ? 'Manage Team' : 'Connect Accounts'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Prompts */}
            {isStarterUser && (
              <div className="mt-8">
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-700">
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Pro
                    </CardTitle>
                    <CardDescription>
                      Unlock advanced features for professional content creation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center">
                        <BarChart3 className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm">Advanced Analytics</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm">Team Collaboration</span>
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm">Unlimited Content</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate('/upgrade-pro')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Upgrade Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

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
