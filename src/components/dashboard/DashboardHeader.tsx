
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  isProUser: boolean;
  isStarterUser: boolean;
}

const DashboardHeader = ({ isProUser, isStarterUser }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
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
  );
};

export default DashboardHeader;
