import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validateUsername } from '../lib/validation'
import { FieldLabel, btnPrimary, inputClass } from '../admin/ui'

type Availability = 'idle' | 'checking' | 'available' | 'taken'

export function Signup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [username, setUsername] = useState(params.get('u') ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [availability, setAvailability] = useState<Availability>('idle')
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  const clean = username.trim().toLowerCase()

  // live availability check, debounced
  useEffect(() => {
    clearTimeout(debounce.current)
    if (!clean) {
      setUsernameError(null)
      setAvailability('idle')
      return
    }
    const localError = validateUsername(clean)
    if (localError) {
      setUsernameError(localError)
      setAvailability('idle')
      return
    }
    setUsernameError(null)
    if (!supabase) return
    setAvailability('checking')
    debounce.current = setTimeout(async () => {
      const { data, error: rpcError } = await supabase!.rpc('check_username', {
        p_username: clean,
      })
      if (rpcError) {
        setAvailability('idle')
        return
      }
      if (data) {
        setUsernameError(data as string)
        setAvailability('taken')
      } else {
        setAvailability('available')
      }
    }, 400)
    return () => clearTimeout(debounce.current)
  }, [clean])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setError('The backend is not configured.')
      return
    }
    const localError = validateUsername(clean)
    if (localError) {
      setUsernameError(localError)
      return
    }
    setSubmitting(true)
    setError(null)

    const { data: check } = await supabase.rpc('check_username', { p_username: clean })
    if (check) {
      setUsernameError(check as string)
      setSubmitting(false)
      return
    }

    // The profile row is created server-side by an auth trigger reading
    // this username from the signup metadata — the client never inserts it,
    // so email-confirmation flows (no session yet) work too.
    const { data: auth, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: clean },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    setSubmitting(false)
    if (signUpError || !auth.user) {
      setError(signUpError?.message ?? 'Sign up failed.')
      return
    }
    if (!auth.session) {
      // Email confirmation is on: no session until they click the link.
      setConfirmSent(true)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  if (confirmSent) {
    return (
      <div className="min-h-dvh bg-obsidian flex items-center justify-center px-5">
        <div className="w-full max-w-[400px] bg-graphite border border-steel rounded-[14px] p-7 text-center">
          <p className="mono-label">One more step</p>
          <h1 className="display text-platinum text-xl mt-2">Confirm your email</h1>
          <p className="text-mist text-sm mt-3 leading-relaxed">
            We sent a confirmation link to <span className="text-platinum">{email}</span>.
            Click it, then log in — <span className="text-platinum">lynkit.link/{clean}</span>{' '}
            is reserved for you.
          </p>
          <RouterLink
            to="/login"
            className="mt-6 inline-flex items-center justify-center min-h-10 px-5 rounded-[10px] bg-steel border border-silver/60 text-white text-sm font-medium hover:border-silver transition-colors"
          >
            Go to login
          </RouterLink>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-obsidian flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <RouterLink to="/" className="display text-platinum text-lg block text-center mb-8">
          Lynkit<span className="text-silver">.</span>
        </RouterLink>
        <form
          onSubmit={handleSubmit}
          className="bg-graphite border border-steel rounded-[14px] p-7"
        >
          <p className="mono-label">Create your page</p>
          <h1 className="display text-platinum text-xl mt-2 mb-6">Claim your link</h1>

          <label className="block mb-1.5">
            <FieldLabel>Username</FieldLabel>
            <div
              className={`flex items-center bg-obsidian border rounded-[8px] px-3 transition-colors focus-within:border-silver ${
                usernameError ? 'border-danger' : 'border-steel'
              }`}
            >
              <span className="text-mist text-sm shrink-0 select-none">lynkit.link/</span>
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                aria-invalid={usernameError ? true : undefined}
                className="w-full bg-transparent border-0 outline-none text-platinum text-sm py-2.5 min-w-0"
              />
            </div>
          </label>
          <p className="text-xs min-h-5 mb-3">
            {usernameError ? (
              <span className="text-danger">{usernameError}</span>
            ) : availability === 'available' ? (
              <span className="text-success">lynkit.link/{clean} is available</span>
            ) : availability === 'checking' ? (
              <span className="text-mist">Checking…</span>
            ) : null}
          </p>

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
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <span className="block text-mist text-xs mt-1.5">At least 8 characters.</span>
          </label>

          {error && <p className="text-danger text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={submitting || Boolean(usernameError)}
            className={btnPrimary + ' w-full'}
          >
            {submitting ? 'Creating…' : 'Create my page'}
          </button>

          <p className="text-mist text-xs text-center mt-5">
            Already have a page?{' '}
            <RouterLink to="/login" className="text-silver hover:text-platinum transition-colors">
              Log in
            </RouterLink>
          </p>
        </form>
        <p className="text-mist/70 text-[11px] text-center mt-4 leading-relaxed">
          By creating a page you agree to the{' '}
          <RouterLink to="/terms" className="underline hover:text-silver">Terms</RouterLink> and{' '}
          <RouterLink to="/privacy" className="underline hover:text-silver">Privacy Policy</RouterLink>.
        </p>
      </div>
    </div>
  )
}
