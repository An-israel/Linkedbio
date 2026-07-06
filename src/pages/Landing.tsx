import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { PRESETS, backgroundStyle, buttonRadius } from '../lib/themes'
import { PromoBannerSlot, PromoPopupHost, PromoSlideshow } from '../components/promos'

const SHOWCASE_THEMES = [
  'obsidian', 'paper', 'sunset', 'neon', 'rosegold', 'ocean', 'mono', 'aurora',
]

function UsernameClaim({ big }: { big?: boolean }) {
  const [username, setUsername] = useState('')
  const navigate = useNavigate()
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')

  return (
    <form
      className={`flex flex-col sm:flex-row gap-3 w-full ${big ? 'max-w-md' : 'max-w-sm'}`}
      onSubmit={(e) => {
        e.preventDefault()
        navigate(clean ? `/signup?u=${encodeURIComponent(clean)}` : '/signup')
      }}
    >
      <div className="flex-1 flex items-center bg-graphite border border-steel rounded-[10px] px-3 focus-within:border-silver transition-colors">
        <span className="text-mist text-sm shrink-0 select-none">lynkit.link/</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="yourname"
          aria-label="Choose your username"
          className="w-full bg-transparent border-0 outline-none text-platinum text-sm py-3 min-w-0"
        />
      </div>
      <button
        type="submit"
        className="min-h-11 px-5 rounded-[10px] bg-white text-obsidian text-sm font-semibold hover:bg-platinum transition-colors cursor-pointer shrink-0"
      >
        Claim your username
      </button>
    </form>
  )
}

/** Small phone mockup rendering a theme preview. */
function ThemePhone({ themeId }: { themeId: string }) {
  const preset = PRESETS[themeId]
  if (!preset) return null
  const c = preset.config
  return (
    <figure className="shrink-0 w-36">
      <div
        className="rounded-[18px] border border-steel overflow-hidden aspect-[9/17] p-3 flex flex-col items-center gap-2"
        style={backgroundStyle(c.background)}
      >
        <div
          className="h-8 w-8 mt-2"
          style={{
            backgroundColor: c.accent_color,
            opacity: 0.85,
            borderRadius: c.avatar_shape === 'circle' ? '999px' : c.avatar_shape === 'rounded' ? '6px' : '2px',
          }}
        />
        <div className="h-1.5 w-14 rounded" style={{ backgroundColor: c.text_color, opacity: 0.9 }} />
        <div className="h-1 w-20 rounded" style={{ backgroundColor: c.text_color, opacity: 0.4 }} />
        <div className="w-full flex flex-col gap-1.5 mt-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-5 w-full"
              style={{
                borderRadius: buttonRadius(c.button.shape),
                backgroundColor: c.button.style === 'outline' ? 'transparent' : c.button.fill,
                border: `1px solid ${c.button.style === 'outline' ? c.text_color + '66' : 'transparent'}`,
              }}
            />
          ))}
        </div>
      </div>
      <figcaption className="mono-label text-center mt-2 text-mist">{preset.name}</figcaption>
    </figure>
  )
}

const STEPS = [
  { n: '01', title: 'Claim your link', body: 'Pick a username and your page lives at lynkit.link/you. Free, forever.' },
  { n: '02', title: 'Add your links', body: 'Products, socials, stores, books — each can open a rich popup or link straight out.' },
  { n: '03', title: 'Pick a theme', body: '20+ premium themes, or design your own. Your page, your brand — not ours.' },
]

const WHY = [
  { title: 'Free forever', body: 'Every feature — themes, analytics, customization — free. No paywall creep.' },
  { title: 'Your brand, not ours', body: 'No forced branding on your buttons. A single subtle badge is all we ask.' },
  { title: 'Built for creators', body: 'African-first energy, global standards. Fast on any phone, on any network.' },
  { title: 'Fast & premium', body: 'No clutter, no ads on your page, instant loads. A link you are proud to share.' },
]

export function Landing() {
  return (
    <div className="min-h-dvh bg-obsidian">
      {/* Nav */}
      <header className="border-b border-steel/60 sticky top-0 bg-obsidian/85 backdrop-blur-sm z-40">
        <nav className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between gap-4">
          <RouterLink to="/" className="display text-platinum text-lg">
            Lynkit<span className="text-silver">.</span>
          </RouterLink>
          <div className="flex items-center gap-5">
            <a href="#how" className="mono-label text-mist hover:text-silver transition-colors hidden sm:block">
              Features
            </a>
            <a href="#themes" className="mono-label text-mist hover:text-silver transition-colors hidden sm:block">
              Themes
            </a>
            <RouterLink to="/login" className="mono-label text-mist hover:text-silver transition-colors">
              Login
            </RouterLink>
            <RouterLink
              to="/signup"
              className="min-h-9 px-4 rounded-[10px] bg-white text-obsidian text-sm font-semibold flex items-center hover:bg-platinum transition-colors whitespace-nowrap"
            >
              <span className="sm:hidden">Sign up free</span>
              <span className="hidden sm:inline">Create your page, free</span>
            </RouterLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* Hero */}
        <section className="pt-20 pb-14 flex flex-col items-center text-center">
          <p className="mono-label">One link for everything you do</p>
          <h1 className="display text-platinum text-5xl sm:text-6xl mt-4">
            Link it{' '}
            <span className="bg-gradient-to-r from-silver via-platinum to-silver bg-clip-text text-transparent">
              all.
            </span>
          </h1>
          <p className="text-mist text-lg mt-4 max-w-[46ch]">
            Everything you make, sell, and stand for, in one link worth sharing.
          </p>
          <div className="mt-8 w-full flex justify-center">
            <UsernameClaim big />
          </div>
          <div
            aria-hidden="true"
            className="mt-12 h-px w-40 bg-gradient-to-r from-transparent via-silver/70 to-transparent"
          />
        </section>

        {/* Promo slot A — renders nothing (no gap) when no banner is active */}
        <PromoBannerSlot placement="landing_hero" wrapperClass="pb-12" />

        {/* How it works */}
        <section id="how" className="py-14 border-t border-steel/60">
          <p className="mono-label text-center">How it works</p>
          <div className="grid sm:grid-cols-3 gap-6 mt-8">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-graphite border border-steel rounded-[14px] p-6">
                <span className="mono-label text-silver">{s.n}</span>
                <h2 className="display text-platinum text-lg mt-3">{s.title}</h2>
                <p className="text-mist text-sm mt-2 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Theme showcase */}
        <section id="themes" className="py-14 border-t border-steel/60">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="mono-label">Themes</p>
              <h2 className="display text-platinum text-2xl mt-2">20+ free themes. Yours to remix.</h2>
            </div>
            <RouterLink
              to="/signup"
              className="mono-label text-silver hover:text-platinum transition-colors"
            >
              Start with one →
            </RouterLink>
          </div>
          <div className="flex gap-4 mt-8 overflow-x-auto pb-3 -mx-5 px-5">
            {SHOWCASE_THEMES.map((id) => (
              <ThemePhone key={id} themeId={id} />
            ))}
          </div>
        </section>

        {/* Promo slot B: slideshow — hidden entirely when no slides */}
        <PromoSlideshow surface="landing" wrapperClass="py-14 border-t border-steel/60" />

        {/* Why Lynkit */}
        <section className="py-14 border-t border-steel/60">
          <p className="mono-label text-center">Why Lynkit</p>
          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            {WHY.map((w) => (
              <div key={w.title} className="border border-steel rounded-[14px] p-6">
                <h2 className="display text-platinum text-base">{w.title}</h2>
                <p className="text-mist text-sm mt-2 leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 border-t border-steel/60 flex flex-col items-center text-center">
          <h2 className="display text-platinum text-3xl">Your link is waiting.</h2>
          <div className="mt-7 w-full flex justify-center">
            <UsernameClaim />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-steel">
        <div className="mx-auto max-w-5xl px-5 py-10 flex flex-col sm:flex-row gap-8 justify-between">
          <div>
            <p className="display text-platinum">
              Lynkit<span className="text-silver">.</span>
            </p>
            <p className="mono-label mt-3 text-mist">© 2026 LYNKIT</p>
            <p className="text-mist text-xs mt-2">
              Built by{' '}
              <a
                href="https://aniekanisrael.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-silver hover:text-platinum transition-colors"
              >
                Aniekan Israel
              </a>
            </p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2.5">
              <p className="mono-label text-mist">Product</p>
              <a href="#how" className="text-mist text-sm hover:text-silver transition-colors">Features</a>
              <a href="#themes" className="text-mist text-sm hover:text-silver transition-colors">Themes</a>
              <RouterLink to="/login" className="text-mist text-sm hover:text-silver transition-colors">Login</RouterLink>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="mono-label text-mist">Legal</p>
              <RouterLink to="/terms" className="text-mist text-sm hover:text-silver transition-colors">Terms</RouterLink>
              <RouterLink to="/privacy" className="text-mist text-sm hover:text-silver transition-colors">Privacy</RouterLink>
            </div>
          </div>
        </div>
      </footer>

      <PromoPopupHost surface="landing" />
    </div>
  )
}
