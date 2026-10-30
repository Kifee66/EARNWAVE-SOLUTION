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
  price numeric(12,2) not null,
  description text not null,
  campaigns_count integer not null,
  badge text,
  featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create policy "Users can read their own profiles" on public.profiles for select using (auth.uid() = id);
create policy "Admins can read all profiles" on public.profiles for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Users can update their own profiles" on public.profiles for update using (auth.uid() = id);

create policy "Publishers can read own wallet" on public.wallets for select using (auth.uid() = user_id);
create policy "Admins can read all wallets" on public.wallets for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Active users can view packages" on public.packages for select using (auth.role() = 'authenticated');
create policy "Admins can manage packages" on public.packages for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')) with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view their own submissions" on public.submissions for select using (auth.uid() = publisher_id);
create policy "Admins can view all submissions" on public.submissions for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Publishers can create submissions" on public.submissions for insert with check (auth.uid() = publisher_id);

create policy "Users can view their own withdrawal requests" on public.withdrawals for select using (auth.uid() = publisher_id);
create policy "Admins can view all withdrawals" on public.withdrawals for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view recent public activity" on public.activity_feed for select using (true);
create policy "Admins can manage feed entries" on public.activity_feed for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')) with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can access audit log" on public.audit_log for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_activity_feed_created_at on public.activity_feed(created_at desc);
