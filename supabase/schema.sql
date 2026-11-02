create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  phone text not null,
  role text not null default 'publisher' check (role in ('publisher','admin')),
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  balance numeric(12,2) not null default 0,
  total_deposits numeric(12,2) not null default 0,
  total_withdrawals numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null constraint packages_price_positive check (price > 0),
  description text not null,
  campaigns_count integer not null constraint packages_campaigns_count_positive check (campaigns_count > 0),
  badge text,
  featured boolean not null default false,
  reward_per_100_views numeric(12,2) not null default 0 constraint packages_reward_per_100_views_nonnegative check (reward_per_100_views >= 0),
  perks text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.packages
  add column if not exists reward_per_100_views numeric(12,2) not null default 0,
  add column if not exists perks text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'packages_price_positive' and conrelid = 'public.packages'::regclass) then
    alter table public.packages add constraint packages_price_positive check (price > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'packages_campaigns_count_positive' and conrelid = 'public.packages'::regclass) then
    alter table public.packages add constraint packages_campaigns_count_positive check (campaigns_count > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'packages_reward_per_100_views_nonnegative' and conrelid = 'public.packages'::regclass) then
    alter table public.packages add constraint packages_reward_per_100_views_nonnegative check (reward_per_100_views >= 0);
  end if;
end;
$$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references public.packages(id),
  title text not null,
  instructions text not null,
  created_by uuid references public.profiles(id),
  reward_rate numeric(10,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  image_url text,
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','needs_revision')),
  views_count integer not null default 0,
  payout_amount numeric(12,2) not null default 0,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','processing','completed','rejected')),
  mpesa_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  message text not null,
  kind text not null default 'account',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.packages enable row level security;
alter table public.campaigns enable row level security;
alter table public.submissions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.activity_feed enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_packages_updated_at on public.packages;
create trigger set_packages_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Profile roles can only be changed directly in the database';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_self_role_change on public.profiles;
create trigger prevent_self_role_change
  before update of role on public.profiles
  for each row execute function public.prevent_self_role_change();

create or replace function public.create_publisher_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Publisher'),
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'publisher_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), ''),
    'publisher'
  );
  return new;
end;
$$;

drop trigger if exists create_publisher_profile on auth.users;
create trigger create_publisher_profile
  after insert on auth.users
  for each row execute function public.create_publisher_profile();

insert into public.profiles (id, full_name, username, phone, role)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data ->> 'full_name', ''), 'Publisher'),
  coalesce(nullif(users.raw_user_meta_data ->> 'username', ''), 'publisher_' || substr(users.id::text, 1, 8)),
  coalesce(nullif(users.raw_user_meta_data ->> 'phone', ''), ''),
  'publisher'
from auth.users users
on conflict (id) do nothing;

drop policy if exists "Users can read their own profiles" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Users can update their own profiles" on public.profiles;
create policy "Users can read their own profiles" on public.profiles
  for select using (auth.uid() = id);
create policy "Admins can read all profiles" on public.profiles
  for select using (public.is_admin());
create policy "Users can update their own profiles" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "Publishers can read own wallet" on public.wallets;
drop policy if exists "Admins can read all wallets" on public.wallets;
create policy "Publishers can read own wallet" on public.wallets
  for select using (auth.uid() = user_id);
create policy "Admins can read all wallets" on public.wallets
  for select using (public.is_admin());

drop policy if exists "Active users can view packages" on public.packages;
drop policy if exists "Admins can manage packages" on public.packages;
create policy "Anyone can view active packages" on public.packages
  for select using (is_active);
create policy "Admins can manage packages" on public.packages
  for all using (public.is_admin())
  with check (public.is_admin());
grant select on public.packages to anon, authenticated;
grant insert, update, delete on public.packages to authenticated;

drop policy if exists "Users can view their own submissions" on public.submissions;
drop policy if exists "Admins can view all submissions" on public.submissions;
drop policy if exists "Publishers can create submissions" on public.submissions;
create policy "Users can view their own submissions" on public.submissions
  for select using (auth.uid() = publisher_id);
create policy "Admins can view all submissions" on public.submissions
  for select using (public.is_admin());
create policy "Publishers can create submissions" on public.submissions
  for insert with check (auth.uid() = publisher_id);

drop policy if exists "Users can view their own withdrawal requests" on public.withdrawals;
drop policy if exists "Admins can view all withdrawals" on public.withdrawals;
create policy "Users can view their own withdrawal requests" on public.withdrawals
  for select using (auth.uid() = publisher_id);
create policy "Admins can view all withdrawals" on public.withdrawals
  for select using (public.is_admin());

drop policy if exists "Users can view recent public activity" on public.activity_feed;
drop policy if exists "Admins can manage feed entries" on public.activity_feed;
create policy "Users can view recent public activity" on public.activity_feed
  for select using (true);
create policy "Admins can manage feed entries" on public.activity_feed
  for all using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can access audit log" on public.audit_log;
create policy "Admins can access audit log" on public.audit_log
  for select using (public.is_admin());

insert into public.packages (name, price, description, campaigns_count, badge, featured, reward_per_100_views, perks)
select seed.name, seed.price, seed.description, seed.campaigns_count, seed.badge, seed.featured, seed.reward_per_100_views, seed.perks
from (values
  ('Starter Boost', 1500, 'For publishers testing the platform with a steady first campaign set.', 5, 'Best for beginners', false, 18, array['5 WhatsApp status ads', 'Basic campaign guidance', 'Unlocks rewards dashboard']),
  ('Growth Plus', 3500, 'Balanced package for active publishers scaling up to more campaigns.', 12, 'Most popular', true, 32, array['12 campaign bundles', 'Priority review queue', 'Weekly performance recap']),
  ('Pro Reach', 6200, 'Premium access for publishers ready to handle larger-volume activity.', 24, 'High volume', false, 48, array['24 campaign products', 'Enhanced payout priority', 'Dedicated support access'])
) as seed(name, price, description, campaigns_count, badge, featured, reward_per_100_views, perks)
where not exists (
  select 1 from public.packages existing where existing.name = seed.name
);

-- Create the user in Supabase Auth first, then assign admin access only through trusted SQL:
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@example.com');

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_activity_feed_created_at on public.activity_feed(created_at desc);
