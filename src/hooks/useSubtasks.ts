import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Subtask } from '@/types'

export function useSubtasks(taskId: string | undefined) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubtasks = useCallback(async () => {
    if (!taskId) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true })

    setSubtasks(data ?? [])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchSubtasks()
  }, [fetchSubtasks])

  useRealtimeSubscription<Subtask>({
    table: 'subtasks',
    filter: taskId ? `task_id=eq.${taskId}` : undefined,
    onInsert: (s) => setSubtasks((prev) => [...prev, s].sort((a, b) => a.sort_order - b.sort_order)),
    onUpdate: (s) => setSubtasks((prev) => prev.map((x) => (x.id === s.id ? s : x))),
    onDelete: (s) => setSubtasks((prev) => prev.filter((x) => x.id !== s.id)),
    enabled: !!taskId,
  })

  const addSubtask = async (title: string) => {
    if (!taskId) return { error: 'No task' }

    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        task_id: taskId,
        title: title.trim(),
        sort_order: subtasks.length,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    if (data) setSubtasks((prev) => [...prev, data])
    return { error: null }
  }

  const toggleSubtask = async (id: string) => {
    const subtask = subtasks.find((s) => s.id === id)
    if (!subtask) return

    const newCompleted = !subtask.completed
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, completed: newCompleted } : s)))

    const { error } = await supabase
      .from('subtasks')
      .update({ completed: newCompleted })
      .eq('id', id)

    if (error) fetchSubtasks()
  }

  const deleteSubtask = async (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
    await supabase.from('subtasks').delete().eq('id', id)
  }

  const updateSubtaskTitle = async (id: string, title: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)))
    await supabase.from('subtasks').update({ title }).eq('id', id)
  }

  const completedCount = subtasks.filter((s) => s.completed).length
  const totalCount = subtasks.length

  return {
    subtasks,
    loading,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSubtaskTitle,
    completedCount,
    totalCount,
    refetch: fetchSubtasks,
  }
}
