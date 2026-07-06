import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Link, Profile, Socials, ThemeConfig } from '../lib/types'
import {
  avatarRadius,
  backgroundStyle,
  buttonRadius,
  ensureFonts,
  resolveTheme,
} from '../lib/themes'
import { registerLinkClick, registerPageView, submitReport } from '../lib/analytics'
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from '../components/icons'

/* ------------------------------------------------------------------
 * Themed building blocks. Everything is driven by the theme config —
 * no app-chrome tokens may leak in here.
 * ------------------------------------------------------------------ */

function themedButtonStyle(theme: ThemeConfig, featured: boolean): React.CSSProperties {
  const { button, text_color, accent_color } = theme
  const base: React.CSSProperties = {
    borderRadius: buttonRadius(button.shape),
    color: button.style === 'outline' ? text_color : button.text,
    fontFamily: theme.font.body,
  }
  switch (button.style) {
    case 'solid':
      base.backgroundColor = button.fill
      base.border = `1px solid ${featured ? accent_color : 'transparent'}`
      break
    case 'outline':
      base.backgroundColor = 'transparent'
      base.border = `1.5px solid ${featured ? accent_color : text_color + '55'}`
      break
    case 'soft':
      base.backgroundColor = button.fill
      base.border = `1px solid ${featured ? accent_color : text_color + '22'}`
      break
    case 'glass':
      base.backgroundColor = button.fill
      base.border = `1px solid ${featured ? accent_color : '#FFFFFF33'}`
      base.backdropFilter = 'blur(10px)'
      break
  }
  if (featured) base.boxShadow = `0 0 0 1px ${accent_color}44`
  return base
}

function ThemedLinkButton({
  link,
  theme,
  onOpen,
}: {
  link: Link
  theme: ThemeConfig
  onOpen: (l: Link) => void
}) {
  const hasPopup = Boolean(link.description)

  function handleClick() {
    if (hasPopup) {
      onOpen(link)
      return
    }
    registerLinkClick(link.id)
    if (link.open_new_tab) window.open(link.url, '_blank', 'noopener,noreferrer')
    else window.location.href = link.url
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-haspopup={hasPopup ? 'dialog' : undefined}
      className="w-full min-h-14 px-4 py-3 flex items-center gap-3 text-left transition-transform duration-150 motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.99] cursor-pointer"
      style={themedButtonStyle(theme, link.featured)}
    >
      {link.icon && (
        <span className="text-lg shrink-0" aria-hidden="true">
          {link.icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        {link.category && (
          <span
            className="block text-[10px] uppercase tracking-[0.12em] mb-0.5"
            style={{ color: theme.accent_color, fontFamily: theme.font.body }}
          >
            {link.category}
          </span>
        )}
        <span
          className="block text-[15px] font-semibold truncate"
          style={{ fontFamily: theme.font.heading }}
        >
          {link.title}
        </span>
        {link.subtitle && (
          <span className="block text-xs mt-0.5 truncate opacity-70">{link.subtitle}</span>
        )}
      </span>
      <span className="shrink-0 opacity-60" aria-hidden="true">
        {hasPopup ? <ChevronDownIcon className="h-4 w-4" /> : <ArrowUpRightIcon className="h-4 w-4" />}
      </span>
    </button>
  )
}

function ThemedModal({
  link,
  theme,
  onClose,
}: {
  link: Link
  theme: ThemeConfig
  onClose: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function handleVisit() {
    registerLinkClick(link.id)
    if (link.open_new_tab) window.open(link.url, '_blank', 'noopener,noreferrer')
    else window.location.href = link.url
    onClose()
  }

  let host = 'Visit site'
  try {
    host = new URL(link.url).hostname.replace(/^www\./, '')
  } catch {
    /* keep default */
  }

  const isLightText = theme.text_color.toLowerCase() > '#888888'
  const cardBg = isLightText ? '#101114F2' : '#FFFFFFF7'

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: '#00000090', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-modal-title"
        className="modal-card w-full max-w-[420px] p-6 relative"
        style={{
          backgroundColor: cardBg,
          color: theme.text_color,
          border: `1px solid ${theme.text_color}22`,
          borderRadius: '16px',
          fontFamily: theme.font.body,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        {link.category && (
          <p
            className="text-[10px] uppercase tracking-[0.12em] mb-2"
            style={{ color: theme.accent_color }}
          >
            {link.category}
          </p>
        )}
        <h2
          id="public-modal-title"
          className="text-xl font-semibold pr-8"
          style={{ fontFamily: theme.font.heading }}
        >
          {link.title}
        </h2>
        {link.description && (
          <p className="text-sm leading-relaxed mt-3 opacity-80">{link.description}</p>
        )}
        <button
          type="button"
          onClick={handleVisit}
          className="mt-6 w-full min-h-12 font-semibold text-sm flex items-center justify-center gap-2 transition-transform motion-safe:active:scale-[0.99] cursor-pointer"
          style={{
            borderRadius: buttonRadius(theme.button.shape),
            backgroundColor: theme.accent_color,
            color: isLightText ? '#0A0A0C' : '#FFFFFF',
          }}
        >
          Visit {host}
          <ArrowUpRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const SOCIAL_DEFS: {
  key: keyof Socials
  label: string
  Icon: (p: { className?: string }) => React.ReactNode
}[] = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'tiktok', label: 'TikTok', Icon: TikTokIcon },
  { key: 'x', label: 'X (Twitter)', Icon: XIcon },
  { key: 'youtube', label: 'YouTube', Icon: YouTubeIcon },
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
]

function ReportDialog({ profileId, onClose }: { profileId: string; onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/70"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report this page"
        className="w-full max-w-[360px] bg-[#101114] border border-[#1C1E22] rounded-[14px] p-6 text-[#EDEFF2]"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <>
            <h2 className="text-base font-semibold">Thanks — report received.</h2>
            <p className="text-sm mt-2 opacity-70">Our moderation team will review this page.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full min-h-10 rounded-[10px] border border-[#1C1E22] text-sm cursor-pointer hover:border-[#C7CBD1] transition-colors"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold">Report this page</h2>
            <p className="text-sm mt-1 opacity-70">Tell us what's wrong (spam, scam, abuse…)</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-[8px] bg-[#060607] border border-[#1C1E22] px-3 py-2 text-sm outline-none focus:border-[#C7CBD1]"
            />
            {error && <p className="text-[#F0564A] text-xs mt-2">{error}</p>}
            <button
              type="button"
              onClick={async () => {
                const err = await submitReport(profileId, reason)
                if (err) setError(err)
                else setDone(true)
              }}
              disabled={reason.trim().length < 3}
              className="mt-4 w-full min-h-10 rounded-[10px] bg-[#1C1E22] border border-[#C7CBD1]/60 text-sm font-medium cursor-pointer hover:border-[#C7CBD1] transition-colors disabled:opacity-50"
            >
              Submit report
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * The page
 * ------------------------------------------------------------------ */

type LoadState = 'loading' | 'ready' | 'unavailable'

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [links, setLinks] = useState<Link[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [active, setActive] = useState<Link | null>(null)
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !username) {
        setState('unavailable')
        return
      }
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .eq('status', 'active')
        .maybeSingle()
      if (cancelled) return
      if (!p) {
        setState('unavailable')
        return
      }
      const prof = p as Profile
      setProfile(prof)
      registerPageView(prof.id)
      const { data: l } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', prof.id)
        .eq('visible', true)
        .eq('flagged', false)
        .order('sort_order')
      if (cancelled) return
      setLinks((l as Link[]) ?? [])
      setState('ready')
    }
    void load()
    // A hung request must never strand visitors on the skeleton.
    const timeout = setTimeout(() => {
      if (!cancelled) setState((s) => (s === 'loading' ? 'unavailable' : s))
    }, 10_000)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [username])

  const theme = useMemo(
    () => (profile ? resolveTheme(profile) : null),
    [profile]
  )

  useEffect(() => {
    if (theme) ensureFonts([theme.font.heading, theme.font.body])
  }, [theme])

  // per-user share tags (client-side; JS-running crawlers pick these up)
  useEffect(() => {
    if (!profile) return
    const name = profile.display_name || profile.username
    document.title = `${name} — Lynkit`
    const og = document.querySelector('meta[property="og:title"]')
    og?.setAttribute('content', `${name} — Lynkit`)
    if (profile.avatar_url) {
      document
        .querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]')
        .forEach((el) => el.setAttribute('content', profile.avatar_url!))
    }
    return () => {
      document.title = "Lynkit — Link it all."
    }
  }, [profile])

  if (state === 'loading') {
    return (
      <div className="min-h-dvh bg-[#0A0A0B] flex flex-col items-center pt-16 px-5">
        <div className="skeleton h-24 w-24 rounded-full" />
        <div className="skeleton h-5 w-40 rounded mt-5" />
        <div className="w-full max-w-[520px] flex flex-col gap-3 mt-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 w-full rounded-[10px]" />
          ))}
        </div>
      </div>
    )
  }

  if (state === 'unavailable' || !profile || !theme) {
    return (
      <div className="min-h-dvh bg-[#0A0A0B] text-[#EDEFF2] flex flex-col items-center justify-center px-5 text-center">
        <h1 className="text-xl font-semibold">This page isn't available</h1>
        <p className="text-sm mt-2 opacity-60 max-w-[36ch]">
          It may have moved, been suspended, or never existed.
        </p>
        <a
          href="/"
          className="mt-8 text-sm underline opacity-70 hover:opacity-100 transition-opacity"
        >
          Create your own page on Lynkit
        </a>
      </div>
    )
  }

  const socials = SOCIAL_DEFS.filter(({ key }) => profile.socials?.[key])

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ ...backgroundStyle(theme.background), color: theme.text_color, fontFamily: theme.font.body }}
    >
      <main className="mx-auto w-full max-w-[520px] px-5 flex-1">
        <header className="flex flex-col items-center text-center pt-14 pb-8">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
              width={96}
              height={96}
              className="h-24 w-24 object-cover"
              style={{
                borderRadius: avatarRadius(theme.avatar_shape),
                border: `2px solid ${theme.accent_color}66`,
              }}
            />
          ) : (
            <div
              className="h-24 w-24 flex items-center justify-center text-2xl font-semibold"
              style={{
                borderRadius: avatarRadius(theme.avatar_shape),
                backgroundColor: theme.accent_color + '33',
                border: `2px solid ${theme.accent_color}66`,
              }}
              aria-hidden="true"
            >
              {(profile.display_name || profile.username).slice(0, 1).toUpperCase()}
            </div>
          )}
          <h1
            className="text-[24px] font-semibold mt-5"
            style={{ fontFamily: theme.font.heading }}
          >
            {profile.display_name || `@${profile.username}`}
          </h1>
          {profile.bio && (
            <p className="text-sm mt-2 max-w-[40ch] leading-relaxed opacity-75">{profile.bio}</p>
          )}
          {socials.length > 0 && (
            <nav aria-label="Social profiles" className="flex items-center gap-5 mt-4">
              {socials.map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={profile.socials[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="opacity-60 hover:opacity-100 transition-opacity p-1"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </nav>
          )}
        </header>

        {links.length === 0 ? (
          <p className="text-sm text-center py-14 opacity-60">Nothing here yet.</p>
        ) : (
          <div className="flex flex-col gap-3.5 pb-6">
            {links.map((link) => (
              <ThemedLinkButton key={link.id} link={link} theme={theme} onOpen={setActive} />
            ))}
          </div>
        )}
      </main>

      <footer className="flex flex-col items-center gap-2 pb-8 pt-10">
        <a
          href="/"
          className="text-[11px] px-3 py-1.5 rounded-full transition-opacity opacity-55 hover:opacity-90"
          style={{ border: `1px solid ${theme.text_color}33` }}
        >
          Made with <strong style={{ fontWeight: 600 }}>Lynkit</strong>
        </a>
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="text-[10px] opacity-35 hover:opacity-70 transition-opacity cursor-pointer"
        >
          Report this page
        </button>
      </footer>

      {active && <ThemedModal link={active} theme={theme} onClose={() => setActive(null)} />}
      {reporting && <ReportDialog profileId={profile.id} onClose={() => setReporting(false)} />}
    </div>
  )
}
