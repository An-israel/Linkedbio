import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { signOut, useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/promotions', label: 'Promotions', end: false },
  { to: '/admin/users', label: 'Users', end: false },
  { to: '/admin/moderation', label: 'Moderation', end: false },
  { to: '/admin/analytics', label: 'Analytics', end: false },
  { to: '/admin/themes', label: 'Themes', end: false },
]

/** Owner-only shell for the platform super-admin. */
export function AdminLayout() {
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-dvh bg-obsidian flex items-center justify-center">
        <p className="mono-label">Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!profile?.is_owner) return <Navigate to="/dashboard" replace />

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-obsidian">
      <header className="border-b border-steel">
        <div className="mx-auto max-w-4xl px-5 h-14 flex items-center justify-between gap-3">
          <NavLink to="/dashboard" className="display text-platinum text-sm shrink-0">
            Lynkit<span className="text-warning">/admin</span>
          </NavLink>
          <nav className="flex items-center gap-4 overflow-x-auto" aria-label="Admin">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `mono-label whitespace-nowrap transition-colors ${
                    isActive ? '' : 'text-mist hover:text-silver'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="mono-label text-mist hover:text-danger transition-colors cursor-pointer whitespace-nowrap"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
