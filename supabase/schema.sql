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
  total_earnings numeric(12,2) not null default 0,
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
  image_path text,
  perks text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.packages
  add column if not exists reward_per_100_views numeric(12,2) not null default 0,
  add column if not exists image_path text,
  add column if not exists perks text[] not null default '{}';

alter table public.wallets
  add column if not exists total_earnings numeric(12,2) not null default 0;

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

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'campaigns_reward_rate_nonnegative' and conrelid = 'public.campaigns'::regclass) then
    alter table public.campaigns add constraint campaigns_reward_rate_nonnegative check (reward_rate >= 0);
  end if;
end;
$$;

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
  reward_rate_snapshot numeric(12,2),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.submissions
  add column if not exists reward_rate_snapshot numeric(12,2),
  add column if not exists review_notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'submissions_reward_rate_snapshot_nonnegative' and conrelid = 'public.submissions'::regclass) then
    alter table public.submissions add constraint submissions_reward_rate_snapshot_nonnegative check (reward_rate_snapshot is null or reward_rate_snapshot >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_payout_amount_nonnegative' and conrelid = 'public.submissions'::regclass) then
    alter table public.submissions add constraint submissions_payout_amount_nonnegative check (payout_amount >= 0);
  end if;
end;
$$;

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

create table if not exists public.package_orders (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid not null references public.profiles(id) on delete cascade,
  package_id uuid references public.packages(id),
  package_name_snapshot text not null,
  price_snapshot numeric(12,2) not null check (price_snapshot > 0),
  reward_rate_snapshot numeric(12,2) not null check (reward_rate_snapshot >= 0),
  campaigns_count_snapshot integer not null check (campaigns_count_snapshot > 0),
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','cancelled','failed')),
  created_at timestamptz not null default now()
);

create or replace function public.prevent_package_order_snapshot_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.publisher_id is distinct from old.publisher_id
    or new.package_id is distinct from old.package_id
    or new.package_name_snapshot is distinct from old.package_name_snapshot
    or new.price_snapshot is distinct from old.price_snapshot
    or new.reward_rate_snapshot is distinct from old.reward_rate_snapshot
    or new.campaigns_count_snapshot is distinct from old.campaigns_count_snapshot
    or new.created_at is distinct from old.created_at then
    raise exception 'Package order snapshots cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_package_order_snapshot_change on public.package_orders;
create trigger prevent_package_order_snapshot_change
  before update on public.package_orders
  for each row execute function public.prevent_package_order_snapshot_change();

create table if not exists public.package_rate_audit (
  id uuid primary key default gen_random_uuid(),
  package_id uuid,
  package_name text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('created','rate_changed')),
  old_price numeric(12,2),
  new_price numeric(12,2) not null,
  old_reward_rate numeric(12,2),
  new_reward_rate numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  publisher_id uuid not null references public.profiles(id) on delete cascade,
  submission_id uuid unique references public.submissions(id) on delete restrict,
  kind text not null check (kind in ('earning','deposit','withdrawal','adjustment')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
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
alter table public.package_orders enable row level security;
alter table public.package_rate_audit enable row level security;
alter table public.wallet_transactions enable row level security;

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

create or replace function public.audit_package_rate_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.package_rate_audit (
      package_id, package_name, actor_id, action, new_price, new_reward_rate
    ) values (
      new.id, new.name, auth.uid(), 'created', new.price, new.reward_per_100_views
    );
  elsif new.price is distinct from old.price
    or new.reward_per_100_views is distinct from old.reward_per_100_views then
    insert into public.package_rate_audit (
      package_id, package_name, actor_id, action, old_price, new_price, old_reward_rate, new_reward_rate
    ) values (
      new.id, new.name, auth.uid(), 'rate_changed',
      old.price, new.price, old.reward_per_100_views, new.reward_per_100_views
    );
  end if;
  return new;
end;
$$;

drop trigger if exists audit_package_rate_change on public.packages;
create trigger audit_package_rate_change
  after insert or update on public.packages
  for each row execute function public.audit_package_rate_change();

create or replace function public.prevent_package_rate_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Package rate audit records are append-only';
end;
$$;

drop trigger if exists prevent_package_rate_audit_mutation on public.package_rate_audit;
create trigger prevent_package_rate_audit_mutation
  before update or delete on public.package_rate_audit
  for each row execute function public.prevent_package_rate_audit_mutation();

create or replace function public.capture_submission_reward_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign_reward_rate numeric(12,2);
begin
  if auth.uid() is not null and new.publisher_id is distinct from auth.uid() then
    raise exception 'A publisher can only submit evidence for their own account';
  end if;

  select coalesce(packages.reward_per_100_views, campaigns.reward_rate)
  into campaign_reward_rate
  from public.campaigns
  left join public.packages on packages.id = campaigns.package_id
  where campaigns.id = new.campaign_id and campaigns.status = 'active';

  if not found then
    raise exception 'The campaign is not active or does not exist';
  end if;

  new.status := 'pending';
  new.views_count := 0;
  new.payout_amount := 0;
  new.reviewed_by := null;
  new.reward_rate_snapshot := campaign_reward_rate;
  return new;
end;
$$;

drop trigger if exists capture_submission_reward_rate on public.submissions;
create trigger capture_submission_reward_rate
  before insert on public.submissions
  for each row execute function public.capture_submission_reward_rate();

drop trigger if exists prevent_submission_reward_snapshot_change on public.submissions;
update public.submissions submissions
set reward_rate_snapshot = case
  when submissions.status = 'approved'
    and submissions.views_count > 0
    and submissions.payout_amount > 0
    then round(submissions.payout_amount * 100 / submissions.views_count, 2)
  else coalesce(packages.reward_per_100_views, campaigns.reward_rate)
end
from public.campaigns
left join public.packages on packages.id = campaigns.package_id
where submissions.campaign_id = campaigns.id
  and submissions.reward_rate_snapshot is null;

create or replace function public.prevent_submission_reward_snapshot_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.reward_rate_snapshot is distinct from old.reward_rate_snapshot then
    raise exception 'Submission reward-rate snapshots cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_submission_reward_snapshot_change on public.submissions;
create trigger prevent_submission_reward_snapshot_change
  before update of reward_rate_snapshot on public.submissions
  for each row execute function public.prevent_submission_reward_snapshot_change();

create or replace function public.create_package_order(p_package_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_package public.packages%rowtype;
  order_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'publisher'
  ) then
    raise exception 'Only signed-in publishers can request a package order';
  end if;

  select * into selected_package
  from public.packages
  where id = p_package_id and is_active
  for share;

  if not found then
    raise exception 'Package is unavailable';
  end if;

  insert into public.package_orders (
    publisher_id, package_id, package_name_snapshot, price_snapshot,
    reward_rate_snapshot, campaigns_count_snapshot
  ) values (
    auth.uid(), selected_package.id, selected_package.name, selected_package.price,
    selected_package.reward_per_100_views, selected_package.campaigns_count
  ) returning id into order_id;

  return order_id;
end;
$$;

revoke all on function public.create_package_order(uuid) from public;
grant execute on function public.create_package_order(uuid) to authenticated;

create or replace function public.review_submission(
  p_submission_id uuid,
  p_decision text,
  p_views_count integer default 0,
  p_review_notes text default null
)
returns numeric(12,2)
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_row public.submissions%rowtype;
  wallet_row public.wallets%rowtype;
  calculated_payout numeric(12,2);
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review submissions';
  end if;
  if p_decision is null or p_decision not in ('approved', 'rejected', 'needs_revision') then
    raise exception 'Invalid review decision';
  end if;
  if p_decision = 'approved' and (p_views_count is null or p_views_count < 0) then
    raise exception 'Approved views must be zero or more';
  end if;

  select * into submission_row
  from public.submissions
  where id = p_submission_id
  for update;

  if not found or submission_row.status <> 'pending' then
    raise exception 'Submission does not exist or is no longer pending review';
  end if;
  if p_decision = 'approved' and submission_row.reward_rate_snapshot is null then
    raise exception 'Submission has no captured reward rate and cannot be approved';
  end if;

  calculated_payout := case
    when p_decision = 'approved'
      then round(p_views_count * submission_row.reward_rate_snapshot / 100, 2)
    else 0
  end;

  update public.submissions
  set status = p_decision,
      views_count = case when p_decision = 'approved' then p_views_count else 0 end,
      payout_amount = calculated_payout,
      reviewed_by = auth.uid(),
      review_notes = nullif(trim(p_review_notes), ''),
      updated_at = now()
  where id = p_submission_id;

  if p_decision = 'approved' and calculated_payout > 0 then
    insert into public.wallets (user_id)
    values (submission_row.publisher_id)
    on conflict (user_id) do nothing;

    select * into wallet_row
    from public.wallets
    where user_id = submission_row.publisher_id
    for update;

    update public.wallets
    set balance = balance + calculated_payout,
        total_earnings = total_earnings + calculated_payout,
        updated_at = now()
    where id = wallet_row.id;

    insert into public.wallet_transactions (
      wallet_id, publisher_id, submission_id, kind, amount, description
    ) values (
      wallet_row.id, submission_row.publisher_id, p_submission_id, 'earning',
      calculated_payout, 'Approved campaign submission'
    );
  end if;

  return calculated_payout;
end;
$$;

revoke all on function public.review_submission(uuid, text, integer, text) from public;
grant execute on function public.review_submission(uuid, text, integer, text) to authenticated;

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
drop policy if exists "Anyone can view active packages" on public.packages;
drop policy if exists "Admins can manage packages" on public.packages;
create policy "Anyone can view active packages" on public.packages
  for select using (is_active);
create policy "Admins can manage packages" on public.packages
  for all using (public.is_admin())
  with check (public.is_admin());
grant select on public.packages to anon, authenticated;
grant insert, update, delete on public.packages to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Public can view product images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "Admins can upload product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can update product images" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can delete product images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Users can view their own submissions" on public.submissions;
drop policy if exists "Admins can view all submissions" on public.submissions;
drop policy if exists "Publishers can create submissions" on public.submissions;
create policy "Users can view their own submissions" on public.submissions
  for select using (auth.uid() = publisher_id);
create policy "Admins can view all submissions" on public.submissions
  for select using (public.is_admin());
create policy "Publishers can create submissions" on public.submissions
  for insert with check (auth.uid() = publisher_id);
grant select, insert on public.submissions to authenticated;
revoke update, delete on public.submissions from public, anon, authenticated;

drop policy if exists "Publishers can view active campaigns" on public.campaigns;
drop policy if exists "Admins can manage campaigns" on public.campaigns;
create policy "Publishers can view active campaigns" on public.campaigns
  for select using (
    status = 'active'
    or exists (
      select 1 from public.submissions
      where submissions.campaign_id = campaigns.id
        and submissions.publisher_id = auth.uid()
    )
  );
create policy "Admins can manage campaigns" on public.campaigns
  for all using (public.is_admin())
  with check (public.is_admin());
grant select on public.campaigns to authenticated;

drop policy if exists "Users can read their package orders" on public.package_orders;
drop policy if exists "Admins can read all package orders" on public.package_orders;
create policy "Users can read their package orders" on public.package_orders
  for select using (auth.uid() = publisher_id);
create policy "Admins can read all package orders" on public.package_orders
  for select using (public.is_admin());
revoke all on public.package_orders from public, anon, authenticated;
grant select on public.package_orders to authenticated;

drop policy if exists "Admins can read package rate audit" on public.package_rate_audit;
create policy "Admins can read package rate audit" on public.package_rate_audit
  for select using (public.is_admin());
revoke all on public.package_rate_audit from public, anon, authenticated;
grant select on public.package_rate_audit to authenticated;

drop policy if exists "Users can read own wallet transactions" on public.wallet_transactions;
drop policy if exists "Admins can read all wallet transactions" on public.wallet_transactions;
create policy "Users can read own wallet transactions" on public.wallet_transactions
  for select using (auth.uid() = publisher_id);
create policy "Admins can read all wallet transactions" on public.wallet_transactions
  for select using (public.is_admin());
revoke all on public.wallet_transactions from public, anon, authenticated;
grant select on public.wallet_transactions to authenticated;

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

update public.packages packages
set is_active = false
where packages.image_path is null
  and (
    (packages.name = 'Starter Boost' and packages.price = 1500 and packages.campaigns_count = 5
      and packages.reward_per_100_views = 18
      and packages.description = 'For publishers testing the platform with a steady first campaign set.')
    or (packages.name = 'Growth Plus' and packages.price = 3500 and packages.campaigns_count = 12
      and packages.reward_per_100_views = 32
      and packages.description = 'Balanced package for active publishers scaling up to more campaigns.')
    or (packages.name = 'Pro Reach' and packages.price = 6200 and packages.campaigns_count = 24
      and packages.reward_per_100_views = 48
      and packages.description = 'Premium access for publishers ready to handle larger-volume activity.')
  );

delete from public.packages packages
where packages.is_active = false
  and packages.image_path is null
  and (
    (packages.name = 'Starter Boost' and packages.price = 1500 and packages.campaigns_count = 5
      and packages.reward_per_100_views = 18
      and packages.description = 'For publishers testing the platform with a steady first campaign set.')
    or (packages.name = 'Growth Plus' and packages.price = 3500 and packages.campaigns_count = 12
      and packages.reward_per_100_views = 32
      and packages.description = 'Balanced package for active publishers scaling up to more campaigns.')
    or (packages.name = 'Pro Reach' and packages.price = 6200 and packages.campaigns_count = 24
      and packages.reward_per_100_views = 48
      and packages.description = 'Premium access for publishers ready to handle larger-volume activity.')
  )
  and not exists (
    select 1 from public.campaigns where campaigns.package_id = packages.id
  )
  and not exists (
    select 1 from public.package_orders where package_orders.package_id = packages.id
  );

-- Create the user in Supabase Auth first, then assign admin access only through trusted SQL:
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@example.com');

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_submissions_status on public.submissions(status);
create index if not exists idx_activity_feed_created_at on public.activity_feed(created_at desc);
create index if not exists idx_submissions_publisher_created on public.submissions(publisher_id, created_at desc);
create index if not exists idx_package_orders_publisher_created on public.package_orders(publisher_id, created_at desc);
