# Lynkit — Link it all.

A free, multi-tenant link-in-bio SaaS by Aniekan Israel. Anyone signs up, claims a
username, gets a public page at `lynkit.link/username`, and styles it with one of
22 themes or full custom controls. The owner runs a super-admin that pushes
product promotions across the app chrome (never onto users' public pages).

## Two visual worlds

1. **App chrome** (landing, auth, dashboard, super-admin): fixed **Obsidian &
   Sterling** design system — silver & black, mono label layer.
2. **Public pages** (`/:username`): fully themeable by each user — 22 presets +
   custom background/buttons/fonts/colors. Neither world leaks into the other.

## Features

- **Public page** — avatar, bio, socials, link stack. Links with a description
  open a themed popup with a "Visit site" button; links without one go direct.
  Featured links get a spotlight. "Made with Lynkit" badge + report affordance.
- **Dashboard** — drag-to-reorder link manager (50-link cap), URL safety
  validation, theme gallery + full customizer with live preview, personal
  analytics (views, clicks, CTR, 30-day chart), settings with username change
  and account deletion.
- **Super-admin** — platform overview, promo engine (banners / slideshow /
  frequency-capped popups with click tracking), user search + suspend,
  moderation queue (reports + flagged links), platform analytics, theme
  availability controls.
- **Abuse safety** — reserved + filtered usernames (DB-enforced), link-shortener
  and suspicious-URL blocklist, per-user link cap (DB trigger), rate-limited
  public reports, RLS tenant isolation, suspended pages return a neutral state.
- **Promotion restraint** — promos never appear on user pages; popups are
  frequency-capped, never fire on a first visit, max one per session.

## Stack

React 19 + TypeScript + Vite (route-level code splitting) + Tailwind v4,
React Router, Supabase (Postgres + RLS, Auth, Storage), dnd-kit.

## Routes

| Route | What |
|---|---|
| `/` | Marketing landing + owner promos |
| `/signup`, `/login` | Auth with live username availability |
| `/dashboard/*` | User control panel (auth-gated) |
| `/admin/*` | Owner super-admin (`profiles.is_owner`) |
| `/terms`, `/privacy` | Legal |
| `/:username` | Public themed bio page (kept last; reserved routes win) |

## Setup

1. ```sh
   npm install
   cp .env.example .env   # Supabase URL + anon key
   npm run dev
   ```
2. Run migrations in the Supabase SQL editor, in order:
   - `supabase/migrations/0001_init.sql` (original single-tenant schema)
   - `supabase/migrations/0002_lynkit.sql` (multi-tenant pivot: profiles,
     themes, promos, reports, RLS, RPCs, buckets — migrates existing owner data)
3. Sign up through the app, then make yourself the owner:
   ```sql
   update public.profiles set is_owner = true where username = 'your-username';
   ```
4. Deploy (Vercel): `vercel.json` handles SPA rewrites; env vars are read at
   build time.

## Post-launch checklist

- [ ] Register **lynkit.link** (fallbacks: trylynkit.com, uselynkit.com); quick
      trademark check in your category
- [ ] Verify RLS with a second account (cannot see or edit the first's links)
- [ ] QA all 22 themes on a real phone
- [ ] Add first promos; confirm popup frequency caps
- [ ] Google Search Console + Safe Browsing registration
- [ ] Confirm the report → moderation loop end to end

## Security model

- Anonymous: read active profiles/visible unflagged links/active themes+promos;
  insert clicks/views via RPCs; submit rate-limited reports. Nothing else.
- Authenticated user: full CRUD on **their own** profile and links only —
  enforced by RLS + DB triggers (privileged columns frozen for non-owners).
- Owner: platform-wide read/moderate/promo rights via `is_owner`.
