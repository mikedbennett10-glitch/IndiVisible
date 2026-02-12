import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Message } from '@/types'

export function useMessages() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)

  const householdId = profile?.household_id

  const fetchMessages = useCallback(async () => {
    if (!householdId) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
      .limit(200)

    setMessages(data ?? [])
    setLoading(false)
    initialLoadDone.current = true
  }, [householdId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useRealtimeSubscription<Message>({
    table: 'messages',
    filter: householdId ? `household_id=eq.${householdId}` : undefined,
    onInsert: (msg) => setMessages((prev) => [...prev, msg]),
    onDelete: (msg) => setMessages((prev) => prev.filter((m) => m.id !== msg.id)),
    enabled: !!householdId,
  })

  const sendMessage = async (content: string) => {
    if (!profile || !householdId) return { error: 'Not authenticated' }

    const trimmed = content.trim()
    if (!trimmed) return { error: 'Empty message' }

    const { error } = await supabase.from('messages').insert({
      household_id: householdId,
      user_id: profile.id,
      content: trimmed,
    })

    if (error) return { error: error.message }
    return { error: null }
  }

  const deleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) {
      fetchMessages()
      return { error: error.message }
    }
    return { error: null }
  }

  return { messages, loading, sendMessage, deleteMessage, refetch: fetchMessages }
}
