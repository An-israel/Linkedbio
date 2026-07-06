import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { signOut, useAuth } from '../hooks/useAuth'
import { PromoBannerSlot, PromoPopupHost } from '../components/promos'
import { ArrowUpRightIcon } from '../components/icons'

const NAV = [
  { to: '/dashboard', label: 'My Links', end: true },
  { to: '/dashboard/appearance', label: 'Appearance', end: false },
  { to: '/dashboard/analytics', label: 'Analytics', end: false },
  { to: '/dashboard/settings', label: 'Settings', end: false },
]

/** Auth-gated shell for the user's own control panel. */
export function DashboardLayout() {
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

  if (!profile || profile.status === 'suspended') {
    return (
      <div className="min-h-dvh bg-obsidian flex flex-col items-center justify-center px-5 text-center">
        <h1 className="display text-platinum text-xl">
          {profile ? 'Account suspended' : 'Profile missing'}
        </h1>
        <p className="text-mist text-sm mt-2 max-w-[40ch]">
          {profile
            ? 'This account was suspended for violating the terms. Contact support if you believe this is a mistake.'
            : 'Your account exists but has no profile. Contact support.'}
        </p>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            navigate('/login', { replace: true })
          }}
          className="mono-label text-mist hover:text-danger transition-colors cursor-pointer mt-6"
        >
          Logout
        </button>
      </div>
    )
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-obsidian">
      <header className="border-b border-steel">
        <div className="mx-auto max-w-3xl px-5 h-14 flex items-center justify-between gap-3">
          <NavLink to="/" className="display text-platinum text-sm shrink-0">
            Lynkit<span className="text-silver">.</span>
          </NavLink>
          <nav className="flex items-center gap-4 overflow-x-auto" aria-label="Dashboard">
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
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mono-label text-mist hover:text-silver transition-colors whitespace-nowrap inline-flex items-center gap-1"
            >
              View my page <ArrowUpRightIcon className="h-3 w-3" />
            </a>
            {profile.is_owner && (
              <NavLink
                to="/admin"
                className="mono-label text-warning hover:text-platinum transition-colors whitespace-nowrap"
              >
                Admin
              </NavLink>
            )}
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

      <main className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-6">
          <PromoBannerSlot placement="dashboard_top" dismissible />
        </div>
        <Outlet context={{ profile }} />
      </main>

      <PromoPopupHost surface="dashboard" />
    </div>
  )
}
