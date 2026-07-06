import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Link, Profile, ThemeConfig, ThemeRow } from '../lib/types'
import {
  DEFAULT_THEME_ID,
  FONT_OPTIONS,
  PRESETS,
  avatarRadius,
  backgroundStyle,
  buttonRadius,
  ensureFonts,
  resolveTheme,
} from '../lib/themes'
import { FieldLabel, btnPrimary, btnSecondary, useToast } from '../admin/ui'

/* ---------- live page preview ---------- */

function PagePreview({
  profile,
  theme,
  links,
}: {
  profile: Profile
  theme: ThemeConfig
  links: Link[]
}) {
  useEffect(() => {
    ensureFonts([theme.font.heading, theme.font.body])
  }, [theme.font.heading, theme.font.body])

  const sample = links.length
    ? links.slice(0, 4)
    : ([{ id: 'a', title: 'Your first link' }, { id: 'b', title: 'Another link' }] as Link[])

  return (
    <div
      className="rounded-[22px] border border-steel overflow-hidden w-full max-w-[260px] mx-auto aspect-[9/17] p-4 flex flex-col items-center overflow-y-auto"
      style={{ ...backgroundStyle(theme.background), color: theme.text_color, fontFamily: theme.font.body }}
      aria-label="Live preview of your page"
    >
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="h-12 w-12 object-cover mt-2"
          style={{ borderRadius: avatarRadius(theme.avatar_shape), border: `1.5px solid ${theme.accent_color}66` }}
        />
      ) : (
        <div
          className="h-12 w-12 mt-2 flex items-center justify-center text-sm font-semibold"
          style={{
            borderRadius: avatarRadius(theme.avatar_shape),
            backgroundColor: theme.accent_color + '33',
            border: `1.5px solid ${theme.accent_color}66`,
          }}
        >
          {(profile.display_name || profile.username).slice(0, 1).toUpperCase()}
        </div>
      )}
      <p className="text-xs font-semibold mt-2 text-center" style={{ fontFamily: theme.font.heading }}>
        {profile.display_name || `@${profile.username}`}
      </p>
      {profile.bio && (
        <p className="text-[9px] mt-1 text-center opacity-70 line-clamp-2">{profile.bio}</p>
      )}
      <div className="w-full flex flex-col gap-2 mt-3">
        {sample.map((l) => {
          const s: React.CSSProperties = {
            borderRadius: buttonRadius(theme.button.shape),
            fontFamily: theme.font.heading,
          }
          if (theme.button.style === 'outline') {
            s.border = `1px solid ${theme.text_color}55`
            s.color = theme.text_color
          } else {
            s.backgroundColor = theme.button.fill
            s.color = theme.button.text
            if (theme.button.style === 'glass') s.border = '1px solid #FFFFFF33'
          }
          return (
            <div key={l.id} className="h-8 w-full flex items-center justify-center text-[9px] font-medium px-2 truncate" style={s}>
              {l.title}
            </div>
          )
        })}
      </div>
      <p className="text-[8px] mt-auto pt-3 opacity-50">Made with Lynkit</p>
    </div>
  )
}

/* ---------- theme preset card ---------- */

function PresetCard({
  id,
  name,
  selected,
  onSelect,
}: {
  id: string
  name: string
  selected: boolean
  onSelect: () => void
}) {
  const c = PRESETS[id]?.config
  if (!c) return null
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-[12px] border p-2 transition-colors cursor-pointer text-left ${
        selected ? 'border-silver' : 'border-steel hover:border-silver/50'
      }`}
    >
      <div
        className="rounded-[8px] aspect-[9/12] p-2 flex flex-col items-center gap-1.5"
        style={backgroundStyle(c.background)}
      >
        <div
          className="h-4 w-4 mt-1"
          style={{
            backgroundColor: c.accent_color,
            borderRadius: c.avatar_shape === 'circle' ? '999px' : '2px',
            opacity: 0.85,
          }}
        />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 w-full"
            style={{
              borderRadius: buttonRadius(c.button.shape),
              backgroundColor: c.button.style === 'outline' ? 'transparent' : c.button.fill,
              border: `1px solid ${c.button.style === 'outline' ? c.text_color + '66' : 'transparent'}`,
            }}
          />
        ))}
      </div>
      <p className={`mono-label mt-2 ${selected ? '' : 'text-mist'}`}>{name}</p>
    </button>
  )
}

/* ---------- customizer controls ---------- */

const selectClass =
  'w-full min-h-9 rounded-[8px] bg-obsidian border border-steel px-2.5 text-sm text-platinum focus:border-silver transition-colors'

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-platinum">{label}</span>
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-8 w-12 rounded-[6px] border border-steel bg-obsidian cursor-pointer"
      />
    </label>
  )
}

export function Appearance() {
  const { profile: initial } = useOutletContext<{ profile: Profile }>()
  const toast = useToast()
  const [profile, setProfile] = useState(initial)
  const [links, setLinks] = useState<Link[]>([])
  const [themeRows, setThemeRows] = useState<ThemeRow[]>([])
  const [customizing, setCustomizing] = useState(Boolean(initial.custom_theme))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('links')
      .select('*')
      .eq('user_id', profile.id)
      .eq('visible', true)
      .order('sort_order')
      .then(({ data }) => setLinks((data as Link[]) ?? []))
    void supabase
      .from('themes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setThemeRows((data as ThemeRow[]) ?? []))
  }, [profile.id])

  const theme = useMemo(() => resolveTheme(profile), [profile])
  const availablePresets = themeRows.length
    ? themeRows.filter((r) => PRESETS[r.id]).map((r) => ({ id: r.id, name: r.name }))
    : Object.entries(PRESETS).map(([id, p]) => ({ id, name: p.name }))

  function patchCustom(patch: Partial<ThemeConfig>) {
    setProfile((p) => ({
      ...p,
      custom_theme: {
        ...(p.custom_theme ?? {}),
        ...patch,
        button: patch.button
          ? { ...resolveTheme(p).button, ...(p.custom_theme?.button ?? {}), ...patch.button }
          : p.custom_theme?.button,
        font: patch.font
          ? { ...resolveTheme(p).font, ...(p.custom_theme?.font ?? {}), ...patch.font }
          : p.custom_theme?.font,
      },
    }))
  }

  async function handleBgImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !supabase) return
    const path = `${profile.id}/bg-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
    const { error } = await supabase.storage.from('avatars').upload(path, file)
    if (error) {
      toast('Upload failed: ' + error.message, 'danger')
      return
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    patchCustom({ background: { type: 'image', value: data.publicUrl } })
  }

  async function save(next?: Partial<Profile>) {
    if (!supabase) {
      toast('Backend not configured', 'danger')
      return
    }
    const merged = { ...profile, ...next }
    setProfile(merged)
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ theme_id: merged.theme_id, custom_theme: merged.custom_theme })
      .eq('id', profile.id)
    setSaving(false)
    if (error) toast('Save failed: ' + error.message, 'danger')
    else toast('Theme saved — live on your page')
  }

  return (
    <div>
      <p className="mono-label">Appearance</p>
      <h1 className="display text-platinum text-xl mt-1 mb-6">Your page, your brand</h1>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {availablePresets.map(({ id, name }) => (
              <PresetCard
                key={id}
                id={id}
                name={name}
                selected={profile.theme_id === id && !profile.custom_theme}
                onSelect={() => void save({ theme_id: id, custom_theme: null })}
              />
            ))}
          </div>

          <div className="mt-8 border-t border-steel pt-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="mono-label">Customize</p>
                <p className="text-mist text-xs mt-1">
                  Start from “{PRESETS[profile.theme_id]?.name ?? 'Obsidian'}” and override anything. Free.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizing((c) => !c)}
                className={btnSecondary}
              >
                {customizing ? 'Hide controls' : 'Customize'}
              </button>
            </div>

            {customizing && (
              <div className="mt-5 flex flex-col gap-5 max-w-md">
                <div>
                  <FieldLabel>Background</FieldLabel>
                  <div className="flex gap-2 flex-wrap items-center">
                    <input
                      type="color"
                      aria-label="Background color"
                      value={
                        theme.background.type === 'solid' &&
                        /^#[0-9a-fA-F]{6}$/.test(theme.background.value)
                          ? theme.background.value
                          : '#060607'
                      }
                      onChange={(e) =>
                        patchCustom({ background: { type: 'solid', value: e.target.value } })
                      }
                      className="h-8 w-12 rounded-[6px] border border-steel bg-obsidian cursor-pointer"
                    />
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => {
                        const from = prompt('Gradient start color (hex):', '#0A1128')
                        const to = prompt('Gradient end color (hex):', '#1B2A52')
                        if (from && to) {
                          patchCustom({
                            background: {
                              type: 'gradient',
                              value: `linear-gradient(180deg,${from},${to})`,
                            },
                          })
                        }
                      }}
                    >
                      Gradient…
                    </button>
                    <label className={btnSecondary + ' inline-flex items-center cursor-pointer'}>
                      Upload image
                      <input type="file" accept="image/*" className="sr-only" onChange={handleBgImage} />
                    </label>
                  </div>
                </div>

                <ColorField
                  label="Text color"
                  value={theme.text_color}
                  onChange={(v) => patchCustom({ text_color: v })}
                />
                <ColorField
                  label="Accent color"
                  value={theme.accent_color}
                  onChange={(v) => patchCustom({ accent_color: v })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <FieldLabel>Button shape</FieldLabel>
                    <select
                      value={theme.button.shape}
                      onChange={(e) =>
                        patchCustom({
                          button: { ...theme.button, shape: e.target.value as ThemeConfig['button']['shape'] },
                        })
                      }
                      className={selectClass}
                    >
                      <option value="rounded">Rounded</option>
                      <option value="pill">Pill</option>
                      <option value="square">Square</option>
                    </select>
                  </label>
                  <label>
                    <FieldLabel>Button style</FieldLabel>
                    <select
                      value={theme.button.style}
                      onChange={(e) =>
                        patchCustom({
                          button: { ...theme.button, style: e.target.value as ThemeConfig['button']['style'] },
                        })
                      }
                      className={selectClass}
                    >
                      <option value="solid">Solid</option>
                      <option value="outline">Outline</option>
                      <option value="soft">Soft</option>
                      <option value="glass">Glass</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ColorField
                    label="Button fill"
                    value={theme.button.fill}
                    onChange={(v) => patchCustom({ button: { ...theme.button, fill: v } })}
                  />
                  <ColorField
                    label="Button text"
                    value={theme.button.text}
                    onChange={(v) => patchCustom({ button: { ...theme.button, text: v } })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <FieldLabel>Heading font</FieldLabel>
                    <select
                      value={theme.font.heading}
                      onChange={(e) => patchCustom({ font: { ...theme.font, heading: e.target.value } })}
                      className={selectClass}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <FieldLabel>Body font</FieldLabel>
                    <select
                      value={theme.font.body}
                      onChange={(e) => patchCustom({ font: { ...theme.font, body: e.target.value } })}
                      className={selectClass}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  <FieldLabel>Avatar shape</FieldLabel>
                  <select
                    value={theme.avatar_shape}
                    onChange={(e) =>
                      patchCustom({ avatar_shape: e.target.value as ThemeConfig['avatar_shape'] })
                    }
                    className={selectClass + ' max-w-[180px]'}
                  >
                    <option value="circle">Circle</option>
                    <option value="rounded">Rounded</option>
                    <option value="square">Square</option>
                  </select>
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving}
                    className={btnPrimary + ' flex-1'}
                  >
                    {saving ? 'Saving…' : 'Save customization'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void save({ custom_theme: null })}
                    className={btnSecondary}
                  >
                    Reset to preset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="order-first lg:order-none">
          <p className="mono-label mb-3 text-center">Live preview</p>
          <PagePreview profile={profile} theme={theme} links={links} />
        </div>
      </div>
    </div>
  )
}

export { DEFAULT_THEME_ID }
