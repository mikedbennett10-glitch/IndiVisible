import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { AssistantPreferences, AssistantPreferencesUpdate } from '@/types'

export function useAssistantPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<AssistantPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('assistant_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No preferences row yet — create with defaults
      const { data: created } = await supabase
        .from('assistant_preferences')
        .insert({ user_id: user.id })
        .select()
        .single()
      setPreferences(created)
    } else {
      setPreferences(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const updatePreferences = async (updates: AssistantPreferencesUpdate) => {
    if (!preferences) return { error: 'No preferences loaded' }
    const prev = { ...preferences }
    setPreferences({ ...preferences, ...updates } as AssistantPreferences)

    const { error } = await supabase
      .from('assistant_preferences')
      .update(updates)
      .eq('id', preferences.id)

    if (error) {
      setPreferences(prev)
      return { error: error.message }
    }
    return { error: null }
  }

  return { preferences, loading, updatePreferences, refetch: fetchPreferences }
}
