import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { ToastProvider } from './admin/ui'
import { Landing } from './pages/Landing'

// Route-level code splitting: visitors to a bio page never download the
// dashboard/admin bundles, and vice versa.
const PublicProfile = lazy(() => import('./pages/PublicProfile').then((m) => ({ default: m.PublicProfile })))
const Signup = lazy(() => import('./pages/Signup').then((m) => ({ default: m.Signup })))
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const Terms = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })))
const Privacy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })))
const DashboardLayout = lazy(() => import('./dashboard/DashboardLayout').then((m) => ({ default: m.DashboardLayout })))
const MyLinks = lazy(() => import('./dashboard/MyLinks').then((m) => ({ default: m.MyLinks })))
const Appearance = lazy(() => import('./dashboard/Appearance').then((m) => ({ default: m.Appearance })))
const MyAnalytics = lazy(() => import('./dashboard/MyAnalytics').then((m) => ({ default: m.MyAnalytics })))
const Settings = lazy(() => import('./dashboard/Settings').then((m) => ({ default: m.Settings })))
const AdminLayout = lazy(() => import('./admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const Overview = lazy(() => import('./admin/Overview').then((m) => ({ default: m.Overview })))
const Promotions = lazy(() => import('./admin/Promotions').then((m) => ({ default: m.Promotions })))
const Users = lazy(() => import('./admin/Users').then((m) => ({ default: m.Users })))
const Moderation = lazy(() => import('./admin/Moderation').then((m) => ({ default: m.Moderation })))
const PlatformAnalytics = lazy(() => import('./admin/PlatformAnalytics').then((m) => ({ default: m.PlatformAnalytics })))
const ThemesAdmin = lazy(() => import('./admin/ThemesAdmin').then((m) => ({ default: m.ThemesAdmin })))

function Fallback() {
  return (
    <div className="min-h-dvh bg-obsidian flex items-center justify-center">
      <p className="mono-label">Loading…</p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<MyLinks />} />
              <Route path="appearance" element={<Appearance />} />
              <Route path="analytics" element={<MyAnalytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="users" element={<Users />} />
              <Route path="moderation" element={<Moderation />} />
              <Route path="analytics" element={<PlatformAnalytics />} />
              <Route path="themes" element={<ThemesAdmin />} />
            </Route>
            {/* Must stay last so reserved routes always win. */}
            <Route path="/:username" element={<PublicProfile />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
)
