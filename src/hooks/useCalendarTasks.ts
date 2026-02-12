import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import type { Task } from '@/types'

export function useCalendarTasks(year: number, month: number) {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const householdId = profile?.household_id

  const fetchTasks = useCallback(async () => {
    if (!householdId) return

    setError(null)
    const monthDate = new Date(year, month)
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')

    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('id')
      .eq('household_id', householdId)

    if (listsError) {
      setError(listsError.message)
      setLoading(false)
      return
    }

    if (!lists?.length) {
      setTasks([])
      setLoading(false)
      return
    }

    const listIds = lists.map((l) => l.id)

    const { data, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('list_id', listIds)
      .gte('due_date', start)
      .lte('due_date', end)
      .order('due_date', { ascending: true })

    if (tasksError) {
      setError(tasksError.message)
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }, [householdId, year, month])

  useEffect(() => {
    setLoading(true)
    fetchTasks()
  }, [fetchTasks])

  useRealtimeSubscription<Task>({
    table: 'tasks',
    onInsert: () => fetchTasks(),
    onUpdate: () => fetchTasks(),
    onDelete: () => fetchTasks(),
    enabled: !!householdId,
  })

  // Group tasks by date string
  const tasksByDate = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.due_date) continue
    const existing = tasksByDate.get(task.due_date) ?? []
    existing.push(task)
    tasksByDate.set(task.due_date, existing)
  }

  return { tasks, tasksByDate, loading, error, refetch: fetchTasks }
}
