"use client"

import { useState, useEffect, useContext, createContext } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { getAbsoluteUrl } from "@/lib/utils"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 Auth Effect: Starting session check...');
    const startTime = performance.now();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionTime = performance.now();
      console.log(`⏱️ Auth: Initial session check took ${(sessionTime - startTime).toFixed(2)}ms`);
      console.log('📝 Auth: Session data:', session ? 'User found' : 'No user');
      
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authChangeStart = performance.now();
      console.log(`🔔 Auth State Change: ${event}`, session ? 'with user' : 'without user');
      
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Auth: User signed in, checking profile...');
        const profileCheckStart = performance.now();
        
        // Check if profile exists, create if not with error handling
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const profileCheckTime = performance.now();
          console.log(`⏱️ Auth: Profile check took ${(profileCheckTime - profileCheckStart).toFixed(2)}ms`);

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Auth: Error checking user profile:', profileError);
          }

          if (!profile) {
            console.log('⚠️ Auth: No profile found, creating...');
            const profileCreateStart = performance.now();
            
            // Try to create profile manually if trigger failed
            const { error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: session.user.id,
                email: session.user.email,
                first_name: session.user.user_metadata?.first_name || '',
                last_name: session.user.user_metadata?.last_name || '',
                display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                avatar_url: session.user.user_metadata?.avatar_url || '',
              });

            const profileCreateTime = performance.now();
            console.log(`⏱️ Auth: Profile creation took ${(profileCreateTime - profileCreateStart).toFixed(2)}ms`);

            if (insertError) {
              console.error('❌ Auth: Error creating user profile:', insertError);
            } else {
              console.log('✅ Auth: User profile created successfully');
            }
          } else {
            console.log('✅ Auth: Profile found:', profile.role || 'no role set');
          }
        } catch (error) {
          console.error('❌ Auth: Error in profile creation process:', error);
          // Don't block login if profile creation fails
        }
        
        const totalAuthTime = performance.now();
        console.log(`⏱️ Auth: Total auth state change took ${(totalAuthTime - authChangeStart).toFixed(2)}ms`);
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      // Use absolute URL function to ensure correct redirect
      const redirectUrl = getAbsoluteUrl('/protected');
      console.log('OAuth redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}