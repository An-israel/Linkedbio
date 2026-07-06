import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { FALLBACK_SETTINGS } from '../lib/fallback'
import type { Settings, SettingsKey } from '../lib/types'
import { FieldLabel, btnPrimary, btnSecondary, inputClass, isValidUrl, useToast } from './ui'

const SOCIAL_FIELDS: { key: SettingsKey; label: string }[] = [
  { key: 'instagram_url', label: 'Instagram URL' },
  { key: 'tiktok_url', label: 'TikTok URL' },
  { key: 'x_url', label: 'X (Twitter) URL' },
  { key: 'facebook_url', label: 'Facebook URL' },
]

function ImageUpload({
  label,
  hint,
  value,
  slug,
  onChange,
  round,
}: {
  label: string
  hint: string
  value: string
  slug: string
  onChange: (url: string) => void
  round?: boolean
}) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !supabase) return
    setUploading(true)
    const ext = file.name.split('.').pop() || 'png'
    const path = `${slug}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('hub-assets').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    setUploading(false)
    if (error) {
      toast('Upload failed: ' + error.message, 'danger')
      return
    }
    const { data } = supabase.storage.from('hub-assets').getPublicUrl(path)
    onChange(data.publicUrl)
    toast(`${label} uploaded — remember to Save`)
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-4">
        <div
          className={`h-16 ${round ? 'w-16 rounded-full' : 'w-28 rounded-[8px]'} bg-obsidian border border-steel overflow-hidden flex items-center justify-center shrink-0`}
        >
          {value ? (
            <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-mist text-xs">None</span>
          )}
        </div>
        <div className="flex gap-2">
          <label className={btnSecondary + ' inline-flex items-center cursor-pointer'}>
            {uploading ? 'Uploading…' : 'Upload'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
          {value && (
            <button type="button" onClick={() => onChange('')} className={btnSecondary}>
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-mist text-xs mt-2">{hint}</p>
    </div>
  )
}

export function Appearance() {
  const toast = useToast()
  const [form, setForm] = useState<Settings>(FALLBACK_SETTINGS)
  const [errors, setErrors] = useState<Partial<Record<SettingsKey, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false)
        return
      }
      const { data } = await supabase.from('settings').select('key, value')
      if (data) {
        const merged = { ...FALLBACK_SETTINGS }
        for (const row of data as { key: string; value: unknown }[]) {
          if (row.key in merged && typeof row.value === 'string') {
            merged[row.key as SettingsKey] = row.value
          }
        }
        setForm(merged)
      }
      setLoading(false)
    }
    void load()
  }, [])

  function set(key: SettingsKey, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors: Partial<Record<SettingsKey, string>> = {}
    for (const { key, label } of SOCIAL_FIELDS) {
      const v = form[key].trim()
      if (v && !isValidUrl(v)) nextErrors[key] = `${label} must start with http:// or https://`
    }
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      return
    }
    if (!supabase) {
      toast('Supabase is not configured', 'danger')
      return
    }
    setSaving(true)
    const rows = (Object.keys(form) as SettingsKey[]).map((key) => ({
      key,
      value: form[key].trim(),
    }))
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    if (error) {
      toast('Save failed: ' + error.message, 'danger')
    } else {
      toast('Appearance saved — live on the public page')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-[10px]" />
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <p className="mono-label">Appearance</p>
      <h1 className="display text-platinum text-xl mt-1 mb-7">Profile & socials</h1>

      <div className="flex flex-col gap-6">
        <ImageUpload
          label="Avatar"
          hint="Shown at the top of the hub. Square works best — it renders as a 96px circle."
          value={form.avatar_url}
          slug="avatar"
          onChange={(url) => set('avatar_url', url)}
          round
        />

        <ImageUpload
          label="OG share image"
          hint="The preview image when your link is shared on WhatsApp, X, or Instagram. 1200×630 recommended."
          value={form.og_image_url}
          slug="og-image"
          onChange={(url) => set('og_image_url', url)}
        />

        <label>
          <FieldLabel>Display name</FieldLabel>
          <input
            value={form.display_name}
            onChange={(e) => set('display_name', e.target.value)}
            className={inputClass}
          />
        </label>

        <label>
          <FieldLabel>Tagline</FieldLabel>
          <input
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            className={inputClass}
          />
          <span className="block text-mist text-xs mt-1.5">
            Rendered in mono uppercase under your name.
          </span>
        </label>

        <label>
          <FieldLabel>Bio line</FieldLabel>
          <input
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            className={inputClass}
          />
        </label>

        {SOCIAL_FIELDS.map(({ key, label }) => (
          <label key={key}>
            <FieldLabel>{label}</FieldLabel>
            <input
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              className={inputClass + (errors[key] ? ' border-danger' : '')}
              placeholder="https://…"
              aria-invalid={errors[key] ? true : undefined}
            />
            {errors[key] && (
              <span className="block text-danger text-xs mt-1.5">{errors[key]}</span>
            )}
            <span className="block text-mist text-xs mt-1.5">
              Leave empty to hide this icon on the public page.
            </span>
          </label>
        ))}
      </div>

      <button type="submit" disabled={saving} className={btnPrimary + ' w-full mt-8'}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
