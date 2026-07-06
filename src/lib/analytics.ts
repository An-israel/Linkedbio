import { supabase } from './supabase'

/** Fire-and-forget wrappers around the anon-callable RPCs. */

export function registerLinkClick(linkId: string): void {
  if (!supabase) return
  void supabase
    .rpc('register_link_click', { p_link_id: linkId, p_referrer: document.referrer || null })
    .then(({ error }) => {
      if (error) console.warn('register_link_click failed:', error.message)
    })
}

const viewedProfiles = new Set<string>()
export function registerPageView(profileId: string): void {
  if (!supabase || viewedProfiles.has(profileId)) return
  viewedProfiles.add(profileId)
  void supabase
    .rpc('register_page_view', { p_profile_id: profileId, p_referrer: document.referrer || null })
    .then(({ error }) => {
      if (error) console.warn('register_page_view failed:', error.message)
    })
}

export function registerPromoClick(sourceType: 'banner' | 'slide' | 'popup', sourceId: string): void {
  if (!supabase) return
  void supabase
    .rpc('register_promo_click', { p_source_type: sourceType, p_source_id: sourceId })
    .then(({ error }) => {
      if (error) console.warn('register_promo_click failed:', error.message)
    })
}

export async function submitReport(profileId: string, reason: string): Promise<string | null> {
  if (!supabase) return 'Reporting is unavailable right now.'
  // stable per-browser ref so the backend can rate-limit repeat reporters
  let ref = localStorage.getItem('lynkit_reporter_ref')
  if (!ref) {
    ref = crypto.randomUUID()
    localStorage.setItem('lynkit_reporter_ref', ref)
  }
  const { error } = await supabase.rpc('submit_report', {
    p_profile_id: profileId,
    p_reason: reason,
    p_reporter_ref: ref,
  })
  return error ? error.message : null
}
