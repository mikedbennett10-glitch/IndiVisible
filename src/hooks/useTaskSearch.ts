import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Task } from '@/types'

interface SearchResult {
  task: Task
  listName: string
}

export function useTaskSearch() {
  const { profile } = useAuth()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  const search = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery)

      if (!profile?.household_id || !searchQuery.trim()) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)

      // Get all lists for this household
      const { data: lists } = await supabase
        .from('lists')
        .select('id, name')
        .eq('household_id', profile.household_id)

      if (!lists?.length) {
        setResults([])
        setLoading(false)
        return
      }

      const listIds = lists.map((l) => l.id)
      const listNameMap = new Map(lists.map((l) => [l.id, l.name]))

      // Search tasks by title or description (case-insensitive via ilike)
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .in('list_id', listIds)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('updated_at', { ascending: false })
        .limit(50)

      const searchResults: SearchResult[] = (tasks ?? []).map((task) => ({
        task,
        listName: listNameMap.get(task.list_id) ?? 'Unknown List',
      }))

      setResults(searchResults)
      setLoading(false)
    },
    [profile?.household_id]
  )

  const clear = () => {
    setQuery('')
    setResults([])
  }

  return { results, loading, query, search, clear }
}
