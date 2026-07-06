import type { Link } from '../lib/types'
import { registerClick } from '../lib/analytics'
import { ArrowUpRightIcon, ChevronDownIcon } from './icons'

interface Props {
  link: Link
  onOpenModal: (link: Link) => void
}

/**
 * One button in the stack. With a description → opens the popup.
 * Without → registers the click and opens the URL directly.
 */
export function LinkButton({ link, onOpenModal }: Props) {
  const hasPopup = Boolean(link.description)

  function handleClick() {
    if (hasPopup) {
      onOpenModal(link)
      return
    }
    registerClick(link.id)
    if (link.open_new_tab) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = link.url
    }
  }

  const base =
    'group w-full min-h-14 rounded-[10px] px-4 py-3 flex items-center gap-3 text-left ' +
    'transition-all duration-150 motion-safe:hover:-translate-y-px motion-safe:active:scale-[0.99] cursor-pointer'
  const surface = link.featured
    ? 'featured-ring hover:brightness-110'
    : 'bg-graphite border border-steel hover:border-silver'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${base} ${surface}`}
      aria-haspopup={hasPopup ? 'dialog' : undefined}
    >
      {link.icon && (
        <span className="text-lg shrink-0" aria-hidden="true">
          {link.icon}
        </span>
      )}

      <span className="flex-1 min-w-0">
        {link.category && <span className="mono-label block mb-0.5">{link.category}</span>}
        <span className="display block text-platinum text-[15px] font-medium truncate">
          {link.title}
        </span>
        {link.subtitle && (
          <span className="block text-mist text-xs mt-0.5 truncate">{link.subtitle}</span>
        )}
      </span>

      <span className="shrink-0 text-mist group-hover:text-silver transition-colors" aria-hidden="true">
        {hasPopup ? (
          <ChevronDownIcon className="h-4 w-4" />
        ) : (
          <ArrowUpRightIcon className="h-4 w-4" />
        )}
      </span>
    </button>
  )
}
