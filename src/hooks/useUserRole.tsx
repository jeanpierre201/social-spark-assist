
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'developer' | 'viewer' | null;

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
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role')
          .limit(1);

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else if (data && data.length > 0) {
          setUserRole(data[0].role as UserRole);
        } else {
          setUserRole(null);
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
    
    const roleHierarchy = { admin: 3, developer: 2, viewer: 1 };
    const userLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[role || 'viewer'];
    
    return userLevel >= requiredLevel;
  };

  const isAdmin = () => hasRole('admin');
  const isDeveloper = () => hasRole('developer');
  const isViewer = () => hasRole('viewer');

  return {
    userRole,
    loading,
    hasRole,
    isAdmin,
    isDeveloper,
    isViewer
  };
};
