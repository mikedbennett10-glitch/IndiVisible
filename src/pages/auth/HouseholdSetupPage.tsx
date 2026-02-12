import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Home, Users, Loader2 } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'create' | 'join'

export function HouseholdSetupPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('create')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setSubmitting(true)

    const { data: household, error: createError } = await supabase
      .from('households')
      .insert({ name: householdName })
      .select()
      .single()

    if (createError || !household) {
      setError(createError?.message ?? 'Failed to create household')
      setSubmitting(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ household_id: household.id })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    // Log the join
    await supabase.from('activity_log').insert({
      household_id: household.id,
      user_id: user.id,
      action: 'member_joined' as const,
      details: { role: 'creator' },
    })

    await refreshProfile()
    setSubmitting(false)
    navigate('/')
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    setSubmitting(true)

    const { data: household, error: lookupError } = await supabase
      .from('households')
      .select('*')
      .eq('invite_code', inviteCode.trim().toLowerCase())
      .single()

    if (lookupError || !household) {
      setError('Invalid invite code. Please check and try again.')
      setSubmitting(false)
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ household_id: household.id })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    await supabase.from('activity_log').insert({
      household_id: household.id,
      user_id: user.id,
      action: 'member_joined' as const,
      details: { role: 'member' },
    })

    await refreshProfile()
    setSubmitting(false)
    navigate('/')
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-warm-900 mb-2">Set up your household</h2>
      <p className="text-sm text-warm-500 mb-6">
        Create a new household or join your partner&apos;s with an invite code.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex rounded-lg bg-warm-100 p-1 mb-6">
        <button
          onClick={() => setTab('create')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'create'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-warm-500 hover:text-warm-700'
          )}
        >
          <Home size={16} />
          Create New
        </button>
        <button
          onClick={() => setTab('join')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'join'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-warm-500 hover:text-warm-700'
          )}
        >
          <Users size={16} />
          Join Existing
        </button>
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="household-name" className="block text-sm font-medium text-warm-700 mb-1">
              Household Name
            </label>
            <input
              id="household-name"
              type="text"
              required
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
              placeholder="e.g. The Smith Household"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Home size={18} />}
            Create Household
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="invite-code" className="block text-sm font-medium text-warm-700 mb-1">
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow font-mono tracking-wider text-center text-lg"
              placeholder="Enter code"
              maxLength={8}
            />
            <p className="mt-1.5 text-xs text-warm-400">
              Ask your partner for the 8-character invite code from their Settings page.
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
            Join Household
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
