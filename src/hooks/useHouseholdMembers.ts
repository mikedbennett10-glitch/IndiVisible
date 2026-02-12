import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Profile } from '@/types'

export function useHouseholdMembers() {
  const { profile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.household_id) {
      setLoading(false)
      return
    }

    async function fetchMembers() {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', profile!.household_id!)

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setMembers(data ?? [])
      }
      setLoading(false)
    }

    fetchMembers()
  }, [profile?.household_id])

  return { members, loading, error }
}
