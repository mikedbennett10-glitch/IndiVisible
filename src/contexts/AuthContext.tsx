import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Household } from '@/types'

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  household: Household | null
  loading: boolean
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const authInitialized = useRef(false)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data)
      if (data.household_id) {
        const { data: householdData } = await supabase
          .from('households')
          .select('*')
          .eq('id', data.household_id)
          .single()
        setHousehold(householdData)
      } else {
        setHousehold(null)
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    // Prevent StrictMode double-fire from causing navigator.locks deadlock
    if (authInitialized.current) return
    authInitialized.current = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
          setHousehold(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      authInitialized.current = false
    }
  }, [fetchProfile])

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setHousehold(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, household, loading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}
