
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Zap, Home, ArrowLeft } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface ContentGeneratorHeaderProps {
  isProUser: boolean;
  isStarterUser: boolean;
  isFreeUser: boolean;
}

const ContentGeneratorHeader = ({ isProUser, isStarterUser, isFreeUser }: ContentGeneratorHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Content Generator
            </h1>
            <div className="flex items-center gap-2 sm:hidden">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="sm"
              >
                <Home className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border" />
              <ProfileAvatar />
            </div>
          </div>
          <div className="text-muted-foreground text-sm sm:text-base">
            <p className="truncate mb-1">Welcome back, {user?.email}</p>
            <div className="flex flex-wrap items-center gap-2">
              {isProUser && (
                <Badge className="bg-purple-100 text-purple-800 text-xs">
                  <Crown className="h-3 w-3 mr-1 text-purple-600" />
                  Pro Plan
                </Badge>
              )}
              {isStarterUser && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  <Zap className="h-3 w-3 mr-1 text-blue-600" />
                  Starter Plan
                </Badge>
              )}
              {isFreeUser && (
                <Badge className="bg-gray-100 text-gray-800 text-xs">
                  Free Plan (1 post/month)
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <div className="h-8 w-px bg-border mx-1" />
          <ProfileAvatar />
        </div>
      </div>
    </div>
  );
};

export default ContentGeneratorHeader;
