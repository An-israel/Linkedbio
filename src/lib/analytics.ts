import { supabase } from './supabase'

/**
 * Fire-and-forget click registration. Calls the atomic `register_click` RPC
 * (inserts a link_clicks row + increments links.click_count). Never blocks
 * or breaks navigation if the backend is unavailable.
 */
export function registerClick(linkId: string): void {
  if (!supabase || linkId.startsWith('seed-')) return
  void supabase
    .rpc('register_click', {
      p_link_id: linkId,
      p_referrer: document.referrer || null,
    })
    .then(({ error }) => {
      if (error) console.warn('register_click failed:', error.message)
    })
}

/** Log one page view per session load. */
let viewLogged = false
export function logPageView(): void {
  if (!supabase || viewLogged) return
  viewLogged = true
  void supabase
    .from('page_views')
    .insert({ referrer: document.referrer || null })
    .then(({ error }) => {
      if (error) console.warn('page_views insert failed:', error.message)
    })
}
