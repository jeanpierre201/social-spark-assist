
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  isProUser: boolean;
  isStarterUser: boolean;
}

const DashboardHeader = ({ isProUser, isStarterUser }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard
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
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/profile')}
          >
            <AvatarImage 
              src={profileData?.avatar_url || ''} 
              alt="Profile picture" 
            />
            <AvatarFallback className="bg-blue-600 text-white font-bold text-lg border-2 border-blue-500">
              {profileData?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>Home</span>
          </Button>
          <Button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
