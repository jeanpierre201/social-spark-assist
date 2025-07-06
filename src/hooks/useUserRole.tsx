
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'developer' | 'user' | 'viewer' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        // Use the database function to get user role
        const { data, error } = await supabase.rpc('get_user_role', {
          _user_id: user.id
        });

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data as UserRole);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  const hasRole = (role: UserRole) => {
    if (!userRole) return false;
    
    const roleHierarchy = { developer: 4, admin: 3, user: 2, viewer: 1 };
    const userLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[role || 'viewer'];
    
    return userLevel >= requiredLevel;
  };

  const isDeveloper = () => hasRole('developer');
  const isAdmin = () => hasRole('admin');
  const isUser = () => hasRole('user');
  const isViewer = () => hasRole('viewer');

  return {
    userRole,
    loading,
    hasRole,
    isDeveloper,
    isAdmin,
    isUser,
    isViewer
  };
};
