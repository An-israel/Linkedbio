import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { FieldLabel, btnPrimary, inputClass } from './ui'

export function Login() {
  const { session, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
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
    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-obsidian flex items-center justify-center px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[360px] bg-graphite border border-steel rounded-[14px] p-7"
      >
        <p className="mono-label">Admin access</p>
        <h1 className="display text-platinum text-xl mt-2 mb-6">Sign in</h1>

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

        <label className="block mb-6">
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

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        <button type="submit" disabled={submitting} className={btnPrimary + ' w-full'}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
