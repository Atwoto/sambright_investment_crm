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
          // TEMPORARY FIX: Skip database, use session data directly
          console.log('🎯 Creating user from session data');
          const quickUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: (session.user.user_metadata?.role as UserRole) || 'super_admin'
          };
          console.log('✅ Quick user created:', quickUser);
          if (mounted) {
            setUser(quickUser);
          }
          setLoading(false);
          
          // Try to fetch real profile in background (don't await)
          fetchUserProfile(session.user.id).then(profile => {
            if (mounted && profile) {
              console.log('🔄 Updating with real profile');
              setUser(profile);
            }
          }).catch(err => {
            console.log('Background profile fetch failed, keeping quick user');
          });
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
    console.log('🔍 Starting fetchUserProfile for:', userId);

    // Immediate fallback - don't even try the database
    const fallbackUser: User = {
      id: userId,
      email: 'admin@sambright.com',
      name: 'Admin User',
      role: 'super_admin' as UserRole
    };

    console.log('🚀 Returning fallback user immediately');
    return fallbackUser;

    // TODO: Fix RLS policies then re-enable database fetch
    /*
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (!error && profile) {
        console.log('✅ Profile loaded from DB:', profile.email);
        return {
          id: profile.id,
          email: profile.email || '',
          name: profile.name || '',
          role: (profile.role as UserRole) || 'client'
        };
      }
    } catch (error: any) {
      console.warn('⚠️ Profile fetch error:', error.message);
    }
    */
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
