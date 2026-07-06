export interface Link {
  id: string
  title: string
  category: string | null
  subtitle: string | null
  description: string | null
  url: string
  icon: string | null
  featured: boolean
  visible: boolean
  open_new_tab: boolean
  sort_order: number
  click_count: number
  created_at: string
  updated_at: string
}

export type LinkInput = Omit<Link, 'id' | 'click_count' | 'created_at' | 'updated_at'>

export interface Settings {
  display_name: string
  tagline: string
  bio: string
  avatar_url: string
  og_image_url: string
  instagram_url: string
  tiktok_url: string
  x_url: string
  facebook_url: string
}

export type SettingsKey = keyof Settings

export interface LinkClick {
  id: string
  link_id: string
  clicked_at: string
  referrer: string | null
}

export interface PageView {
  id: string
  referrer: string | null
  created_at: string
}
