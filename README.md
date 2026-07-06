# Aniekan Israel — Link Hub

A one-page, mobile-first link-in-bio site with popup descriptions and a full admin
dashboard. Design system: **Obsidian & Sterling** — obsidian surfaces, sterling
accents, mono label layer.

## How it works

- `/` — the public hub. Profile header, social icon row, and a vertical stack of
  link buttons. Tapping a button **with a description** opens a popup with the
  blurb and a "Visit site" action; buttons **without** one open their URL directly.
  Every visit and click is tracked.
- `/admin` — protected dashboard (Supabase Auth). Manage links (add / edit /
  delete / drag-to-reorder / show-hide / feature), appearance (name, tagline, bio,
  socials, avatar + OG image uploads), and analytics (views, clicks, CTR, top
  links, 30-day charts).

## Stack

React 19 + TypeScript + Vite + Tailwind v4, React Router, Supabase
(Postgres + RLS, Auth, Storage), dnd-kit for drag-to-reorder.

## Setup

1. **Install & run**

   ```sh
   npm install
   cp .env.example .env   # fill in your Supabase URL + anon key
   npm run dev
   ```

   Without env vars the public page renders built-in seed data, so you can
   develop the UI with no backend.

2. **Create the Supabase project** and run the migration:

   ```sh
   # in the Supabase SQL editor, paste and run:
   supabase/migrations/0001_init.sql
   ```

   This creates the `links`, `link_clicks`, `page_views`, `settings`, and
   `profiles` tables, all RLS policies, the atomic `register_click` RPC, the
   public `hub-assets` storage bucket, and seeds the initial links + settings.

3. **Create the admin user**: add a user in Supabase Auth (email + password —
   no public signup exists), then flag it as admin:

   ```sql
   insert into public.profiles (id, is_admin)
   values ('<auth-user-uuid>', true)
   on conflict (id) do update set is_admin = true;
   ```

4. **Deploy** (Vercel/Netlify): set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` env vars. `vercel.json` already rewrites all routes
   to `index.html` for the SPA.

## Post-launch checklist

- [ ] Connect a short custom domain
- [ ] Upload the real avatar + OG share image in **Admin → Appearance**
- [ ] Replace placeholder URLs (portfolio, SceneForge, socials) in **Admin → Links**
- [ ] Confirm RLS: anonymous visitors can read visible links and insert clicks,
      but cannot read `link_clicks`
- [ ] Paste the final link into all social bios
- [ ] Test on a real phone: popup link, direct link, share preview

## Security model

- Anonymous: `SELECT` on visible links + settings, `INSERT` on
  `link_clicks`/`page_views` (via RPC / direct insert). Nothing else.
- Admin (authenticated + `profiles.is_admin = true`): full CRUD on links and
  settings, read access to analytics, write access to the `hub-assets` bucket.
