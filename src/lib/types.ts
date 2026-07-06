export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  theme_id: string
  custom_theme: Partial<ThemeConfig> | null
  socials: Socials
  is_owner: boolean
  status: 'active' | 'suspended'
  page_views: number
  created_at: string
  updated_at: string
}

export interface Socials {
  instagram?: string
  tiktok?: string
  x?: string
  youtube?: string
  facebook?: string
}

export interface Link {
  id: string
  user_id: string
  title: string
  category: string | null
  subtitle: string | null
  description: string | null
  url: string
  icon: string | null
  featured: boolean
  visible: boolean
  open_new_tab: boolean
  flagged: boolean
  sort_order: number
  click_count: number
  created_at: string
}

export type LinkInput = Omit<Link, 'id' | 'click_count' | 'created_at' | 'flagged'>

export interface ThemeConfig {
  background: { type: 'solid' | 'gradient' | 'image'; value: string }
  text_color: string
  accent_color: string
  button: {
    shape: 'rounded' | 'pill' | 'square'
    style: 'solid' | 'outline' | 'soft' | 'glass'
    fill: string
    text: string
  }
  font: { heading: string; body: string }
  avatar_shape: 'circle' | 'rounded' | 'square'
}

export interface ThemeRow {
  id: string
  name: string
  config: Partial<ThemeConfig>
  is_active: boolean
  sort_order: number
}

export interface PromoBanner {
  id: string
  title: string
  body: string | null
  image_url: string | null
  link_url: string
  placement: 'landing_hero' | 'landing_band' | 'dashboard_top'
  active: boolean
  sort_order: number
  created_at: string
}

export interface PromoSlide {
  id: string
  image_url: string
  caption: string | null
  link_url: string
  surface: 'landing' | 'dashboard' | 'both'
  active: boolean
  sort_order: number
  created_at: string
}

export interface PromoPopup {
  id: string
  title: string
  body: string | null
  image_url: string | null
  link_url: string
  surface: 'landing' | 'dashboard' | 'both'
  frequency: 'once_session' | 'once_day' | 'every_n'
  every_n: number
  active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export interface Report {
  id: string
  profile_id: string
  reason: string
  reporter_ref: string | null
  resolved: boolean
  created_at: string
}

export const LINK_CAP = 50
