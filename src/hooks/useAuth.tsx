
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect and save user's timezone
    const saveUserTimezone = async (userId: string) => {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log('Detected user timezone:', userTimezone);
        
        // Update user profile with timezone
        const { error } = await supabase
          .from('profiles')
          .update({ timezone: userTimezone })
          .eq('id', userId);
        
        if (error) {
          console.error('Error saving timezone:', error);
        } else {
          console.log('User timezone saved successfully');
        }
      } catch (error) {
        console.error('Error detecting timezone:', error);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Save timezone when user signs in (non-blocking)
        if (event === 'SIGNED_IN' && session?.user?.id) {
          setTimeout(() => saveUserTimezone(session.user.id), 0);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Save timezone on initial load if user is logged in (non-blocking)
      if (session?.user?.id) {
        setTimeout(() => saveUserTimezone(session.user.id), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        return { error: error.message };
      }
      
      console.log('Login successful');
      return {};
    } catch (error) {
      console.error('Login exception:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        console.error('Signup error:', error);
        return { error: error.message };
      }
      
      console.log('Signup successful');
      return {};
    } catch (error) {
      console.error('Signup exception:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user...');
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Clear Supabase session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
      } else {
        console.log('Logout successful');
      }
      
      // Clear any cached data from localStorage and sessionStorage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Clear all Supabase auth related items
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('supabase.auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Force page reload to clear all cached state
      window.location.reload();
      
    } catch (error) {
      console.error('Logout exception:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setSession(null);
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
