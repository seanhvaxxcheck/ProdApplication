import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType { 
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  useOfflineMode: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [useOfflineMode, setUseOfflineMode] = useState(false);
  
  // Add refs to track current user/profile to prevent unnecessary refetches
  const currentUserRef = useRef<User | null>(null);
  const currentProfileRef = useRef<any | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Validate environment variables first
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        console.log('=== SUPABASE ENVIRONMENT CHECK ===');
        console.log('VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined');
        console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');
        
        // Check if Supabase is configured
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn('Supabase not configured, using offline mode');
          setUseOfflineMode(true);
          setLoading(false);
          return;
        }

        // Check if we're in a development environment and handle CORS issues
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('webcontainer')) {
          console.warn('Development environment detected - some Supabase features may be limited');
        }

        // Test basic connectivity before proceeding
        console.log('Testing Supabase connectivity...');
        
        // Get initial session
        let session, error;
        try {
          const response = await supabase.auth.getSession();
          session = response.data.session;
          error = response.error;
        } catch (fetchError) {
          console.warn('Supabase connection failed, switching to offline mode:', fetchError);
          setUseOfflineMode(true);
          setLoading(false);
          return;
        }
        
        if (error) {
          console.warn('Supabase auth.getSession failed:', error.message);
          console.warn('Full error:', error);
          
          // Check for invalid refresh token errors
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('refresh_token_not_found') ||
              error.code === 'refresh_token_not_found') {
            console.warn('Invalid refresh token detected, clearing stale authentication data...');
            
            // Clear all Supabase auth tokens from localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                console.log('Removing stale localStorage key:', key);
                localStorage.removeItem(key);
              }
            });
            
            // Clear all Supabase auth tokens from sessionStorage
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                console.log('Removing stale sessionStorage key:', key);
                sessionStorage.removeItem(key);
              }
            });
            
            console.log('Stale tokens cleared, reloading application for clean initialization...');
            window.location.reload();
            return;
          }
          
          
          // Check for specific "user not found" error indicating stale JWT
          if (userError.message.includes('User from sub claim in JWT does not exist')) {
            console.warn('Stale JWT detected - user no longer exists, clearing tokens...');
            
            // Clear all Supabase auth tokens from localStorage
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                console.log('Removing stale localStorage key:', key);
                localStorage.removeItem(key);
              }
            });
            
            // Clear all Supabase auth tokens from sessionStorage
            Object.keys(sessionStorage).forEach(key => {
              if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                console.log('Removing stale sessionStorage key:', key);
                sessionStorage.removeItem(key);
              }
            });
            
            console.log('Stale JWT tokens cleared, reloading application...');
            window.location.reload();
            return;
          }
          
          // Clear any stale user/profile state when session is invalid
          setUser(null);
          setSession(null);
          setProfile(null);
          currentUserRef.current = null;
          currentProfileRef.current = null;
          setUseOfflineMode(true);
          setUseOfflineMode(true);
          setLoading(false);
          return;
        }

        console.log('Session retrieved successfully:', !!session);
        
        setSession(session);
        const newUser = session?.user ?? null;
        setUser(newUser);
        currentUserRef.current = newUser;
        
        if (newUser) {
          console.log('User found in session, fetching profile...');
          await fetchProfile(newUser.id);
        } else {
          console.log('No user in session');
          setLoading(false);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change event:', event);
            
            // Only process actual auth changes, not page visibility changes
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
              const newUser = session?.user ?? null;
              
              // Only update if user actually changed
              const userChanged = currentUserRef.current?.id !== newUser?.id;
              
              if (userChanged) {
                console.log('User actually changed, updating auth state');
                setSession(session);
                setUser(newUser);
                currentUserRef.current = newUser;
                
                if (newUser) {
                  await fetchProfile(newUser.id);
                } else {
                  setProfile(null);
                  currentProfileRef.current = null;
                }
              } else {
                console.log('User unchanged, skipping auth state update');
                // Still update session for token refresh
                setSession(session);
              }
              
              setLoading(false);
            } else {
              console.log('Ignoring auth event:', event, '(likely page visibility change)');
            }
          }
        );

        isInitializedRef.current = true;
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization failed:', error);
        console.error('Error type:', error instanceof TypeError ? 'TypeError (Network/CORS issue)' : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        
        // Check if this is a user not found error
        if (fetchError instanceof Error && fetchError.message.includes('User from sub claim in JWT does not exist')) {
          console.warn('Stale JWT detected during initialization, clearing tokens...');
          
          // Clear all Supabase auth tokens from localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              console.log('Removing stale localStorage key:', key);
              localStorage.removeItem(key);
            }
          });
          
          // Clear all Supabase auth tokens from sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              console.log('Removing stale sessionStorage key:', key);
              sessionStorage.removeItem(key);
            }
          });
          
          console.log('Stale JWT tokens cleared, reloading application...');
          window.location.reload();
          return;
        }
        
        setUseOfflineMode(true);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('=== FETCHING PROFILE ===');
      console.log('User ID:', userId);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // If we're in offline mode, create a mock profile
      if (useOfflineMode) {
        const mockProfile = {
          id: userId,
          email: 'demo@example.com',
          full_name: 'Demo User',
          subscription_status: 'active',
          subscription_tier: 'premium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(mockProfile);
        currentProfileRef.current = mockProfile;
        setLoading(false);
        return;
      }

      // Verify we have a valid session before fetching profile
      let user, userError;
      try {
        const response = await supabase.auth.getUser();
        user = response.data.user;
        userError = response.error;
      } catch (fetchError) {
        console.error('Network error fetching user:', fetchError);
        setProfile(null);
        currentProfileRef.current = null;
        setLoading(false);
        return;
      }
      
      if (userError) {
        console.error('Cannot verify user session:', userError);
        
        // Check for specific "user not found" error indicating stale JWT
        if (userError.message && userError.message.includes('User from sub claim in JWT does not exist')) {
          console.warn('Stale JWT detected - user no longer exists, clearing tokens...');
          
          // Clear all Supabase auth tokens from localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              console.log('Removing stale localStorage key:', key);
              localStorage.removeItem(key);
            }
          });
          
          // Clear all Supabase auth tokens from sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
              console.log('Removing stale sessionStorage key:', key);
              sessionStorage.removeItem(key);
            }
          });
          
          console.log('Stale JWT tokens cleared, reloading application...');
          window.location.reload();
          return;
        }
        
        // Clear stale user/profile state when session becomes invalid
        setUser(null);
        setProfile(null);
        currentUserRef.current = null;
        currentProfileRef.current = null;
        setLoading(false);
        return;
      }
      
      if (!user || user.id !== userId) {
        console.error('User session mismatch or no user found');
        setProfile(null);
        currentProfileRef.current = null;
        setLoading(false);
        return;
      }
      
      console.log('User session verified, querying profiles table...');
      
      let data, error;
      try {
        const response = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        data = response.data;
        error = response.error;
      } catch (fetchError) {
        console.error('Network error fetching profile:', fetchError);
        setProfile(null);
        currentProfileRef.current = null;
        setLoading(false);
        return;
      }

      if (error) {
        console.error('Profile query error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        setProfile(null);
        currentProfileRef.current = null;
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
        currentProfileRef.current = data;
      }
    } catch (error) {
      console.error('=== PROFILE FETCH FAILED ===');
      console.error('Error type:', error instanceof TypeError ? 'TypeError (Network/CORS issue)' : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Full error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('NETWORK ISSUE DETECTED:');
        console.error('- Check if Supabase URL is correct');
        console.error('- Verify CORS settings in Supabase dashboard');
        console.error('- Ensure network connectivity');
        console.error('- Check if localhost:5173 is allowed in Supabase CORS settings');
      }
      
      setProfile(null);
      currentProfileRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (useOfflineMode) {
      // Create mock user for offline mode
      const mockUser = {
        id: 'offline-user',
        email,
        created_at: new Date().toISOString(),
      } as User;
      
      const mockProfile = {
        id: 'offline-user',
        email,
        full_name: fullName,
        subscription_status: 'active',
        subscription_tier: 'premium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUser(mockUser);
      setProfile(mockProfile);
      currentUserRef.current = mockUser;
      currentProfileRef.current = mockProfile;
      return { data: { user: mockUser }, error: null };
    }

    // Additional email debugging in AuthContext
    console.log('AuthContext signUp - Email debug:');
    console.log('Email JSON:', JSON.stringify(email));
    console.log('Email bytes:', new TextEncoder().encode(email));
    
    console.log('AuthContext: Starting sign up process');
    console.log('Email:', email);
    console.log('Full name:', fullName);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    console.log('Supabase signUp response:', { data, error });
    
    // If we get a "User already registered" error, let's debug further
    if (error && error.message.includes('already registered')) {
      console.log('=== USER ALREADY EXISTS DEBUG ===');
      console.log('Attempted email:', JSON.stringify(email));
      console.log('Error details:', error);
      console.log('=== END DEBUG ===');
    }

    if (error) {
      console.error('Sign up error:', error);
      return { data, error };
    }

    if (data.user) {
      console.log('User created successfully:', data.user.id);
      console.log('Email confirmed:', !!data.user.email_confirmed_at);
      
      // If email confirmation is disabled, the user will be automatically confirmed
      if (data.user.email_confirmed_at) {
        console.log('User is automatically confirmed, setting auth state');
        setUser(data.user);
        currentUserRef.current = data.user;
        // Profile will be created by the database trigger
        await fetchProfile(data.user.id);
      } else {
        console.log('User needs to confirm email before signing in');
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    if (useOfflineMode) {
      // Create mock user for offline mode
      const mockUser = {
        id: 'offline-user',
        email,
        created_at: new Date().toISOString(),
      } as User;
      
      const mockProfile = {
        id: 'offline-user',
        email,
        full_name: 'Demo User',
        subscription_status: 'active',
        subscription_tier: 'premium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setUser(mockUser);
      setProfile(mockProfile);
      currentUserRef.current = mockUser;
      currentProfileRef.current = mockProfile;
      return { data: { user: mockUser }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.session) {
      setSession(data.session);
    }
    
    return { data, error };
  };

  const signOut = async () => {
    console.log('signOut function called, useOfflineMode:', useOfflineMode);
    
    if (useOfflineMode) {
      console.log('Signing out in offline mode');
      setUser(null);
      setProfile(null);
      currentUserRef.current = null;
      currentProfileRef.current = null;
      return;
    }
    
    try {
      console.log('Attempting Supabase sign out');
      
      // Check if there's an active session before attempting to sign out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Active session found, proceeding with sign out');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Sign out error:', error);
          throw new Error(error.message);
        }
      } else {
        console.log('No active session found, skipping server sign out');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear local state regardless of server response
      setUser(null);
      setSession(null);
      setProfile(null);
      currentUserRef.current = null;
      currentProfileRef.current = null;
    }
  };

  const resetPassword = async (email: string) => {
    if (useOfflineMode) {
      return { data: null, error: null };
    }
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    useOfflineMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};