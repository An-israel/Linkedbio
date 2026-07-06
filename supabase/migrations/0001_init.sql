-- Aniekan Israel link hub — full schema, RLS, click RPC, storage, and seed.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  subtitle text,
  description text,          -- if present the public page opens a popup; if null it links directly
  url text not null,
  icon text,
  featured boolean not null default false,
  visible boolean not null default true,
  open_new_tab boolean not null default true,
  sort_order int not null default 0,
  click_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  referrer text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false
);

create index if not exists link_clicks_link_id_idx on public.link_clicks (link_id, clicked_at);
create index if not exists page_views_created_at_idx on public.page_views (created_at);
create index if not exists links_sort_order_idx on public.links (sort_order);

-- ============================================================
-- Admin check helper (security definer so RLS policies can use it
-- without recursing into profiles' own policies)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- Row-Level Security
-- ============================================================

alter table public.links enable row level security;
alter table public.link_clicks enable row level security;
alter table public.page_views enable row level security;
alter table public.settings enable row level security;
alter table public.profiles enable row level security;

-- links: public read of visible rows; admin sees and writes everything
create policy "public read visible links"
  on public.links for select
  using (visible = true or public.is_admin());

create policy "admin insert links"
  on public.links for insert
  to authenticated
  with check (public.is_admin());

create policy "admin update links"
  on public.links for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin delete links"
  on public.links for delete
  to authenticated
  using (public.is_admin());

-- settings: public read; admin write
create policy "public read settings"
  on public.settings for select
  using (true);

create policy "admin insert settings"
  on public.settings for insert
  to authenticated
  with check (public.is_admin());

create policy "admin update settings"
  on public.settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin delete settings"
  on public.settings for delete
  to authenticated
  using (public.is_admin());

-- link_clicks: anyone can insert (click logging); only admin can read
create policy "anon insert link_clicks"
  on public.link_clicks for insert
  with check (true);

create policy "admin read link_clicks"
  on public.link_clicks for select
  using (public.is_admin());

-- page_views: anyone can insert; only admin can read
create policy "anon insert page_views"
  on public.page_views for insert
  with check (true);

create policy "admin read page_views"
  on public.page_views for select
  using (public.is_admin());

-- profiles: users can read their own row (needed for the admin gate)
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- ============================================================
-- Atomic click registration RPC (callable by anon)
-- ============================================================

create or replace function public.register_click(p_link_id uuid, p_referrer text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.link_clicks (link_id, referrer) values (p_link_id, p_referrer);
  update public.links set click_count = click_count + 1 where id = p_link_id;
end;
$$;

grant execute on function public.register_click(uuid, text) to anon, authenticated;

-- ============================================================
-- Storage: hub-assets bucket (public read, admin write)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('hub-assets', 'hub-assets', true)
on conflict (id) do nothing;

create policy "public read hub-assets"
  on storage.objects for select
  using (bucket_id = 'hub-assets');

create policy "admin write hub-assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'hub-assets' and public.is_admin());

create policy "admin update hub-assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'hub-assets' and public.is_admin());

create policy "admin delete hub-assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'hub-assets' and public.is_admin());

-- ============================================================
-- Seed data
-- ============================================================

insert into public.settings (key, value) values
  ('display_name', '"ANIEKAN ISRAEL"'),
  ('tagline', '"LIGHT TO THE WORLD · MASSIVE EXECUTION"'),
  ('bio', '"Full-stack & AI engineer. Founder. I build things that ship."'),
  ('avatar_url', '""'),
  ('og_image_url', '""'),
  ('instagram_url', '"https://instagram.com/creativeeazy"'),
  ('tiktok_url', '"https://tiktok.com/@creativeeazy"'),
  ('x_url', '"https://x.com/creativeeazy"'),
  ('facebook_url', '"https://facebook.com/creativeeazy"')
on conflict (key) do nothing;

insert into public.links (title, category, description, url, featured, sort_order) values
  (
    'SkryveAI', 'AI PLATFORM',
    'My AI-powered client acquisition platform for freelancers. It finds you clients, optimizes your CV against any job, and scores your applications so you stop getting filtered out. Built end to end.',
    'https://skryveai.com', true, 0
  ),
  (
    'NexxosHQ', 'B2B SAAS',
    'The operating system for African businesses. HR, tasks, attendance, messaging, and OKRs in one secure multi-tenant platform.',
    'https://nexus.skryveai.com', false, 1
  ),
  (
    'SwiftCreator', 'WEB DESIGN',
    'I build websites that make founders look like the leader in their space. Fast, premium, conversion-focused.',
    'https://swiftcreator.vercel.app', false, 2
  ),
  (
    'My Portfolio', 'PORTFOLIO',
    'Case studies of the products and systems I''ve built — full-stack, AI, and multi-tenant SaaS.',
    'https://aniekanisrael.com', true, 3
  ),
  (
    'SceneForge', 'AI TOOL',
    'Turn a script into finished video assets — AI scene breakdown, voiceover, and images in one automated pipeline.',
    'https://sceneforge.vercel.app', false, 4
  ),
  (
    'Are You the Problem?', 'BOOK',
    'My book on mindset and mind power. If you feel stuck, the strategy just wasn''t built yet — this is where it starts.',
    'https://selar.com/2777z79776', false, 5
  ),
  (
    'The Speed Advantage', 'BOOK',
    'How to move faster than everyone around you and turn AI into an unfair advantage. ₦2,000.',
    'https://selar.com/985ejr8r81', false, 6
  );
