import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { clearAuthTokens } from "@/lib/supabase-utils"
import { User, Session } from '@supabase/supabase-js'
import { isSessionExpired, updateActivity, clearActivity } from '@/lib/session-activity'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userId: string | null
  token: string | null
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: any }>
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, orgName?: string) => Promise<{ user: User | null; error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  getCustomUserId: () => string | null
  getClient: () => typeof supabase
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if session is expired before initializing
    if (isSessionExpired()) {
      console.log('Session expired, clearing auth state')
      clearActivity()
      clearAuthTokens()
      setSession(null)
      setUser(null)
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Update activity if user is logged in
      if (session?.user) {
        updateActivity()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        // Update activity on sign in
        updateActivity()
        
        // Update last_login in profiles table
        setTimeout(() => {
          supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(({ error }) => {
              if (error) console.warn('Failed to update last login:', error)
            })
        }, 0)
      }
    })

    // Periodic session check (every 5 minutes)
    const checkInterval = setInterval(() => {
      if (isSessionExpired()) {
        console.log('Session expired due to inactivity')
        signOut()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(checkInterval)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Update activity on successful sign in
    if (data.user && !error) {
      updateActivity()
    }
    
    return { user: data.user, error }
  }

  const signUp = async (email: string, password: string, fullName: string, orgName?: string) => {
    try {
      const _companyName = orgName || `${email} Company`;
      
      // Use our custom register-user function instead of Supabase Auth
      const { data, error } = await supabase.functions.invoke('register-user', {
        body: {
          email,
          password,
          full_name: fullName,
          company_name: _companyName,
        }
      });

      if (error) {
        console.error('Signup function error:', error);
        return { user: null, error };
      }

      if (data?.error) {
        console.error('Register function error:', data.error);
        return { user: null, error: { message: data.error } };
      }

      // Return success - user needs to confirm email
      return { user: data?.user || null, error: null };
    } catch (error) {
      console.error('SignUp error:', error)
      return { user: null, error: error as any }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (error) {
      console.warn('SignOut warning:', error)
    } finally {
      // Always clear local auth state, tokens, and activity
      setSession(null)
      setUser(null)
      try { clearAuthTokens() } catch {}
      clearActivity()
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  const signInWithPassword = async (credentials: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    
    // Update activity on successful sign in
    if (data.user && !error) {
      updateActivity()
    }
    
    return { error }
  }

  const getCustomUserId = (): string | null => {
    return user?.user_metadata?.custom_user_id || user?.id || null
  }

  const getClient = () => {
    return supabase
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    userId: user?.id || null,
    token: session?.access_token || null,
    signIn,
    signInWithPassword,
    signUp,
    signOut,
    resetPassword,
    getCustomUserId,
    getClient,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}