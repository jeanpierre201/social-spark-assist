import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ProfileAvatar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  );
};

export default ProfileAvatar;
