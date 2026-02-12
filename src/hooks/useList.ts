import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { List } from '@/types'

export function useList(listId: string | undefined) {
  const [list, setList] = useState<List | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!listId) {
      setLoading(false)
      return
    }

    async function fetchList() {
      const { data, error: fetchError } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId!)
        .single()

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setList(data)
      }
      setLoading(false)
    }

    fetchList()
  }, [listId])

  return { list, loading, error }
}
