import type { Dispatch, SetStateAction } from 'react'

interface OptimisticOptions<T> {
  setState: Dispatch<SetStateAction<T[]>>
  apply: (prev: T[]) => T[]
  rollback: (prev: T[]) => T[]
  action: () => Promise<{ error: string | null }>
}

export async function withOptimistic<T>({
  setState,
  apply,
  rollback,
  action,
}: OptimisticOptions<T>): Promise<{ error: string | null }> {
  setState(apply)

  const { error } = await action()

  if (error) {
    setState(rollback)
    return { error }
  }

  return { error: null }
}
