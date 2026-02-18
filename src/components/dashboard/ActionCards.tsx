
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  BarChart3, 
  Users, 
  FileText,
  CalendarDays,
  Palette,
  Megaphone,
  Share2
} from 'lucide-react';

interface ActionCardsProps {
  isProUser: boolean;
  isStarterUser: boolean;
  hasAnyPlan: boolean;
  onContentGeneration: () => void;
  onViewAllPosts: () => void;
  onCalendarView: () => void;
  onConnectAccounts: () => void;
  onSetActiveTab: (tab: string) => void;
  onBrand?: () => void;
  onCampaigns?: () => void;
  onSocial?: () => void;
}

const ActionCards = ({
  isProUser,
  isStarterUser,
  hasAnyPlan,
  onContentGeneration,
  onViewAllPosts,
  onCalendarView,
  onConnectAccounts,
  onSetActiveTab,
  onBrand,
  onCampaigns,
  onSocial
}: ActionCardsProps) => {
  return (
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
            onClick={onContentGeneration}
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
              onClick={onViewAllPosts}
            >
              <FileText className="h-4 w-4 mr-2" />
              View All Posts
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onCalendarView}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </CardContent>
        </Card>
      )}

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
              onClick={() => onSetActiveTab('analytics')}
            >
              View Analytics
            </Button>
          </CardContent>
        </Card>
      )}

      {hasAnyPlan && (
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
              onClick={() => {
                if (isProUser) {
                  onSetActiveTab('team');
                } else {
                  onConnectAccounts();
                }
              }}
            >
              {isProUser ? 'Manage Team' : 'Connect Accounts'}
            </Button>
          </CardContent>
        </Card>
      )}
      {isProUser && onBrand && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="h-5 w-5 mr-2 text-primary" />
              Brand Profile
            </CardTitle>
            <CardDescription>
              Manage your brand identity, logo, and color palette
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={onBrand}>
              Manage Brand
            </Button>
          </CardContent>
        </Card>
      )}

      {isProUser && onCampaigns && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Megaphone className="h-5 w-5 mr-2 text-primary" />
              Campaigns
            </CardTitle>
            <CardDescription>
              Create and manage marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={onCampaigns}>
              View Campaigns
            </Button>
          </CardContent>
        </Card>
      )}

      {hasAnyPlan && onSocial && (
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-primary" />
              Social Accounts
            </CardTitle>
            <CardDescription>
              Connect and manage your social media platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={onSocial}>
              Manage Social
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActionCards;
