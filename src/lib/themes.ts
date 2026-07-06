import type { Profile, ThemeConfig } from './types'

/**
 * The 22 preset themes. The DB `themes` table controls availability and
 * picker order; the visual configs are the source of truth here so previews
 * and public pages render without an extra fetch.
 */

const t = (c: ThemeConfig) => c

export const PRESETS: Record<string, { name: string; config: ThemeConfig }> = {
  obsidian: {
    name: 'Obsidian',
    config: t({
      background: { type: 'solid', value: '#060607' },
      text_color: '#EDEFF2',
      accent_color: '#C7CBD1',
      button: { shape: 'rounded', style: 'outline', fill: '#101114', text: '#EDEFF2' },
      font: { heading: 'Inter Tight', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  paper: {
    name: 'Paper',
    config: t({
      background: { type: 'solid', value: '#FAFAF8' },
      text_color: '#1A1A1A',
      accent_color: '#666666',
      button: { shape: 'rounded', style: 'outline', fill: '#FFFFFF', text: '#1A1A1A' },
      font: { heading: 'Inter Tight', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  noir: {
    name: 'Noir',
    config: t({
      background: { type: 'solid', value: '#000000' },
      text_color: '#FFFFFF',
      accent_color: '#FFFFFF',
      button: { shape: 'square', style: 'solid', fill: '#FFFFFF', text: '#000000' },
      font: { heading: 'Space Grotesk', body: 'Inter' },
      avatar_shape: 'square',
    }),
  },
  sterling: {
    name: 'Sterling',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(180deg,#E8EAED,#C9CDD3)' },
      text_color: '#26282C',
      accent_color: '#5A5F66',
      button: { shape: 'rounded', style: 'solid', fill: '#FFFFFF', text: '#26282C' },
      font: { heading: 'Inter Tight', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  midnight: {
    name: 'Midnight',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(180deg,#0A1128,#1B2A52)' },
      text_color: '#E6ECFF',
      accent_color: '#7FA3FF',
      button: { shape: 'rounded', style: 'soft', fill: '#22346611', text: '#E6ECFF' },
      font: { heading: 'Sora', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  ocean: {
    name: 'Ocean',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(160deg,#0E4B75,#123B5C 55%,#0A2A44)' },
      text_color: '#EAF6FF',
      accent_color: '#63C7FF',
      button: { shape: 'pill', style: 'soft', fill: '#FFFFFF14', text: '#EAF6FF' },
      font: { heading: 'DM Sans', body: 'DM Sans' },
      avatar_shape: 'circle',
    }),
  },
  aurora: {
    name: 'Aurora',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(150deg,#052C27,#0B5D4E 55%,#0E7A5D)' },
      text_color: '#E9FFF8',
      accent_color: '#57E6B4',
      button: { shape: 'pill', style: 'outline', fill: '#0B463B', text: '#E9FFF8' },
      font: { heading: 'Manrope', body: 'Manrope' },
      avatar_shape: 'circle',
    }),
  },
  forest: {
    name: 'Forest',
    config: t({
      background: { type: 'solid', value: '#12211A' },
      text_color: '#E8F2EA',
      accent_color: '#8FBC8F',
      button: { shape: 'rounded', style: 'soft', fill: '#1D3327', text: '#E8F2EA' },
      font: { heading: 'Lora', body: 'Inter' },
      avatar_shape: 'rounded',
    }),
  },
  sunset: {
    name: 'Sunset',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(170deg,#3B1220,#8A3324 55%,#D96C3A)' },
      text_color: '#FFF3E9',
      accent_color: '#FFB27D',
      button: { shape: 'pill', style: 'soft', fill: '#FFFFFF17', text: '#FFF3E9' },
      font: { heading: 'Poppins', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  ember: {
    name: 'Ember',
    config: t({
      background: { type: 'solid', value: '#120D0B' },
      text_color: '#F5EBE6',
      accent_color: '#FF6B35',
      button: { shape: 'rounded', style: 'outline', fill: '#1D1512', text: '#F5EBE6' },
      font: { heading: 'Space Grotesk', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  rosegold: {
    name: 'Rose Gold',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(165deg,#F9E7E2,#F2CFC4)' },
      text_color: '#4A2F2A',
      accent_color: '#B76E5A',
      button: { shape: 'pill', style: 'solid', fill: '#FFFFFF', text: '#4A2F2A' },
      font: { heading: 'Playfair Display', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  bubblegum: {
    name: 'Bubblegum',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(180deg,#FFD6E8,#FFC2DD)' },
      text_color: '#59243F',
      accent_color: '#E4569B',
      button: { shape: 'pill', style: 'solid', fill: '#FFFFFF', text: '#D6407F' },
      font: { heading: 'Poppins', body: 'Poppins' },
      avatar_shape: 'circle',
    }),
  },
  lavender: {
    name: 'Lavender',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(180deg,#EFE9FB,#DCD2F2)' },
      text_color: '#372B52',
      accent_color: '#7C63C5',
      button: { shape: 'rounded', style: 'soft', fill: '#FFFFFFB0', text: '#372B52' },
      font: { heading: 'DM Sans', body: 'DM Sans' },
      avatar_shape: 'circle',
    }),
  },
  grape: {
    name: 'Grape',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(160deg,#2A0F3D,#4A1B69)' },
      text_color: '#F3E8FF',
      accent_color: '#C084FC',
      button: { shape: 'rounded', style: 'soft', fill: '#FFFFFF14', text: '#F3E8FF' },
      font: { heading: 'Sora', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  sand: {
    name: 'Sand',
    config: t({
      background: { type: 'solid', value: '#EFE6D8' },
      text_color: '#4A3F2E',
      accent_color: '#A67C52',
      button: { shape: 'rounded', style: 'outline', fill: '#F7F1E7', text: '#4A3F2E' },
      font: { heading: 'Lora', body: 'Inter' },
      avatar_shape: 'rounded',
    }),
  },
  cream: {
    name: 'Cream',
    config: t({
      background: { type: 'solid', value: '#FBF5EA' },
      text_color: '#3E3527',
      accent_color: '#8C6F3F',
      button: { shape: 'square', style: 'outline', fill: '#FFFDF8', text: '#3E3527' },
      font: { heading: 'Playfair Display', body: 'Lora' },
      avatar_shape: 'circle',
    }),
  },
  ivory: {
    name: 'Ivory',
    config: t({
      background: { type: 'solid', value: '#F7F6F2' },
      text_color: '#33322E',
      accent_color: '#9C978A',
      button: { shape: 'pill', style: 'soft', fill: '#EBE9E2', text: '#33322E' },
      font: { heading: 'Manrope', body: 'Manrope' },
      avatar_shape: 'circle',
    }),
  },
  slate: {
    name: 'Slate',
    config: t({
      background: { type: 'solid', value: '#2B3038' },
      text_color: '#E2E6EB',
      accent_color: '#94A3B8',
      button: { shape: 'rounded', style: 'soft', fill: '#3A414C', text: '#E2E6EB' },
      font: { heading: 'Inter Tight', body: 'Inter' },
      avatar_shape: 'rounded',
    }),
  },
  neon: {
    name: 'Neon',
    config: t({
      background: { type: 'solid', value: '#0A0A0F' },
      text_color: '#F2F2F7',
      accent_color: '#00FFA3',
      button: { shape: 'square', style: 'outline', fill: '#0F0F17', text: '#00FFA3' },
      font: { heading: 'Space Grotesk', body: 'Space Grotesk' },
      avatar_shape: 'square',
    }),
  },
  glass: {
    name: 'Glass',
    config: t({
      background: { type: 'gradient', value: 'linear-gradient(160deg,#3E4C63,#22293A 60%,#1A1F2D)' },
      text_color: '#F4F7FB',
      accent_color: '#B7C7E0',
      button: { shape: 'rounded', style: 'glass', fill: '#FFFFFF1A', text: '#F4F7FB' },
      font: { heading: 'Inter Tight', body: 'Inter' },
      avatar_shape: 'circle',
    }),
  },
  mono: {
    name: 'Mono',
    config: t({
      background: { type: 'solid', value: '#FFFFFF' },
      text_color: '#000000',
      accent_color: '#000000',
      button: { shape: 'square', style: 'outline', fill: '#FFFFFF', text: '#000000' },
      font: { heading: 'IBM Plex Mono', body: 'IBM Plex Mono' },
      avatar_shape: 'square',
    }),
  },
  carbon: {
    name: 'Carbon',
    config: t({
      background: {
        type: 'gradient',
        value:
          'repeating-linear-gradient(45deg,#0C0D0F 0,#0C0D0F 3px,#101114 3px,#101114 6px)',
      },
      text_color: '#DADEE3',
      accent_color: '#9AA3AD',
      button: { shape: 'rounded', style: 'solid', fill: '#1A1C20', text: '#DADEE3' },
      font: { heading: 'Sora', body: 'Inter' },
      avatar_shape: 'rounded',
    }),
  },
}

export const DEFAULT_THEME_ID = 'obsidian'

/** Curated Google Fonts for the customizer. */
export const FONT_OPTIONS = [
  'Inter',
  'Inter Tight',
  'DM Sans',
  'Space Grotesk',
  'Manrope',
  'Sora',
  'Poppins',
  'Lora',
  'Playfair Display',
  'Crimson Pro',
  'IBM Plex Mono',
  'JetBrains Mono',
]

/** Base preset merged with the profile's custom overrides. */
export function resolveTheme(profile: Pick<Profile, 'theme_id' | 'custom_theme'>): ThemeConfig {
  const base = (PRESETS[profile.theme_id] ?? PRESETS[DEFAULT_THEME_ID]).config
  const c = profile.custom_theme
  if (!c) return base
  return {
    background: c.background ?? base.background,
    text_color: c.text_color ?? base.text_color,
    accent_color: c.accent_color ?? base.accent_color,
    button: { ...base.button, ...(c.button ?? {}) },
    font: { ...base.font, ...(c.font ?? {}) },
    avatar_shape: c.avatar_shape ?? base.avatar_shape,
  }
}

/** CSS for a theme background on any element. */
export function backgroundStyle(bg: ThemeConfig['background']): React.CSSProperties {
  if (bg.type === 'image') {
    return { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (bg.type === 'gradient') return { backgroundImage: bg.value }
  return { backgroundColor: bg.value }
}

export function buttonRadius(shape: ThemeConfig['button']['shape']): string {
  return shape === 'pill' ? '999px' : shape === 'square' ? '4px' : '12px'
}

export function avatarRadius(shape: ThemeConfig['avatar_shape']): string {
  return shape === 'circle' ? '999px' : shape === 'rounded' ? '18px' : '6px'
}

const loadedFonts = new Set<string>()

/** Inject a Google Fonts stylesheet for the theme's fonts (idempotent). */
export function ensureFonts(fonts: string[]): void {
  const need = [...new Set(fonts)].filter((f) => !loadedFonts.has(f))
  if (need.length === 0) return
  need.forEach((f) => loadedFonts.add(f))
  const families = need
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  document.head.appendChild(link)
}
