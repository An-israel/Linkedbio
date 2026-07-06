import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { FieldLabel, btnPrimary, inputClass } from '../admin/ui'

export function Login() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError('The backend is not configured.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (authError) {
      setError(authError.message)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  async function handleForgot() {
    if (!supabase || !email) {
      setError('Enter your email first, then tap "Forgot password" again.')
      return
    }
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setNotice(resetError ? resetError.message : 'Password reset email sent — check your inbox.')
  }

  return (
    <div className="min-h-dvh bg-obsidian flex items-center justify-center px-5">
      <div className="w-full max-w-[380px]">
        <RouterLink to="/" className="display text-platinum text-lg block text-center mb-8">
          Lynkit<span className="text-silver">.</span>
        </RouterLink>
        <form onSubmit={handleSubmit} className="bg-graphite border border-steel rounded-[14px] p-7">
          <p className="mono-label">Welcome back</p>
          <h1 className="display text-platinum text-xl mt-2 mb-6">Log in</h1>

          <label className="block mb-4">
            <FieldLabel>Email</FieldLabel>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block mb-2">
            <FieldLabel>Password</FieldLabel>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>

          <button
            type="button"
            onClick={handleForgot}
            className="text-mist text-xs hover:text-silver transition-colors cursor-pointer mb-5"
          >
            Forgot password?
          </button>

          {error && <p className="text-danger text-sm mb-4">{error}</p>}
          {notice && <p className="text-success text-sm mb-4">{notice}</p>}

          <button type="submit" disabled={submitting} className={btnPrimary + ' w-full'}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>

          <p className="text-mist text-xs text-center mt-5">
            New here?{' '}
            <RouterLink to="/signup" className="text-silver hover:text-platinum transition-colors">
              Claim your link
            </RouterLink>
          </p>
        </form>
      </div>
    </div>
  )
}
