import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Task, TaskUpdate } from '@/types'

export function useTask(taskId: string | undefined) {
  const { profile } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTask(data)
    }
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  const updateTask = async (data: TaskUpdate) => {
    if (!task || !taskId) return { error: 'No task' }

    const prev = { ...task }
    setTask((current) => (current ? { ...current, ...data } : current))

    const { error: updateError } = await supabase.from('tasks').update(data).eq('id', taskId)

    if (updateError) {
      setTask(prev)
      return { error: updateError.message }
    }

    if (profile?.household_id) {
      await supabase.from('activity_log').insert({
        household_id: profile.household_id,
        task_id: taskId,
        list_id: task.list_id,
        user_id: profile.id,
        action: 'task_updated' as const,
        details: data,
      })
    }

    return { error: null }
  }

  const toggleComplete = async () => {
    if (!task || !profile) return { error: 'No task' }

    const isCompleting = task.status !== 'completed'
    const update: TaskUpdate = isCompleting
      ? { status: 'completed', completed_by: profile.id, completed_at: new Date().toISOString() }
      : { status: 'pending', completed_by: null, completed_at: null }

    const prev = { ...task }
    setTask((current) => (current ? { ...current, ...update } : current))

    const { error: updateError } = await supabase.from('tasks').update(update).eq('id', task.id)

    if (updateError) {
      setTask(prev)
      return { error: updateError.message }
    }

    if (profile.household_id) {
      await supabase.from('activity_log').insert({
        household_id: profile.household_id,
        task_id: task.id,
        list_id: task.list_id,
        user_id: profile.id,
        action: isCompleting ? ('task_completed' as const) : ('task_uncompleted' as const),
        details: { title: task.title },
      })
    }

    return { error: null }
  }

  const deleteTask = async () => {
    if (!task) return { error: 'No task' }

    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', task.id)
    if (deleteError) return { error: deleteError.message }

    if (profile?.household_id) {
      await supabase.from('activity_log').insert({
        household_id: profile.household_id,
        task_id: task.id,
        list_id: task.list_id,
        user_id: profile.id,
        action: 'task_deleted' as const,
        details: { title: task.title },
      })
    }

    return { error: null }
  }

  return { task, loading, error, updateTask, toggleComplete, deleteTask, refetch: fetchTask }
}
