import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivityLog, Profile } from '@/types'

interface ActivityWithProfile extends ActivityLog {
  profiles: Pick<Profile, 'display_name' | 'avatar_color'> | null
}

export function useActivityLog(options: { taskId?: string; limit?: number } = {}) {
  const { taskId, limit = 20 } = options
  const [activities, setActivities] = useState<ActivityWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      let query = supabase
        .from('activity_log')
        .select('*, profiles(display_name, avatar_color)')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (taskId) {
        query = query.eq('task_id', taskId)
      }

      const { data } = await query
      setActivities((data as ActivityWithProfile[] | null) ?? [])
      setLoading(false)
    }

    fetchActivity()
  }, [taskId, limit])

  return { activities, loading }
}
