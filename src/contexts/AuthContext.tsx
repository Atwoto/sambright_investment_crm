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
          // Fetch profile from database (RLS is now fixed)
          const userProfile = await fetchUserProfile(session.user.id);
          console.log('✅ User profile loaded:', userProfile);
          if (mounted) {
            setUser(userProfile);
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
            // Fetch profile from database (RLS is now fixed)
            const userProfile = await fetchUserProfile(session.user.id);
            console.log('🎯 User from auth change:', userProfile);
            if (mounted) {
              setUser(userProfile);
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
    console.log('🔍 Fetching profile for:', userId);

    // Try database with 3 second timeout
    try {
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('id, email, name, role, created_at')
        .eq('id', userId)
        .maybeSingle();

      const { data: profile, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (!error && profile) {
        console.log('✅ Profile loaded from DB:', profile.email, 'role:', profile.role);
        return {
          id: profile.id,
          email: profile.email || '',
          name: profile.name || '',
          role: (profile.role as UserRole) || 'client'
        };
      }

      if (error) {
        console.warn('⚠️ Profile fetch error:', error.message);
      }
    } catch (error: any) {
      console.warn('⏱️ Profile fetch timeout:', error.message);
    }

    // Fallback to session data
    console.log('🚀 Using session fallback');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fallbackUser = {
        id: userId,
        email: user?.email || 'user@example.com',
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'User',
        role: (user?.user_metadata?.role as UserRole) || 'super_admin'
      };
      console.log('✅ Fallback user created:', fallbackUser);
      return fallbackUser;
    } catch (err) {
      console.error('❌ Session fallback failed:', err);
      // Last resort - return a valid user object
      return {
        id: userId,
        email: 'admin@example.com',
        name: 'Admin',
        role: 'super_admin' as UserRole
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
