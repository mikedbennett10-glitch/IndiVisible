import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

const CHECK_INTERVAL = 60_000 // Check every minute

/**
 * Polls for reminders that have fired (remind_at <= now, sent = false)
 * and creates in-app notifications for them.
 */
export function useReminderChecker() {
  const { user } = useAuth()
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    if (!user) return

    async function checkReminders() {
      const now = new Date().toISOString()

      // Find unfired reminders that are past due
      const { data: firedReminders } = await supabase
        .from('reminders')
        .select('*, tasks(title)')
        .eq('user_id', user!.id)
        .eq('sent', false)
        .eq('type', 'in_app')
        .lte('remind_at', now)

      if (!firedReminders?.length) return

      // Create notifications and mark reminders as sent
      for (const reminder of firedReminders) {
        const taskTitle = (reminder as Record<string, unknown>).tasks
          ? ((reminder as Record<string, unknown>).tasks as { title: string }).title
          : 'a task'

        await supabase.from('notifications').insert({
          user_id: user!.id,
          type: 'reminder',
          title: 'Reminder',
          body: `Reminder for: ${taskTitle}`,
          task_id: reminder.task_id,
        })

        await supabase
          .from('reminders')
          .update({ sent: true })
          .eq('id', reminder.id)
      }
    }

    // Check immediately, then on interval
    checkReminders()
    intervalRef.current = setInterval(checkReminders, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user])
}
