import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';

export type UserRole = 'super_admin' | 'production' | 'field' | 'customer_service' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isClient: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and fetch profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          setUser(userProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('Fetching profile for user:', userId);

      // Single attempt with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 3000)
      );

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      console.log('Profile fetch result:', { data: profile, error });

      if (error) {
        console.error('Error fetching profile:', error);
        // Return a basic user object instead of null
        const { data: { user } } = await supabase.auth.getUser();
        return {
          id: userId,
          email: user?.email || '',
          name: user?.user_metadata?.name || 'User',
          role: 'client' as UserRole
        };
      }

      if (!profile) {
        console.warn('No profile found, using default');
        const { data: { user } } = await supabase.auth.getUser();
        return {
          id: userId,
          email: user?.email || '',
          name: user?.user_metadata?.name || 'User',
          role: 'client' as UserRole
        };
      }

      return {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || '',
        role: (profile.role as UserRole) || 'client'
      };
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      // Return a basic user object instead of null
      const { data: { user } } = await supabase.auth.getUser();
      return {
        id: userId,
        email: user?.email || '',
        name: user?.user_metadata?.name || 'User',
        role: 'client' as UserRole
      };
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'client') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = () => user?.role === 'super_admin';
  const isStaff = () => ['production', 'field', 'customer_service'].includes(user?.role || '');
  const isClient = () => user?.role === 'client';

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isStaff,
    isClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
