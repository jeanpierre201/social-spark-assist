
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useUserRole } from './useUserRole';

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  adminLogin: (email: string, password: string) => Promise<{ error?: string }>;
  adminLogout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  isAuthorized: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isDeveloper, loading: roleLoading } = useUserRole();

  const isAuthenticated = !!user;
  const isAuthorized = isAuthenticated && (isAdmin() || isDeveloper());

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Admin auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!roleLoading) {
          setLoading(false);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Admin initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!roleLoading) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [roleLoading]);

  useEffect(() => {
    if (!roleLoading) {
      setLoading(false);
    }
  }, [roleLoading]);

  const adminLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Admin login error:', error);
        return { error: error.message };
      }

      // Check if user has admin or developer role
      if (data.user) {
        const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
          _user_id: data.user.id
        });

        if (roleError || !roleData || (roleData !== 'admin' && roleData !== 'developer')) {
          await supabase.auth.signOut();
          return { error: 'Access denied. Admin or developer privileges required.' };
        }

        // Create admin session
        const sessionToken = crypto.randomUUID();
        const { error: sessionError } = await supabase
          .from('admin_sessions')
          .insert({
            user_id: data.user.id,
            session_token: sessionToken
          });

        if (sessionError) {
          console.error('Error creating admin session:', sessionError);
        }
      }
      
      console.log('Admin login successful');
      return {};
    } catch (error) {
      console.error('Admin login exception:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = async () => {
    try {
      console.log('Admin logging out...');
      
      // Deactivate admin sessions
      if (user) {
        await supabase
          .from('admin_sessions')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Clear Supabase session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Admin logout error:', error);
      } else {
        console.log('Admin logout successful');
      }
      
      // Clear cached data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('supabase.auth')) {
          localStorage.removeItem(key);
        }
      });
      
    } catch (error) {
      console.error('Admin logout exception:', error);
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ 
      user, 
      session, 
      adminLogin, 
      adminLogout, 
      loading, 
      isAuthenticated, 
      isAuthorized 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
