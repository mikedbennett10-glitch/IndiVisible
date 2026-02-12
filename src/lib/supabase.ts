import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env.local and fill in your Supabase credentials.'
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authOptions: any = {
  // Bypass navigator.locks which deadlocks in React StrictMode
  lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => await fn(),
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
})
