import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { signOut, useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/admin', label: 'Links', end: true },
  { to: '/admin/appearance', label: 'Appearance', end: false },
  { to: '/admin/analytics', label: 'Analytics', end: false },
]

/** Guard + shell for all /admin routes. */
export function AdminLayout() {
  const { session, isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-dvh bg-obsidian flex items-center justify-center">
        <p className="mono-label">Loading…</p>
      </div>
    )
  }

  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />

  async function handleLogout() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-obsidian">
      <header className="border-b border-steel">
        <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between">
          <NavLink to="/" className="display text-platinum text-sm">
            AI<span className="text-mist">/</span>ADMIN
          </NavLink>
          <nav className="flex items-center gap-5" aria-label="Admin">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `mono-label transition-colors ${isActive ? '' : 'text-mist hover:text-silver'}`
                }
              >
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="mono-label text-mist hover:text-danger transition-colors cursor-pointer"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
