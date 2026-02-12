import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Task, TaskInsert, TaskUpdate } from '@/types'

export type TaskFilter = 'all' | 'mine' | 'theirs' | 'unassigned' | 'shared'
export type TaskSort = 'sort_order' | 'due_date' | 'priority' | 'created_at'

interface UseTasksOptions {
  listId: string
  filter?: TaskFilter
  sort?: TaskSort
}

export function useTasks({ listId, filter = 'all', sort = 'sort_order' }: UseTasksOptions) {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    if (!listId) return

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('list_id', listId)

    if (sort === 'due_date') {
      query = query.order('due_date', { ascending: true, nullsFirst: false })
    } else if (sort === 'priority') {
      query = query.order('priority', { ascending: false })
    } else if (sort === 'created_at') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('sort_order', { ascending: true })
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }, [listId, sort])

  useEffect(() => {
    setLoading(true)
    fetchTasks()
  }, [fetchTasks])

  useRealtimeSubscription<Task>({
    table: 'tasks',
    filter: `list_id=eq.${listId}`,
    onInsert: (task) => setTasks((prev) => [...prev, task]),
    onUpdate: (task) => setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t))),
    onDelete: (task) => setTasks((prev) => prev.filter((t) => t.id !== task.id)),
    enabled: !!listId,
  })

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'mine') return task.assigned_to === profile?.id
    if (filter === 'theirs') return task.assigned_to !== null && task.assigned_to !== profile?.id
    if (filter === 'unassigned') return task.assigned_to === null && !task.shared_responsibility
    if (filter === 'shared') return task.shared_responsibility
    return true
  })

  const createTask = async (data: Omit<TaskInsert, 'list_id' | 'created_by'>) => {
    if (!profile) return { error: 'Not authenticated' }

    const newTask: TaskInsert = {
      ...data,
      list_id: listId,
      created_by: profile.id,
      sort_order: tasks.length,
    }

    const { data: created, error: createError } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single()

    if (createError) return { error: createError.message }

    if (created && profile.household_id) {
      await supabase.from('activity_log').insert({
        household_id: profile.household_id,
        task_id: created.id,
        list_id: listId,
        user_id: profile.id,
        action: 'task_created' as const,
        details: { title: created.title },
      })
    }

    return { error: null, data: created }
  }

  const updateTask = async (id: string, data: TaskUpdate) => {
    const prev = tasks.find((t) => t.id === id)
    if (prev) {
      setTasks((current) => current.map((t) => (t.id === id ? { ...t, ...data } : t)))
    }

    const { error: updateError } = await supabase.from('tasks').update(data).eq('id', id)

    if (updateError) {
      if (prev) setTasks((current) => current.map((t) => (t.id === id ? prev : t)))
      return { error: updateError.message }
    }

    if (profile?.household_id) {
      await supabase.from('activity_log').insert({
        household_id: profile.household_id,
        task_id: id,
        list_id: listId,
        user_id: profile.id,
        action: 'task_updated' as const,
        details: data,
      })
    }

    return { error: null }
  }

  const toggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task || !profile) return { error: 'Task not found' }

    const isCompleting = task.status !== 'completed'
    const update: TaskUpdate = isCompleting
      ? { status: 'completed', completed_by: profile.id, completed_at: new Date().toISOString() }
      : { status: 'pending', completed_by: null, completed_at: null }

    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, ...update } : t))
    )

    const { error: updateError } = await supabase.from('tasks').update(update).eq('id', id)

    if (updateError) {
      setTasks((current) => current.map((t) => (t.id === id ? task : t)))
      return { error: updateError.message }
    }

    if (profile.household_id) {
      await supabase.from('activity_log').insert({
        household_id: profile.household_id,
        task_id: id,
        list_id: listId,
        user_id: profile.id,
        action: isCompleting ? ('task_completed' as const) : ('task_uncompleted' as const),
        details: { title: task.title },
      })
    }

    return { error: null }
  }

  const deleteTask = async (id: string) => {
    const prev = tasks.find((t) => t.id === id)
    setTasks((current) => current.filter((t) => t.id !== id))

    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id)

    if (deleteError) {
      if (prev) setTasks((current) => [...current, prev])
      return { error: deleteError.message }
    }

    if (profile?.household_id) {
      await supabase.from('activity_log').insert({
        household_id: profile.household_id,
        task_id: id,
        list_id: listId,
        user_id: profile.id,
        action: 'task_deleted' as const,
        details: { title: prev?.title },
      })
    }

    return { error: null }
  }

  const reorderTasks = async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({ id, sort_order: index }))

    setTasks((current) =>
      current
        .map((t) => {
          const update = updates.find((u) => u.id === t.id)
          return update ? { ...t, sort_order: update.sort_order } : t
        })
        .sort((a, b) => a.sort_order - b.sort_order)
    )

    for (const { id, sort_order } of updates) {
      await supabase.from('tasks').update({ sort_order }).eq('id', id)
    }
  }

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    error,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
    reorderTasks,
    refetch: fetchTasks,
  }
}
