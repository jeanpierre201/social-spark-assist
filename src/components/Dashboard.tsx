import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Clock,
  Image as ImageIcon,
  Hash,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RobotCalendarIcon from '@/components/RobotCalendarIcon';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [planUsage] = useState({
    postsUsed: 7,
    postsLimit: 10,
    planName: "Starter Plan"
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const stats = [
    {
      title: "Total Posts",
      value: "47",
      change: "+12%",
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Engagement Rate",
      value: "4.8%",
      change: "+2.1%",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Followers",
      value: "2,847",
      change: "+156",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Scheduled Posts",
      value: "23",
      change: "Next 7 days",
      icon: RobotCalendarIcon,
      color: "text-orange-600"
    }
  ];

  const recentContent = [
    {
      platform: "Instagram",
      content: "🌟 Transform your business with AI-powered solutions! #AI #Innovation #Tech",
      scheduled: "Today 2:00 PM",
      status: "scheduled"
    },
    {
      platform: "LinkedIn",
      content: "5 ways artificial intelligence is revolutionizing social media marketing...",
      scheduled: "Tomorrow 9:00 AM",
      status: "scheduled"
    },
    {
      platform: "Twitter",
      content: "The future of content creation is here! 🚀 #AIContent #SocialMedia",
      scheduled: "Posted 2 hours ago",
      status: "posted"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || user?.email}! Here's your social media overview.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        {/* Plan Usage */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                {planUsage.planName}
              </span>
              <Button variant="outline" size="sm">Upgrade</Button>
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
              {planUsage.postsLimit - planUsage.postsUsed} posts remaining
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
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
                  <Card className="p-4 hover:bg-blue-50 cursor-pointer transition-colors">
                    <div className="flex items-center space-x-3">
                      <ImageIcon className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold">AI Images</h3>
                        <p className="text-sm text-muted-foreground">Create visuals</p>
                      </div>
                    </div>
                  </Card>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
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
                Your latest posts and scheduled content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentContent.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.status === 'posted' ? 'bg-green-500' : 'bg-orange-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{item.platform}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'posted' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{item.content}</p>
                      <p className="text-xs text-muted-foreground">{item.scheduled}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
