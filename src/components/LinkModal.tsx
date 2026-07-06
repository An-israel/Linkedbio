import { useEffect, useRef } from 'react'
import type { Link } from '../lib/types'
import { registerClick } from '../lib/analytics'
import { ArrowUpRightIcon, CloseIcon } from './icons'

interface Props {
  link: Link
  onClose: () => void
}

const FOCUSABLE = 'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'

/**
 * The popup: category label, title, description, and the single white
 * primary "Visit site" action. Traps focus, closes on Esc / backdrop tap,
 * and locks body scroll while open.
 */
export function LinkModal({ link, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the primary action on open.
    const card = cardRef.current
    const focusables = card?.querySelectorAll<HTMLElement>(FOCUSABLE)
    focusables?.[focusables.length - 1]?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !card) return
      const items = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus()
    }
  }, [onClose])

  function handleVisit() {
    registerClick(link.id)
    if (link.open_new_tab) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = link.url
    }
    onClose()
  }

  let host = 'Visit site'
  try {
    host = new URL(link.url).hostname.replace(/^www\./, '')
  } catch {
    /* keep default label */
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-5 bg-obsidian/70 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-modal-title"
        className="modal-card w-full max-w-[420px] bg-graphite border border-steel rounded-[14px] p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-mist hover:text-silver transition-colors cursor-pointer"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {link.category && <p className="mono-label mb-2">{link.category}</p>}

        <h2 id="link-modal-title" className="display text-platinum text-xl pr-8">
          {link.title}
        </h2>

        {link.description && (
          <p className="text-mist text-sm leading-relaxed mt-3">{link.description}</p>
        )}

        <button
          type="button"
          onClick={handleVisit}
          className="mt-6 w-full min-h-12 rounded-[10px] bg-steel border border-silver/60 text-white font-medium text-sm flex items-center justify-center gap-2 hover:border-silver hover:bg-steel/80 transition-all cursor-pointer"
        >
          Visit {host}
          <ArrowUpRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
