-- Fix 1: profile creation moves server-side. With email confirmation on,
-- auth.signUp returns no session, so the anon client cannot insert into
-- profiles (RLS). A trigger on auth.users now creates the profile from the
-- username passed in signup metadata — works with or without confirmation.
--
-- Fix 2: the guard triggers froze page_views / click_count for every
-- non-admin writer, which also blocked the security-definer counter RPCs —
-- no view or click ever counted. The freeze now applies only to direct
-- client roles (anon / authenticated), never to definer functions.
--
-- Fix 3: backfill profiles for any auth users created while signup was
-- broken, deriving a username from their email.

-- ============================================================
-- Username generation (valid + unique, with deterministic suffixes)
-- ============================================================

create or replace function public.generate_username(p_base text, p_seed uuid)
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v text;
  v_candidate text;
  i int := 0;
begin
  v := lower(regexp_replace(coalesce(p_base, ''), '[^a-z0-9_-]', '', 'g'));
  v := regexp_replace(v, '^[_-]+', '');
  v := left(v, 30);
  if validate_username(v) is not null then
    v := 'user-' || substr(md5(p_seed::text), 1, 6);
  end if;
  v_candidate := v;
  while exists (select 1 from profiles where lower(username) = v_candidate) loop
    i := i + 1;
    v_candidate := left(v, 24) || '-' || substr(md5(p_seed::text || i::text), 1, 4);
  end loop;
  return v_candidate;
end;
$$;

-- ============================================================
-- Create the profile when the auth user is created
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_requested text;
  v_username text;
begin
  v_requested := new.raw_user_meta_data ->> 'username';
  v_username := public.generate_username(
    coalesce(v_requested, split_part(new.email, '@', 1)),
    new.id
  );
  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, coalesce(v_requested, v_username))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Guard triggers: freeze privileged columns only for direct client
-- roles. Definer RPCs (counters) and the auth trigger run as the
-- function owner and must not be frozen.
-- ============================================================

create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_err text;
  v_client boolean := current_user in ('anon', 'authenticated');
begin
  new.username := lower(trim(new.username));
  if tg_op = 'INSERT' then
    v_err := validate_username(new.username);
  elsif new.username is distinct from old.username then
    v_err := validate_username(new.username);
  end if;
  if v_err is not null then
    raise exception '%', v_err;
  end if;
  if v_client and not public.is_admin() then
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

create or replace function public.links_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_client boolean := current_user in ('anon', 'authenticated');
begin
  if tg_op = 'INSERT' and v_client
     and (select count(*) from links where user_id = new.user_id) >= 50 then
    raise exception 'Link limit reached (50). Delete a link to add another.';
  end if;
  if v_client and not public.is_admin() then
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

-- ============================================================
-- Backfill: profiles for auth users created while signup was broken
-- ============================================================

do $$
declare
  r record;
begin
  for r in
    select u.id, u.email, u.raw_user_meta_data
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p.id is null
  loop
    insert into public.profiles (id, username, display_name)
    values (
      r.id,
      public.generate_username(
        coalesce(r.raw_user_meta_data ->> 'username', split_part(r.email, '@', 1)),
        r.id
      ),
      coalesce(r.raw_user_meta_data ->> 'username', split_part(r.email, '@', 1))
    );
  end loop;
end $$;
