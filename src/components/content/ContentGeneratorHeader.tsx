
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
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Content Generator
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
            {isFreeUser && (
              <Badge className="bg-gray-100 text-gray-800">
                Free Plan (1 post/month)
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
