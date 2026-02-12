import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Reminder, ReminderInsert } from '@/types'

export function useReminders(taskId: string | undefined) {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReminders = useCallback(async () => {
    if (!taskId || !user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true })

    setReminders(data ?? [])
    setLoading(false)
  }, [taskId, user])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  const addReminder = async (remindAt: string, type: 'push' | 'email' | 'in_app' = 'in_app') => {
    if (!taskId || !user) return { error: 'Not authenticated' }

    const newReminder: ReminderInsert = {
      task_id: taskId,
      user_id: user.id,
      remind_at: remindAt,
      type,
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert(newReminder)
      .select()
      .single()

    if (error) return { error: error.message }
    if (data) setReminders((prev) => [...prev, data].sort((a, b) => a.remind_at.localeCompare(b.remind_at)))

    return { error: null }
  }

  const deleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id))

    const { error } = await supabase.from('reminders').delete().eq('id', id)
    if (error) {
      fetchReminders()
      return { error: error.message }
    }

    return { error: null }
  }

  return { reminders, loading, addReminder, deleteReminder, refetch: fetchReminders }
}
