import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { registerPromoClick } from '../lib/analytics'
import type { PromoBanner, PromoPopup, PromoSlide } from '../lib/types'
import { CloseIcon } from './icons'

/* ------------------------------------------------------------------
 * Banner (landing_hero / landing_band / dashboard_top)
 * ------------------------------------------------------------------ */

export function PromoBannerSlot({
  placement,
  dismissible,
  wrapperClass,
}: {
  placement: PromoBanner['placement']
  dismissible?: boolean
  /** Optional wrapper rendered only when a banner is active — avoids empty gaps. */
  wrapperClass?: string
}) {
  const [banner, setBanner] = useState<PromoBanner | null>(null)
  const [dismissed, setDismissed] = useState(
    () => dismissible && sessionStorage.getItem(`lynkit_banner_dismissed_${placement}`) === '1'
  )

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('promo_banners')
      .select('*')
      .eq('placement', placement)
      .eq('active', true)
      .order('sort_order')
      .limit(1)
      .then(({ data }) => setBanner((data?.[0] as PromoBanner) ?? null))
  }, [placement])

  if (!banner || dismissed) return null

  const inner = (
    <div className="bg-graphite border border-steel rounded-[10px] px-4 py-3 flex items-center gap-3">
      <span className="mono-label shrink-0 text-mist">Promo</span>
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt=""
          loading="lazy"
          className="h-9 w-9 rounded-[6px] object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => registerPromoClick('banner', banner.id)}
          className="text-platinum text-sm font-medium hover:text-silver transition-colors"
        >
          {banner.title}
        </a>
        {banner.body && <p className="text-mist text-xs mt-0.5 truncate">{banner.body}</p>}
      </div>
      {dismissible && (
        <button
          type="button"
          aria-label="Dismiss promotion"
          onClick={() => {
            sessionStorage.setItem(`lynkit_banner_dismissed_${placement}`, '1')
            setDismissed(true)
          }}
          className="text-mist hover:text-silver p-1 cursor-pointer shrink-0"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  return wrapperClass ? <div className={wrapperClass}>{inner}</div> : inner
}

/* ------------------------------------------------------------------
 * Slideshow (landing / dashboard)
 * ------------------------------------------------------------------ */

export function PromoSlideshow({
  surface,
  wrapperClass,
}: {
  surface: 'landing' | 'dashboard'
  /** Optional wrapper rendered only when slides exist — avoids empty gaps. */
  wrapperClass?: string
}) {
  const [slides, setSlides] = useState<PromoSlide[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('promo_slides')
      .select('*')
      .eq('active', true)
      .in('surface', [surface, 'both'])
      .order('sort_order')
      .then(({ data }) => setSlides((data as PromoSlide[]) ?? []))
  }, [surface])

  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(id)
  }, [slides.length, paused, reducedMotion])

  if (slides.length === 0) return null
  const slide = slides[index]

  const inner = (
    <section
      aria-label="Promotions"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="mono-label mb-3 text-mist">From the maker</p>
      <a
        href={slide.link_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => registerPromoClick('slide', slide.id)}
        className="block bg-graphite border border-steel rounded-[14px] overflow-hidden hover:border-silver/60 transition-colors"
      >
        <img
          src={slide.image_url}
          alt={slide.caption ?? 'Promotion'}
          loading="lazy"
          className="w-full aspect-[2/1] object-cover"
        />
        {slide.caption && <p className="text-mist text-sm px-4 py-3">{slide.caption}</p>}
      </a>
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === index ? 'w-5 bg-silver' : 'w-1.5 bg-steel hover:bg-mist'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )

  return wrapperClass ? <div className={wrapperClass}>{inner}</div> : inner
}

/* ------------------------------------------------------------------
 * Popup with frequency capping.
 * Never on first paint of a first visit; at most one per session.
 * ------------------------------------------------------------------ */

const POPUP_DELAY_MS = 12_000
let popupShownThisSession = false

function readPopupState(key: string): { last: number; visits: number } | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as { last: number; visits: number }) : null
  } catch {
    return null
  }
}

function shouldShow(popup: PromoPopup): boolean {
  const key = `lynkit_popup_${popup.id}`
  const state = readPopupState(key)
  switch (popup.frequency) {
    case 'once_session':
      return sessionStorage.getItem(key) !== '1'
    case 'once_day':
      return !state || Date.now() - state.last > 24 * 60 * 60 * 1000
    case 'every_n': {
      const visits = (state?.visits ?? 0) + 1
      localStorage.setItem(key, JSON.stringify({ last: state?.last ?? 0, visits }))
      return visits % Math.max(2, popup.every_n) === 0
    }
  }
}

function markShown(popup: PromoPopup) {
  const key = `lynkit_popup_${popup.id}`
  sessionStorage.setItem(key, '1')
  const state = readPopupState(key) ?? { last: 0, visits: 0 }
  localStorage.setItem(key, JSON.stringify({ ...state, last: Date.now() }))
}

export function PromoPopupHost({ surface }: { surface: 'landing' | 'dashboard' }) {
  const [popup, setPopup] = useState<PromoPopup | null>(null)

  useEffect(() => {
    if (!supabase || popupShownThisSession) return

    // let a first-time visitor see the product first
    if (!localStorage.getItem('lynkit_seen')) {
      localStorage.setItem('lynkit_seen', '1')
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      const { data } = await supabase!
        .from('promo_popups')
        .select('*')
        .eq('active', true)
        .in('surface', [surface, 'both'])
        .order('created_at', { ascending: false })
      if (cancelled) return
      const candidate = ((data as PromoPopup[]) ?? []).find(shouldShow)
      if (candidate && !popupShownThisSession) {
        popupShownThisSession = true
        markShown(candidate)
        setPopup(candidate)
      }
    }, POPUP_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [surface])

  if (!popup) return null

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[65] flex items-center justify-center p-5 bg-obsidian/70 backdrop-blur-sm"
      onClick={() => setPopup(null)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={popup.title}
        className="modal-card w-full max-w-[400px] bg-graphite border border-steel rounded-[14px] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setPopup(null)}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 text-mist hover:text-silver bg-obsidian/50 rounded-full transition-colors cursor-pointer z-10"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        {popup.image_url && (
          <img src={popup.image_url} alt="" className="w-full aspect-[2/1] object-cover" />
        )}
        <div className="p-6">
          <p className="mono-label text-mist mb-2">From the maker</p>
          <h2 className="display text-platinum text-lg">{popup.title}</h2>
          {popup.body && <p className="text-mist text-sm mt-2 leading-relaxed">{popup.body}</p>}
          <a
            href={popup.link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              registerPromoClick('popup', popup.id)
              setPopup(null)
            }}
            className="mt-5 w-full min-h-11 rounded-[10px] bg-steel border border-silver/60 text-white font-medium text-sm flex items-center justify-center hover:border-silver transition-colors"
          >
            Check it out
          </a>
          <button
            type="button"
            onClick={() => setPopup(null)}
            className="mt-2 w-full text-mist text-xs hover:text-silver transition-colors cursor-pointer py-1.5"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
