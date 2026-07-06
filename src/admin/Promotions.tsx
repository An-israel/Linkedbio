import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { PromoBanner, PromoPopup, PromoSlide } from '../lib/types'
import { isValidHttpUrl } from '../lib/validation'
import { FieldLabel, Toggle, btnPrimary, btnSecondary, inputClass, useToast } from './ui'

type Tab = 'banners' | 'slides' | 'popups'

const selectClass =
  'w-full min-h-9 rounded-[8px] bg-obsidian border border-steel px-2.5 text-sm text-platinum focus:border-silver transition-colors'

function useClickCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('promo_clicks')
      .select('source_id')
      .then(({ data }) => {
        const next: Record<string, number> = {}
        for (const row of (data as { source_id: string }[]) ?? []) {
          next[row.source_id] = (next[row.source_id] ?? 0) + 1
        }
        setCounts(next)
      })
  }, [])
  return counts
}

function ImageField({
  value,
  onChange,
  slug,
}: {
  value: string
  onChange: (url: string) => void
  slug: string
}) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !supabase) return
    setUploading(true)
    const path = `${slug}-${Date.now()}.${file.name.split('.').pop() || 'png'}`
    const { error } = await supabase.storage.from('promo-media').upload(path, file)
    setUploading(false)
    if (error) {
      toast('Upload failed: ' + error.message, 'danger')
      return
    }
    onChange(supabase.storage.from('promo-media').getPublicUrl(path).data.publicUrl)
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="" className="h-12 w-20 rounded-[6px] object-cover border border-steel" />
      ) : (
        <div className="h-12 w-20 rounded-[6px] border border-steel border-dashed flex items-center justify-center text-mist text-[10px]">
          No image
        </div>
      )}
      <label className={btnSecondary + ' inline-flex items-center cursor-pointer'}>
        {uploading ? 'Uploading…' : 'Upload'}
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
      </label>
      {value && (
        <button type="button" onClick={() => onChange('')} className={btnSecondary}>
          Remove
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------
 * Generic editor row plumbing: each promo type has a small form.
 * ------------------------------------------------------------------ */

function useCrud<T extends { id: string }>(table: string, order: string) {
  const toast = useToast()
  const [rows, setRows] = useState<T[]>([])

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from(table).select('*').order(order)
    if (error) toast(`Failed to load ${table}: ` + error.message, 'danger')
    else setRows((data as T[]) ?? [])
  }, [table, order, toast])

  useEffect(() => {
    void load()
  }, [load])

  async function save(input: Partial<T>, id?: string) {
    if (!supabase) return false
    const payload = input as Record<string, unknown>
    const q = id
      ? supabase.from(table).update(payload).eq('id', id)
      : supabase.from(table).insert(payload)
    const { error } = await q
    if (error) {
      toast('Save failed: ' + error.message, 'danger')
      return false
    }
    toast('Saved')
    void load()
    return true
  }

  async function remove(id: string) {
    if (!supabase) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) toast('Delete failed: ' + error.message, 'danger')
    else {
      toast('Deleted')
      void load()
    }
  }

  return { rows, save, remove, reload: load }
}

/* ---------- Banners ---------- */

function BannerForm({
  banner,
  onSave,
  onCancel,
}: {
  banner: Partial<PromoBanner>
  onSave: (b: Partial<PromoBanner>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<PromoBanner>>({
    title: '',
    body: '',
    image_url: '',
    link_url: '',
    placement: 'landing_hero',
    active: false,
    sort_order: 0,
    ...banner,
  })
  const toast = useToast()

  return (
    <div className="bg-graphite border border-silver/40 rounded-[10px] p-5 flex flex-col gap-4">
      <label>
        <FieldLabel>Title *</FieldLabel>
        <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
      </label>
      <label>
        <FieldLabel>Body</FieldLabel>
        <input value={form.body ?? ''} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputClass} />
      </label>
      <div>
        <FieldLabel>Image</FieldLabel>
        <ImageField value={form.image_url ?? ''} onChange={(v) => setForm({ ...form, image_url: v })} slug="banner" />
      </div>
      <label>
        <FieldLabel>Link URL *</FieldLabel>
        <input value={form.link_url ?? ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className={inputClass} placeholder="https://…" />
      </label>
      <div className="grid grid-cols-2 gap-4 items-end">
        <label>
          <FieldLabel>Placement</FieldLabel>
          <select
            value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value as PromoBanner['placement'] })}
            className={selectClass}
          >
            <option value="landing_hero">Landing — hero band</option>
            <option value="landing_band">Landing — mid band</option>
            <option value="dashboard_top">Dashboard — top strip</option>
          </select>
        </label>
        <div className="flex items-center justify-between pb-1">
          <span className="text-sm text-platinum">Active</span>
          <Toggle checked={form.active ?? false} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className={btnSecondary + ' flex-1'}>Cancel</button>
        <button
          type="button"
          onClick={() => {
            if (!form.title?.trim() || !isValidHttpUrl(form.link_url ?? '')) {
              toast('Title and a valid http(s) link URL are required', 'danger')
              return
            }
            onSave(form)
          }}
          className={btnPrimary + ' flex-1'}
        >
          Save
        </button>
      </div>
    </div>
  )
}

/* ---------- Slides ---------- */

function SlideForm({
  slide,
  onSave,
  onCancel,
}: {
  slide: Partial<PromoSlide>
  onSave: (s: Partial<PromoSlide>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<PromoSlide>>({
    image_url: '',
    caption: '',
    link_url: '',
    surface: 'landing',
    active: false,
    sort_order: 0,
    ...slide,
  })
  const toast = useToast()

  return (
    <div className="bg-graphite border border-silver/40 rounded-[10px] p-5 flex flex-col gap-4">
      <div>
        <FieldLabel>Image *</FieldLabel>
        <ImageField value={form.image_url ?? ''} onChange={(v) => setForm({ ...form, image_url: v })} slug="slide" />
      </div>
      <label>
        <FieldLabel>Caption</FieldLabel>
        <input value={form.caption ?? ''} onChange={(e) => setForm({ ...form, caption: e.target.value })} className={inputClass} />
      </label>
      <label>
        <FieldLabel>Link URL *</FieldLabel>
        <input value={form.link_url ?? ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className={inputClass} placeholder="https://…" />
      </label>
      <div className="grid grid-cols-2 gap-4 items-end">
        <label>
          <FieldLabel>Surface</FieldLabel>
          <select
            value={form.surface}
            onChange={(e) => setForm({ ...form, surface: e.target.value as PromoSlide['surface'] })}
            className={selectClass}
          >
            <option value="landing">Landing</option>
            <option value="dashboard">Dashboard</option>
            <option value="both">Both</option>
          </select>
        </label>
        <div className="flex items-center justify-between pb-1">
          <span className="text-sm text-platinum">Active</span>
          <Toggle checked={form.active ?? false} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className={btnSecondary + ' flex-1'}>Cancel</button>
        <button
          type="button"
          onClick={() => {
            if (!form.image_url || !isValidHttpUrl(form.link_url ?? '')) {
              toast('An image and a valid http(s) link URL are required', 'danger')
              return
            }
            onSave(form)
          }}
          className={btnPrimary + ' flex-1'}
        >
          Save
        </button>
      </div>
    </div>
  )
}

/* ---------- Popups ---------- */

function PopupForm({
  popup,
  onSave,
  onCancel,
}: {
  popup: Partial<PromoPopup>
  onSave: (p: Partial<PromoPopup>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<PromoPopup>>({
    title: '',
    body: '',
    image_url: '',
    link_url: '',
    surface: 'both',
    frequency: 'once_day',
    every_n: 5,
    active: false,
    starts_at: null,
    ends_at: null,
    ...popup,
  })
  const toast = useToast()

  return (
    <div className="bg-graphite border border-silver/40 rounded-[10px] p-5 flex flex-col gap-4">
      <label>
        <FieldLabel>Title *</FieldLabel>
        <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
      </label>
      <label>
        <FieldLabel>Body</FieldLabel>
        <textarea value={form.body ?? ''} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={2} className={inputClass + ' resize-y'} />
      </label>
      <div>
        <FieldLabel>Image</FieldLabel>
        <ImageField value={form.image_url ?? ''} onChange={(v) => setForm({ ...form, image_url: v })} slug="popup" />
      </div>
      <label>
        <FieldLabel>Link URL *</FieldLabel>
        <input value={form.link_url ?? ''} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className={inputClass} placeholder="https://…" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label>
          <FieldLabel>Surface</FieldLabel>
          <select
            value={form.surface}
            onChange={(e) => setForm({ ...form, surface: e.target.value as PromoPopup['surface'] })}
            className={selectClass}
          >
            <option value="landing">Landing</option>
            <option value="dashboard">Dashboard</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label>
          <FieldLabel>Frequency</FieldLabel>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value as PromoPopup['frequency'] })}
            className={selectClass}
          >
            <option value="once_session">Once per session</option>
            <option value="once_day">Once per day</option>
            <option value="every_n">Every N visits</option>
          </select>
        </label>
      </div>
      {form.frequency === 'every_n' && (
        <label>
          <FieldLabel>N (visits between shows)</FieldLabel>
          <input
            type="number"
            min={2}
            value={form.every_n ?? 5}
            onChange={(e) => setForm({ ...form, every_n: Number(e.target.value) })}
            className={inputClass + ' max-w-[120px]'}
          />
        </label>
      )}
      <div className="grid grid-cols-2 gap-4">
        <label>
          <FieldLabel>Starts</FieldLabel>
          <input
            type="date"
            value={form.starts_at ? form.starts_at.slice(0, 10) : ''}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className={inputClass}
          />
        </label>
        <label>
          <FieldLabel>Ends</FieldLabel>
          <input
            type="date"
            value={form.ends_at ? form.ends_at.slice(0, 10) : ''}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-platinum">Active</span>
        <Toggle checked={form.active ?? false} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className={btnSecondary + ' flex-1'}>Cancel</button>
        <button
          type="button"
          onClick={() => {
            if (!form.title?.trim() || !isValidHttpUrl(form.link_url ?? '')) {
              toast('Title and a valid http(s) link URL are required', 'danger')
              return
            }
            onSave(form)
          }}
          className={btnPrimary + ' flex-1'}
        >
          Save
        </button>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */

export function Promotions() {
  const [tab, setTab] = useState<Tab>('banners')
  const banners = useCrud<PromoBanner>('promo_banners', 'sort_order')
  const slides = useCrud<PromoSlide>('promo_slides', 'sort_order')
  const popups = useCrud<PromoPopup>('promo_popups', 'created_at')
  const clicks = useClickCounts()

  const [editingBanner, setEditingBanner] = useState<Partial<PromoBanner> | null>(null)
  const [editingSlide, setEditingSlide] = useState<Partial<PromoSlide> | null>(null)
  const [editingPopup, setEditingPopup] = useState<Partial<PromoPopup> | null>(null)

  function rowShell(
    key: string,
    main: React.ReactNode,
    meta: string,
    active: boolean,
    onEdit: () => void,
    onDelete: () => void
  ) {
    return (
      <li key={key} className="flex items-center gap-3 bg-graphite border border-steel rounded-[10px] px-4 py-3">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${active ? 'bg-success' : 'bg-steel'}`}
          title={active ? 'Active' : 'Inactive'}
        />
        <div className="flex-1 min-w-0">{main}</div>
        <span className="mono-label text-mist shrink-0 hidden sm:block">{meta}</span>
        <button type="button" onClick={onEdit} className="mono-label text-mist hover:text-silver cursor-pointer p-1">
          Edit
        </button>
        <button type="button" onClick={onDelete} className="mono-label text-mist hover:text-danger cursor-pointer p-1">
          Delete
        </button>
      </li>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <p className="mono-label">Promotions</p>
          <h1 className="display text-platinum text-xl mt-1">Your traffic engine</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            if (tab === 'banners') setEditingBanner({})
            if (tab === 'slides') setEditingSlide({})
            if (tab === 'popups') setEditingPopup({})
          }}
          className={btnPrimary}
        >
          New {tab.slice(0, -1)}
        </button>
      </div>

      <div className="flex gap-4 border-b border-steel mb-6">
        {(['banners', 'slides', 'popups'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`mono-label pb-2.5 -mb-px border-b-2 transition-colors cursor-pointer ${
              tab === t ? 'border-silver' : 'border-transparent text-mist hover:text-silver'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="text-mist text-xs mb-5 max-w-lg leading-relaxed">
        Restraint is the strategy: promos stay off users' public pages, popups are
        frequency-capped and never fire on a first visit. Shareability is the traffic.
      </p>

      {tab === 'banners' && (
        <div className="flex flex-col gap-3">
          {editingBanner && (
            <BannerForm
              banner={editingBanner}
              onCancel={() => setEditingBanner(null)}
              onSave={async (b) => {
                if (await banners.save(b as Partial<PromoBanner>, editingBanner.id)) setEditingBanner(null)
              }}
            />
          )}
          <ul className="flex flex-col gap-3">
            {banners.rows.map((b) =>
              rowShell(
                b.id,
                <>
                  <span className="text-platinum text-sm truncate block">{b.title}</span>
                  <span className="text-mist text-xs truncate block">{b.placement} · {b.link_url}</span>
                </>,
                `${clicks[b.id] ?? 0} clicks`,
                b.active,
                () => setEditingBanner(b),
                () => void banners.remove(b.id)
              )
            )}
          </ul>
          {banners.rows.length === 0 && !editingBanner && (
            <p className="text-mist text-sm border border-steel border-dashed rounded-[10px] p-8 text-center">
              No banners yet.
            </p>
          )}
        </div>
      )}

      {tab === 'slides' && (
        <div className="flex flex-col gap-3">
          {editingSlide && (
            <SlideForm
              slide={editingSlide}
              onCancel={() => setEditingSlide(null)}
              onSave={async (s) => {
                if (await slides.save(s as Partial<PromoSlide>, editingSlide.id)) setEditingSlide(null)
              }}
            />
          )}
          <ul className="flex flex-col gap-3">
            {slides.rows.map((s) =>
              rowShell(
                s.id,
                <span className="flex items-center gap-3 min-w-0">
                  <img src={s.image_url} alt="" className="h-9 w-14 rounded object-cover shrink-0" />
                  <span className="min-w-0">
                    <span className="text-platinum text-sm truncate block">{s.caption || '(no caption)'}</span>
                    <span className="text-mist text-xs truncate block">{s.surface} · {s.link_url}</span>
                  </span>
                </span>,
                `${clicks[s.id] ?? 0} clicks`,
                s.active,
                () => setEditingSlide(s),
                () => void slides.remove(s.id)
              )
            )}
          </ul>
          {slides.rows.length === 0 && !editingSlide && (
            <p className="text-mist text-sm border border-steel border-dashed rounded-[10px] p-8 text-center">
              No slides yet.
            </p>
          )}
        </div>
      )}

      {tab === 'popups' && (
        <div className="flex flex-col gap-3">
          {editingPopup && (
            <PopupForm
              popup={editingPopup}
              onCancel={() => setEditingPopup(null)}
              onSave={async (p) => {
                if (await popups.save(p as Partial<PromoPopup>, editingPopup.id)) setEditingPopup(null)
              }}
            />
          )}
          <ul className="flex flex-col gap-3">
            {popups.rows.map((p) =>
              rowShell(
                p.id,
                <>
                  <span className="text-platinum text-sm truncate block">{p.title}</span>
                  <span className="text-mist text-xs truncate block">
                    {p.surface} · {p.frequency}{p.frequency === 'every_n' ? ` (${p.every_n})` : ''} · {p.link_url}
                  </span>
                </>,
                `${clicks[p.id] ?? 0} clicks`,
                p.active,
                () => setEditingPopup(p),
                () => void popups.remove(p.id)
              )
            )}
          </ul>
          {popups.rows.length === 0 && !editingPopup && (
            <p className="text-mist text-sm border border-steel border-dashed rounded-[10px] p-8 text-center">
              No popups yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
