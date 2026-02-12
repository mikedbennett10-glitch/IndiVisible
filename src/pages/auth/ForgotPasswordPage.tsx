import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
    setSubmitting(false)
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <Mail size={48} className="mx-auto text-primary-500 mb-4" />
          <h2 className="text-xl font-semibold text-warm-900 mb-2">Check your email</h2>
          <p className="text-sm text-warm-500 mb-6">
            We sent a password reset link to <strong className="text-warm-700">{email}</strong>.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-warm-900 mb-2">Reset your password</h2>
      <p className="text-sm text-warm-500 mb-6">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-warm-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
          Send Reset Link
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-warm-500">
        Remember your password?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
