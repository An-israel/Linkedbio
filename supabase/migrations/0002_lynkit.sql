-- Lynkit: pivot from single-user hub to multi-tenant link-in-bio SaaS.
-- Run AFTER 0001_init.sql. Existing owner data (profile flag, links,
-- settings) is migrated into the new shape.

-- ============================================================
-- profiles: becomes the tenant table
-- ============================================================

alter table public.profiles
  add column if not exists username text,
  add column if not exists display_name text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists theme_id text not null default 'obsidian',
  add column if not exists custom_theme jsonb,
  add column if not exists socials jsonb not null default '{}'::jsonb,
  add column if not exists is_owner boolean not null default false,
  add column if not exists status text not null default 'active'
    check (status in ('active','suspended')),
  add column if not exists page_views int not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- carry the old admin flag over, then retire it
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'profiles'
               and column_name = 'is_admin') then
    update public.profiles set is_owner = true where is_admin = true;
    alter table public.profiles drop column is_admin;
  end if;
end $$;

-- migrate the old single-user settings into the owner profile, best effort
do $$
declare
  v_owner uuid;
begin
  select id into v_owner from public.profiles where is_owner limit 1;
  if v_owner is not null
     and exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'settings') then
    update public.profiles p set
      display_name = coalesce(p.display_name,
        (select value #>> '{}' from public.settings where key = 'display_name')),
      bio = coalesce(p.bio,
        (select value #>> '{}' from public.settings where key = 'bio')),
      avatar_url = coalesce(p.avatar_url,
        nullif((select value #>> '{}' from public.settings where key = 'avatar_url'), '')),
      socials = coalesce(nullif(p.socials, '{}'::jsonb), jsonb_strip_nulls(jsonb_build_object(
        'instagram', nullif((select value #>> '{}' from public.settings where key = 'instagram_url'), ''),
        'tiktok',    nullif((select value #>> '{}' from public.settings where key = 'tiktok_url'), ''),
        'x',         nullif((select value #>> '{}' from public.settings where key = 'x_url'), ''),
        'facebook',  nullif((select value #>> '{}' from public.settings where key = 'facebook_url'), '')
      )))
    where p.id = v_owner;
    update public.profiles set username = 'aniekan'
      where id = v_owner and username is null;
  end if;
end $$;

drop table if exists public.settings;

create unique index if not exists profiles_username_key
  on public.profiles (lower(username));

-- ============================================================
-- reserved usernames + validation
-- ============================================================

create table if not exists public.reserved_usernames (name text primary key);
insert into public.reserved_usernames (name) values
  ('admin'),('administrator'),('dashboard'),('login'),('logout'),('signup'),
  ('signin'),('register'),('api'),('settings'),('about'),('terms'),('privacy'),
  ('support'),('help'),('www'),('root'),('mail'),('email'),('billing'),
  ('app'),('apps'),('assets'),('static'),('public'),('blog'),('docs'),
  ('status'),('security'),('abuse'),('legal'),('contact'),('official'),
  ('lynkit'),('moderator'),('mod'),('staff'),('team'),('owner'),('system'),
  ('null'),('undefined'),('me'),('you'),('new'),('edit'),('delete'),
  ('verify'),('verified'),('account'),('accounts'),('auth'),('oauth'),
  ('password'),('reset'),('404'),('index')
on conflict do nothing;

create or replace function public.validate_username(p_username text)
returns text  -- returns null when valid, else an error message
language plpgsql stable
set search_path = public
as $$
begin
  if p_username is null or length(p_username) < 3 or length(p_username) > 30 then
    return 'Username must be 3-30 characters.';
  end if;
  if p_username !~ '^[a-z0-9][a-z0-9_-]*$' then
    return 'Use lowercase letters, numbers, hyphens, underscores.';
  end if;
  if exists (select 1 from reserved_usernames where name = p_username) then
    return 'That username is reserved.';
  end if;
  -- basic offensive-word filter
  if p_username ~ '(fuck|shit|bitch|cunt|nigg|rape|nazi|hitler|porn|sex)' then
    return 'That username is not allowed.';
  end if;
  return null;
end;
$$;

-- anon-callable availability check for the live signup field
create or replace function public.check_username(p_username text)
returns text  -- null = available
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_err text;
begin
  v_err := validate_username(lower(trim(p_username)));
  if v_err is not null then return v_err; end if;
  if exists (select 1 from profiles where lower(username) = lower(trim(p_username))) then
    return 'That username is taken.';
  end if;
  return null;
end;
$$;
grant execute on function public.check_username(text) to anon, authenticated;

-- normalize + validate usernames, and stop non-owners touching
-- privileged columns (is_owner, status, page_views)
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_err text;
begin
  new.username := lower(trim(new.username));
  if tg_op = 'INSERT' or new.username is distinct from old.username then
    v_err := validate_username(new.username);
    if v_err is not null then raise exception '%', v_err; end if;
  end if;
  if not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.is_owner := old.is_owner;
      new.status := old.status;
      new.page_views := old.page_views;
    else
      new.is_owner := false;
      new.status := 'active';
      new.page_views := 0;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_guard();

-- is_admin() helper from 0001 now keys off is_owner
create or replace function public.is_admin()
returns boolean
language sql security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_owner from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- links: attach to tenants, add moderation flag
-- ============================================================

alter table public.links
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists flagged boolean not null default false;

-- adopt pre-pivot links into the owner's page
update public.links set user_id = (select id from public.profiles where is_owner limit 1)
  where user_id is null;
delete from public.links where user_id is null;  -- only if no owner existed
alter table public.links alter column user_id set not null;

create index if not exists links_user_id_idx on public.links (user_id, sort_order);

-- per-user link cap + flag protection
create or replace function public.links_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     and (select count(*) from links where user_id = new.user_id) >= 50 then
    raise exception 'Link limit reached (50). Delete a link to add another.';
  end if;
  if not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.flagged := old.flagged;
      new.click_count := old.click_count;
    else
      new.flagged := false;
      new.click_count := 0;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists links_guard on public.links;
create trigger links_guard
  before insert or update on public.links
  for each row execute function public.links_guard();

-- ============================================================
-- page_views: attach to tenants
-- ============================================================

alter table public.page_views
  add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
update public.page_views set profile_id = (select id from public.profiles where is_owner limit 1)
  where profile_id is null;
delete from public.page_views where profile_id is null;
alter table public.page_views alter column profile_id set not null;
create index if not exists page_views_profile_idx on public.page_views (profile_id, created_at);

-- ============================================================
-- themes (presets live in code too; DB controls availability/order)
-- ============================================================

create table if not exists public.themes (
  id text primary key,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0
);

insert into public.themes (id, name, sort_order) values
  ('obsidian','Obsidian',0),('paper','Paper',1),('noir','Noir',2),
  ('sterling','Sterling',3),('midnight','Midnight',4),('ocean','Ocean',5),
  ('aurora','Aurora',6),('forest','Forest',7),('sunset','Sunset',8),
  ('ember','Ember',9),('rosegold','Rose Gold',10),('bubblegum','Bubblegum',11),
  ('lavender','Lavender',12),('grape','Grape',13),('sand','Sand',14),
  ('cream','Cream',15),('ivory','Ivory',16),('slate','Slate',17),
  ('neon','Neon',18),('glass','Glass',19),('mono','Mono',20),('carbon','Carbon',21)
on conflict (id) do nothing;

-- ============================================================
-- promotions
-- ============================================================

create table if not exists public.promo_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  link_url text not null,
  placement text not null check (placement in ('landing_hero','landing_band','dashboard_top')),
  active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  link_url text not null,
  surface text not null default 'landing' check (surface in ('landing','dashboard','both')),
  active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  link_url text not null,
  surface text not null default 'both' check (surface in ('landing','dashboard','both')),
  frequency text not null default 'once_day' check (frequency in ('once_session','once_day','every_n')),
  every_n int not null default 5,
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_clicks (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('banner','slide','popup')),
  source_id uuid not null,
  clicked_at timestamptz not null default now()
);

-- ============================================================
-- reports (abuse)
-- ============================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  reporter_ref text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.reserved_usernames enable row level security;
alter table public.themes enable row level security;
alter table public.promo_banners enable row level security;
alter table public.promo_slides enable row level security;
alter table public.promo_popups enable row level security;
alter table public.promo_clicks enable row level security;
alter table public.reports enable row level security;

-- profiles: replace the single-tenant policy set
drop policy if exists "read own profile" on public.profiles;
create policy "public read active profiles" on public.profiles
  for select using (status = 'active' or id = auth.uid() or public.is_admin());
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- links: tenant CRUD + moderated public read
drop policy if exists "public read visible links" on public.links;
drop policy if exists "admin insert links" on public.links;
drop policy if exists "admin update links" on public.links;
drop policy if exists "admin delete links" on public.links;

create policy "public read visible links" on public.links
  for select using (
    (visible and not flagged and exists (
      select 1 from public.profiles p
      where p.id = links.user_id and p.status = 'active'))
    or user_id = auth.uid()
    or public.is_admin()
  );
create policy "own insert links" on public.links
  for insert to authenticated with check (user_id = auth.uid());
create policy "own update links" on public.links
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "own delete links" on public.links
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- reserved usernames: readable so the client can pre-check
create policy "public read reserved" on public.reserved_usernames
  for select using (true);

-- themes: public read active; owner write
create policy "public read active themes" on public.themes
  for select using (is_active or public.is_admin());
create policy "owner write themes" on public.themes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- promos: public read active (dates respected for popups); owner write
create policy "public read active banners" on public.promo_banners
  for select using (active or public.is_admin());
create policy "owner write banners" on public.promo_banners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public read active slides" on public.promo_slides
  for select using (active or public.is_admin());
create policy "owner write slides" on public.promo_slides
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "public read active popups" on public.promo_popups
  for select using (
    (active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now()))
    or public.is_admin()
  );
create policy "owner write popups" on public.promo_popups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "anon insert promo_clicks" on public.promo_clicks
  for insert with check (true);
create policy "owner read promo_clicks" on public.promo_clicks
  for select using (public.is_admin());

-- analytics: tenant reads own, owner reads all
drop policy if exists "admin read link_clicks" on public.link_clicks;
create policy "scoped read link_clicks" on public.link_clicks
  for select using (
    public.is_admin() or exists (
      select 1 from public.links l
      where l.id = link_clicks.link_id and l.user_id = auth.uid())
  );

drop policy if exists "admin read page_views" on public.page_views;
create policy "scoped read page_views" on public.page_views
  for select using (profile_id = auth.uid() or public.is_admin());

-- reports: inserted only via the submit_report RPC; owner manages
create policy "owner read reports" on public.reports
  for select using (public.is_admin());
create policy "owner update reports" on public.reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- RPCs
-- ============================================================

drop function if exists public.register_click(uuid, text);

create or replace function public.register_link_click(p_link_id uuid, p_referrer text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  insert into link_clicks (link_id, referrer) values (p_link_id, p_referrer);
  update links set click_count = click_count + 1 where id = p_link_id;
end;
$$;
grant execute on function public.register_link_click(uuid, text) to anon, authenticated;

create or replace function public.register_page_view(p_profile_id uuid, p_referrer text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  insert into page_views (profile_id, referrer) values (p_profile_id, p_referrer);
  update profiles set page_views = page_views + 1 where id = p_profile_id;
end;
$$;
grant execute on function public.register_page_view(uuid, text) to anon, authenticated;

create or replace function public.register_promo_click(p_source_type text, p_source_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_source_type not in ('banner','slide','popup') then
    raise exception 'bad source_type';
  end if;
  insert into promo_clicks (source_type, source_id) values (p_source_type, p_source_id);
end;
$$;
grant execute on function public.register_promo_click(text, uuid) to anon, authenticated;

-- rate-limited abuse report (5/hour per reporter ref, 20/hour per page)
create or replace function public.submit_report(p_profile_id uuid, p_reason text, p_reporter_ref text default null)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'Please give a reason.';
  end if;
  if p_reporter_ref is not null and (
    select count(*) from reports
    where reporter_ref = p_reporter_ref and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many reports. Try again later.';
  end if;
  if (select count(*) from reports
      where profile_id = p_profile_id and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'This page has already been reported. Thank you.';
  end if;
  insert into reports (profile_id, reason, reporter_ref)
  values (p_profile_id, left(trim(p_reason), 500), p_reporter_ref);
end;
$$;
grant execute on function public.submit_report(uuid, text, text) to anon, authenticated;

-- ============================================================
-- storage: avatars (users write under their own uid/ prefix),
-- promo-media (owner only)
-- ============================================================

insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('promo-media', 'promo-media', true)
on conflict (id) do nothing;

create policy "public read avatars"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "own write avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own update avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own delete avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public read promo-media"
  on storage.objects for select using (bucket_id = 'promo-media');
create policy "owner write promo-media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'promo-media' and public.is_admin());
create policy "owner update promo-media"
  on storage.objects for update to authenticated
  using (bucket_id = 'promo-media' and public.is_admin());
create policy "owner delete promo-media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'promo-media' and public.is_admin());
