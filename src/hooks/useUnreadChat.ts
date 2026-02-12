import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Message } from '@/types'

export function useUnreadChat() {
  const { profile } = useAuth()
  const [count, setCount] = useState(0)
  const householdId = profile?.household_id

  useEffect(() => {
    if (!householdId || !profile) return

    async function fetchCount() {
      const { data } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('household_id', householdId!)
        .eq('role', 'assistant')

      const unread = (data ?? []).filter(
        (m) => !m.read_by?.includes(profile!.id)
      ).length
      setCount(unread)
    }

    fetchCount()
  }, [householdId, profile])

  useRealtimeSubscription<Message>({
    table: 'messages',
    filter: householdId ? `household_id=eq.${householdId}` : undefined,
    onInsert: (msg) => {
      if (msg.role === 'assistant' && profile && !msg.read_by?.includes(profile.id)) {
        setCount((prev) => prev + 1)
      }
    },
    enabled: !!householdId,
  })

  const resetCount = () => setCount(0)

  return { unreadCount: count, resetCount }
}
