import { useCallback, useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Message } from '@/types'

function detectAssistantIntent(content: string): boolean {
  const lower = content.toLowerCase()
  // Explicit mentions
  if (lower.includes('@assistant') || lower.includes('@ai') || lower.includes('@indi')) return true
  if (lower.startsWith('hey indi') || lower.startsWith('indi,') || lower.startsWith('indi ')) return true
  // Command prefix
  if (lower.startsWith('/')) return true
  // Task-management keywords
  const keywords = [
    'create task', 'add task', 'new task', 'remind me', 'set a reminder',
    'what tasks', 'my tasks', 'what\'s on my', 'what\'s due', 'whats due',
    'overdue', 'assign', 'mark complete', 'mark done', 'task list',
    'schedule', 'help me with', 'add to list', 'add to the',
    'what do i have', 'what do we have', 'today\'s tasks', 'this week',
  ]
  return keywords.some((kw) => lower.includes(kw))
}

async function invokeAssistant(householdId: string, userId: string, content: string) {
  const { data: { session } } = await supabase.auth.getSession()

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const response = await fetch(
    `${supabaseUrl}/functions/v1/chat-respond`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({
        household_id: householdId,
        user_id: userId,
        message_content: content,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Assistant responded with ${response.status}`)
  }
}

export function useMessages() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [assistantTyping, setAssistantTyping] = useState(false)
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
    onInsert: (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.role === 'assistant') {
        setAssistantTyping(false)
      }
    },
    onDelete: (msg) => setMessages((prev) => prev.filter((m) => m.id !== msg.id)),
    enabled: !!householdId,
  })

  const sendMessage = async (content: string) => {
    if (!profile || !householdId) return { error: 'Not authenticated' }

    const trimmed = content.trim()
    if (!trimmed) return { error: 'Empty message' }

    const { data: inserted, error } = await supabase.from('messages').insert({
      household_id: householdId,
      user_id: profile.id,
      role: 'user',
      content: trimmed,
    }).select().single()

    if (error) return { error: error.message }

    // Optimistic: add message to state immediately (don't wait for realtime)
    if (inserted) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === inserted.id)) return prev
        return [...prev, inserted]
      })
    }

    // Check if this message should invoke the assistant
    if (detectAssistantIntent(trimmed)) {
      setAssistantTyping(true)
      invokeAssistant(householdId, profile.id, trimmed).catch((err) => {
        console.error('Assistant error:', err)
        setAssistantTyping(false)
      })
    }

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

  // Count unread assistant messages for badge
  const unreadAssistantCount = messages.filter(
    (m) => m.role === 'assistant' && profile && !m.read_by?.includes(profile.id)
  ).length

  const markAssistantRead = useCallback(async () => {
    if (!profile) return
    const unread = messages.filter(
      (m) => m.role === 'assistant' && !m.read_by?.includes(profile.id)
    )
    for (const msg of unread) {
      const newReadBy = [...(msg.read_by ?? []), profile.id]
      await supabase.from('messages').update({ read_by: newReadBy }).eq('id', msg.id)
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, read_by: newReadBy } : m))
      )
    }
  }, [messages, profile])

  return {
    messages,
    loading,
    sendMessage,
    deleteMessage,
    assistantTyping,
    unreadAssistantCount,
    markAssistantRead,
    refetch: fetchMessages,
  }
}
