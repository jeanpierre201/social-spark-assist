import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Zap, Home, LogOut, ArrowLeft } from 'lucide-react';
import SubscriptionStatusBadge from '@/components/SubscriptionStatusBadge';
import ProfileAvatar from '@/components/ProfileAvatar';

interface DashboardHeaderProps {
  isProUser: boolean;
  isStarterUser: boolean;
  title?: string;
  showLogout?: boolean;
}

const DashboardHeader = ({ isProUser, isStarterUser, title = 'Dashboard', showLogout = true }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {title}
          </h1>
          <div className="text-muted-foreground flex items-center gap-2">
            <span>Welcome back, {user?.email}</span>
            <SubscriptionStatusBadge />
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
          </div>
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
          {showLogout && (
            <Button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
          <div className="h-8 w-px bg-border mx-1" />
          <ProfileAvatar />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
