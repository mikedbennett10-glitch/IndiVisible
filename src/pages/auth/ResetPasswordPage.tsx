import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { supabase } from '@/lib/supabase'
import { Lock, Loader2, CheckCircle } from 'lucide-react'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Check if we already have a session (event may have fired before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <CheckCircle size={48} className="mx-auto text-success-500 mb-4" />
          <h2 className="text-xl font-semibold text-warm-900 mb-2">Password updated!</h2>
          <p className="text-sm text-warm-500">Redirecting you to the dashboard...</p>
        </div>
      </AuthLayout>
    )
  }

  if (!ready) {
    return (
      <AuthLayout>
        <div className="text-center">
          <Loader2 size={32} className="mx-auto text-primary-500 animate-spin mb-4" />
          <p className="text-sm text-warm-500">Verifying reset link...</p>
          <p className="mt-4 text-xs text-warm-400">
            If this takes too long, the link may have expired.{' '}
            <Link to="/forgot-password" className="text-primary-600 font-medium hover:text-primary-700">
              Request a new one
            </Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-warm-900 mb-2">Set new password</h2>
      <p className="text-sm text-warm-500 mb-6">Enter your new password below.</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-warm-700 mb-1">
            New Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-warm-700 mb-1">
            Confirm New Password
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            placeholder="Confirm new password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
          Update Password
        </button>
      </form>
    </AuthLayout>
  )
}
