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
    let mounted = true;

    // Get initial session and fetch profile
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          setUser(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          console.log('🎯 Setting user in initAuth:', userProfile);
          if (mounted && userProfile) {
            setUser(userProfile);
            console.log('✅ User set successfully');
          }
          setLoading(false);
        } else {
          console.log('❌ No session found');
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Init auth error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;

        try {
          if (session?.user) {
            const userProfile = await fetchUserProfile(session.user.id);
            console.log('🎯 Setting user in auth change:', userProfile);
            if (mounted && userProfile) {
              setUser(userProfile);
              console.log('✅ User set successfully in auth change');
            }
            setLoading(false);
          } else {
            console.log('❌ No session in auth change');
            setUser(null);
            setLoading(false);
          }
        } catch (error) {
          console.error('Auth change error:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string): Promise<User> {
    try {
      console.log('Fetching profile for user:', userId);

      // Try to fetch profile with a shorter timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      try {
        const { data: profile, error } = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]) as any;

        if (!error && profile) {
          console.log('✅ Profile loaded successfully:', profile.email);
          return {
            id: profile.id,
            email: profile.email || '',
            name: profile.name || '',
            role: (profile.role as UserRole) || 'client'
          };
        }
      } catch (timeoutError) {
        console.warn('⚠️ Profile fetch timed out, using auth metadata');
      }

      // Fallback: Use auth user metadata immediately
      const { data: { user } } = await supabase.auth.getUser();
      console.log('📦 Using auth metadata as fallback:', user?.email);
      
      const fallbackUser = {
        id: userId,
        email: user?.email || '',
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
        role: (user?.user_metadata?.role as UserRole) || 'super_admin'
      };
      
      console.log('👤 Fallback user created:', fallbackUser);
      return fallbackUser;
    } catch (error) {
      console.error('❌ Exception in fetchUserProfile:', error);
      
      // Last resort fallback - ALWAYS return a valid user
      const lastResortUser = {
        id: userId,
        email: 'user@example.com',
        name: 'User',
        role: 'super_admin' as UserRole
      };
      
      console.log('🆘 Last resort user:', lastResortUser);
      return lastResortUser;
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
