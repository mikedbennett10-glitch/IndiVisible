import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { UserPlus, Loader2, Mail } from 'lucide-react'

export function SignupPage() {
  const { user, signUp } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showCheckEmail, setShowCheckEmail] = useState(false)

  if (user) return <Navigate to="/" replace />

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
    const { error: authError } = await signUp(email, password, displayName)
    if (authError) {
      setError(authError.message)
    } else {
      setShowCheckEmail(true)
    }
    setSubmitting(false)
  }

  if (showCheckEmail) {
    return (
      <AuthLayout>
        <div className="text-center">
          <Mail size={48} className="mx-auto text-primary-500 mb-4" />
          <h2 className="text-xl font-semibold text-warm-900 mb-2">Check your email</h2>
          <p className="text-sm text-warm-500 mb-6">
            We sent a verification link to <strong className="text-warm-700">{email}</strong>.
            Click the link to activate your account.
          </p>
          <p className="text-xs text-warm-400">
            Didn&apos;t receive it? Check your spam folder, or{' '}
            <button
              onClick={() => setShowCheckEmail(false)}
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              try again
            </button>
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-warm-500">
          Already verified?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-warm-900 mb-6">Create your account</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-warm-700 mb-1">
            Display Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            placeholder="Your name"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-warm-700 mb-1">
            Password
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
            Confirm Password
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
            placeholder="Confirm password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <UserPlus size={18} />
          )}
          Create Account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-warm-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
