/** Client-side mirrors of the DB-enforced rules, for instant feedback. */

export const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'dashboard', 'login', 'logout', 'signup', 'signin',
  'register', 'api', 'settings', 'about', 'terms', 'privacy', 'support', 'help',
  'www', 'root', 'mail', 'email', 'billing', 'app', 'apps', 'assets', 'static',
  'public', 'blog', 'docs', 'status', 'security', 'abuse', 'legal', 'contact',
  'official', 'lynkit', 'moderator', 'mod', 'staff', 'team', 'owner', 'system',
  'null', 'undefined', 'me', 'you', 'new', 'edit', 'delete', 'verify',
  'verified', 'account', 'accounts', 'auth', 'oauth', 'password', 'reset',
  '404', 'index',
])

const OFFENSIVE = /(fuck|shit|bitch|cunt|nigg|rape|nazi|hitler|porn|sex)/i

/** Returns null when valid, else a human error message. */
export function validateUsername(raw: string): string | null {
  const u = raw.trim().toLowerCase()
  if (u.length < 3 || u.length > 30) return 'Username must be 3–30 characters.'
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(u)) {
    return 'Use lowercase letters, numbers, hyphens, underscores.'
  }
  if (RESERVED_USERNAMES.has(u)) return 'That username is reserved.'
  if (OFFENSIVE.test(u)) return 'That username is not allowed.'
  return null
}

/**
 * Domains that must never be link targets — known URL-shortener chains and
 * schemes abused for phishing. Extend as the moderation queue teaches you.
 */
const BLOCKED_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 'is.gd', 'cutt.ly', 't.co', 'rb.gy',
  'shorturl.at', 'tiny.cc', 'rebrand.ly', 's.id', 'v.gd', 'ow.ly',
  'grabify.link', 'iplogger.org', 'iplogger.com', '2no.co', 'blasze.tk',
])

const SUSPICIOUS_PATTERNS = [
  /@/, // credentials-in-URL trick: https://paypal.com@evil.com
  /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // raw IPs
  /xn--/, // punycode homographs
]

/** Returns null when the URL is acceptable, else an error message. */
export function validateLinkUrl(raw: string): string | null {
  const value = raw.trim()
  if (!/^https?:\/\//i.test(value)) return 'URL must start with http:// or https://'
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return 'That URL is not valid.'
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
  if (BLOCKED_DOMAINS.has(host)) {
    return 'Link shorteners are not allowed — use the destination URL directly.'
  }
  for (const p of SUSPICIOUS_PATTERNS) {
    if (p.test(value)) return 'That URL looks unsafe and cannot be saved.'
  }
  if (!host.includes('.')) return 'That URL is not valid.'
  return null
}

/** Plain http(s) URL check for social/profile fields. */
export function isValidHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
