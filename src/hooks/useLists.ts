import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { List, ListInsert, ListUpdate } from '@/types'

export function useLists() {
  const { profile } = useAuth()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const householdId = profile?.household_id

  const fetchLists = useCallback(async () => {
    if (!householdId) return

    const { data, error: fetchError } = await supabase
      .from('lists')
      .select('*')
      .eq('household_id', householdId)
      .order('sort_order', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setLists(data ?? [])
    }
    setLoading(false)
  }, [householdId])

  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  useRealtimeSubscription<List>({
    table: 'lists',
    filter: householdId ? `household_id=eq.${householdId}` : undefined,
    onInsert: (list) => setLists((prev) => [...prev, list].sort((a, b) => a.sort_order - b.sort_order)),
    onUpdate: (list) => setLists((prev) => prev.map((l) => (l.id === list.id ? list : l))),
    onDelete: (list) => setLists((prev) => prev.filter((l) => l.id !== list.id)),
    enabled: !!householdId,
  })

  const createList = async (data: Omit<ListInsert, 'household_id' | 'created_by'>) => {
    if (!householdId || !profile) return { error: 'No household' }

    const newList: ListInsert = {
      ...data,
      household_id: householdId,
      created_by: profile.id,
      sort_order: lists.length,
    }

    const { data: created, error: createError } = await supabase
      .from('lists')
      .insert(newList)
      .select()
      .single()

    if (createError) return { error: createError.message }

    if (created) {
      await supabase.from('activity_log').insert({
        household_id: householdId,
        list_id: created.id,
        user_id: profile.id,
        action: 'list_created' as const,
        details: { name: created.name },
      })
    }

    return { error: null }
  }

  const updateList = async (id: string, data: ListUpdate) => {
    const prev = lists.find((l) => l.id === id)
    if (prev) {
      setLists((current) => current.map((l) => (l.id === id ? { ...l, ...data } : l)))
    }

    const { error: updateError } = await supabase.from('lists').update(data).eq('id', id)

    if (updateError) {
      if (prev) setLists((current) => current.map((l) => (l.id === id ? prev : l)))
      return { error: updateError.message }
    }

    if (profile && householdId) {
      await supabase.from('activity_log').insert({
        household_id: householdId,
        list_id: id,
        user_id: profile.id,
        action: 'list_updated' as const,
        details: data,
      })
    }

    return { error: null }
  }

  const deleteList = async (id: string) => {
    const prev = lists.find((l) => l.id === id)
    setLists((current) => current.filter((l) => l.id !== id))

    const { error: deleteError } = await supabase.from('lists').delete().eq('id', id)

    if (deleteError) {
      if (prev) setLists((current) => [...current, prev].sort((a, b) => a.sort_order - b.sort_order))
      return { error: deleteError.message }
    }

    if (profile && householdId) {
      await supabase.from('activity_log').insert({
        household_id: householdId,
        list_id: id,
        user_id: profile.id,
        action: 'list_deleted' as const,
        details: { name: prev?.name },
      })
    }

    return { error: null }
  }

  return { lists, loading, error, createList, updateList, deleteList, refetch: fetchLists }
}
