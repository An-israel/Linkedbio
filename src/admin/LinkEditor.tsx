import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Link, LinkInput } from '../lib/types'
import { CloseIcon } from '../components/icons'
import { FieldLabel, Toggle, btnPrimary, btnSecondary, inputClass, isValidUrl } from './ui'

interface Props {
  link: Link | null // null = create new
  nextSortOrder: number
  onSave: (input: LinkInput, id?: string) => Promise<void>
  onClose: () => void
}

export function LinkEditor({ link, nextSortOrder, onSave, onClose }: Props) {
  const [title, setTitle] = useState(link?.title ?? '')
  const [category, setCategory] = useState(link?.category ?? '')
  const [subtitle, setSubtitle] = useState(link?.subtitle ?? '')
  const [description, setDescription] = useState(link?.description ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const [icon, setIcon] = useState(link?.icon ?? '')
  const [featured, setFeatured] = useState(link?.featured ?? false)
  const [visible, setVisible] = useState(link?.visible ?? true)
  const [openNewTab, setOpenNewTab] = useState(link?.open_new_tab ?? true)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidUrl(url.trim())) {
      setUrlError('URL must start with http:// or https:// and be valid.')
      return
    }
    setUrlError(null)
    setSaving(true)
    try {
      await onSave(
        {
          title: title.trim(),
          category: category.trim() || null,
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          url: url.trim(),
          icon: icon.trim() || null,
          featured,
          visible,
          open_new_tab: openNewTab,
          sort_order: link?.sort_order ?? nextSortOrder,
        },
        link?.id
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 sm:p-5 bg-obsidian/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={link ? 'Edit link' : 'Add link'}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="modal-card w-full max-w-[480px] bg-graphite border border-steel rounded-[14px] p-6 my-6 relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 text-mist hover:text-silver transition-colors cursor-pointer"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <p className="mono-label">{link ? 'Edit link' : 'Add link'}</p>
        <h2 className="display text-platinum text-lg mt-1 mb-5">
          {link ? link.title : 'New link'}
        </h2>

        <div className="flex flex-col gap-4">
          <label>
            <FieldLabel>Title *</FieldLabel>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="SkryveAI"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label>
              <FieldLabel>Category</FieldLabel>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
                placeholder="AI PLATFORM"
              />
            </label>
            <label>
              <FieldLabel>Icon (emoji)</FieldLabel>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className={inputClass}
                placeholder="🚀"
              />
            </label>
          </div>

          <label>
            <FieldLabel>Subtitle</FieldLabel>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className={inputClass}
              placeholder="Optional one-liner under the title"
            />
          </label>

          <label>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass + ' resize-y'}
            />
            <span className="block text-mist text-xs mt-1.5 leading-relaxed">
              If you fill this, tapping the button opens a popup with this text and a
              Visit-site button. Leave empty to link directly.
            </span>
          </label>

          <label>
            <FieldLabel>URL *</FieldLabel>
            <input
              required
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (urlError) setUrlError(null)
              }}
              className={inputClass + (urlError ? ' border-danger' : '')}
              placeholder="https://…"
              aria-invalid={urlError ? true : undefined}
            />
            {urlError && <span className="block text-danger text-xs mt-1.5">{urlError}</span>}
          </label>

          <div className="flex flex-col gap-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-platinum">
                Featured
                <span className="block text-xs text-mist">Spotlight border treatment</span>
              </span>
              <Toggle checked={featured} onChange={setFeatured} label="Featured" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-platinum">
                Visible
                <span className="block text-xs text-mist">Show or hide without deleting</span>
              </span>
              <Toggle checked={visible} onChange={setVisible} label="Visible" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-platinum">
                Open in new tab
                <span className="block text-xs text-mist">Recommended for external links</span>
              </span>
              <Toggle checked={openNewTab} onChange={setOpenNewTab} label="Open in new tab" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className={btnSecondary + ' flex-1'}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={btnPrimary + ' flex-1'}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
