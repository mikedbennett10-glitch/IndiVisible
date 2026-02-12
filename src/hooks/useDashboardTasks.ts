import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { format, subDays } from 'date-fns'
import type { Task } from '@/types'

interface DashboardData {
  overdueTasks: Task[]
  criticalTasks: Task[]
  todayTasks: Task[]
  upcomingTasks: Task[]
  recentlyCompleted: Task[]
  workloadBalance: { userId: string; count: number }[]
}

export function useDashboardTasks() {
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardData>({
    overdueTasks: [],
    criticalTasks: [],
    todayTasks: [],
    upcomingTasks: [],
    recentlyCompleted: [],
    workloadBalance: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const householdId = profile?.household_id

  const fetchAll = useCallback(async () => {
    if (!householdId) return

    const today = format(new Date(), 'yyyy-MM-dd')
    const weekFromNow = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    const twoDaysAgo = subDays(new Date(), 2).toISOString()

    // Get all lists for this household first
    const { data: lists } = await supabase
      .from('lists')
      .select('id')
      .eq('household_id', householdId)

    if (!lists || lists.length === 0) {
      setData({
        overdueTasks: [],
        criticalTasks: [],
        todayTasks: [],
        upcomingTasks: [],
        recentlyCompleted: [],
        workloadBalance: [],
      })
      setLoading(false)
      return
    }

    const listIds = lists.map((l) => l.id)

    const [overdueRes, criticalRes, todayRes, upcomingRes, recentRes, allIncompleteRes] =
      await Promise.all([
        // Overdue
        supabase
          .from('tasks')
          .select('*')
          .in('list_id', listIds)
          .neq('status', 'completed')
          .lt('due_date', today)
          .not('due_date', 'is', null)
          .order('due_date', { ascending: true }),
        // Critical priority
        supabase
          .from('tasks')
          .select('*')
          .in('list_id', listIds)
          .neq('status', 'completed')
          .in('priority', ['critical', 'high'])
          .order('priority', { ascending: false }),
        // Today
        supabase
          .from('tasks')
          .select('*')
          .in('list_id', listIds)
          .eq('due_date', today)
          .order('priority', { ascending: false }),
        // Upcoming (next 7 days, excluding today)
        supabase
          .from('tasks')
          .select('*')
          .in('list_id', listIds)
          .neq('status', 'completed')
          .gt('due_date', today)
          .lte('due_date', weekFromNow)
          .order('due_date', { ascending: true }),
        // Recently completed
        supabase
          .from('tasks')
          .select('*')
          .in('list_id', listIds)
          .eq('status', 'completed')
          .gte('completed_at', twoDaysAgo)
          .order('completed_at', { ascending: false })
          .limit(10),
        // All incomplete for workload
        supabase
          .from('tasks')
          .select('assigned_to')
          .in('list_id', listIds)
          .neq('status', 'completed'),
      ])

    // Calculate workload balance
    const workloadMap = new Map<string, number>()
    if (allIncompleteRes.data) {
      for (const task of allIncompleteRes.data) {
        if (task.assigned_to) {
          workloadMap.set(task.assigned_to, (workloadMap.get(task.assigned_to) ?? 0) + 1)
        }
      }
    }

    setData({
      overdueTasks: overdueRes.data ?? [],
      criticalTasks: criticalRes.data ?? [],
      todayTasks: todayRes.data ?? [],
      upcomingTasks: upcomingRes.data ?? [],
      recentlyCompleted: recentRes.data ?? [],
      workloadBalance: Array.from(workloadMap.entries()).map(([userId, count]) => ({
        userId,
        count,
      })),
    })

    const anyError =
      overdueRes.error ?? criticalRes.error ?? todayRes.error ?? upcomingRes.error ?? recentRes.error
    if (anyError) setError(anyError.message)

    setLoading(false)
  }, [householdId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Re-fetch on any task change in the household
  useRealtimeSubscription<Task>({
    table: 'tasks',
    onInsert: () => fetchAll(),
    onUpdate: () => fetchAll(),
    onDelete: () => fetchAll(),
    enabled: !!householdId,
  })

  return { ...data, loading, error, refetch: fetchAll }
}
