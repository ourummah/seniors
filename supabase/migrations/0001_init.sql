-- Seniors Money Finder: members area, benefits database, business offers.
-- Run once in the Supabase SQL editor (or with `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'member' check (role in ('member', 'business', 'admin')),
  full_name text,
  email text,
  phone text,
  alert_email boolean not null default true,
  alert_sms boolean not null default false,
  created_at timestamptz not null default now()
);

-- A helper (for example an adult child) can manage a member's profile once the member invites them.
create table public.member_helpers (
  member_id uuid not null references public.profiles on delete cascade,
  helper_email text not null,
  helper_id uuid references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, helper_email)
);

create table public.member_answers (
  member_id uuid primary key references public.profiles on delete cascade,
  state text not null check (state in ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')),
  postcode text,
  age int check (age between 18 and 120),
  cards text[] not null default '{}',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Benefits database
-- ---------------------------------------------------------------------------
create table public.benefits (
  id text primary key,
  name text not null,
  provider text not null,
  level text not null check (level in ('Federal', 'State', 'Council', 'Private')),
  state text not null check (state in ('ALL', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT')),
  category text not null check (category in ('Payments', 'Bills', 'Transport', 'Health', 'Home and Rates', 'Discounts')),
  summary text not null default '',
  cards text[] not null default '{NONE}',
  -- Optional: alternative card combinations, e.g. [["PCC"],["SENIORS_CARD","CSHC"]] when two cards are needed together.
  card_sets jsonb,
  requires text[] not null default '{}',
  -- Hidden when the member already has any of these cards or tags (e.g. the Age Pension for someone receiving it).
  excludes text[] not null default '{}',
  -- False for large means-tested income payments, which are listed but left out of the headline dollar total.
  counts_in_total boolean not null default true,
  eligibility_text text not null default '',
  value_text text not null default '',
  max_annual_value numeric(10, 2),
  value_period text,
  how_to_claim text not null default '',
  phone text,
  source_url text not null,
  notes text,
  status text not null default 'published' check (status in ('draft', 'published', 'retired')),
  verified boolean not null default false,
  verified_by uuid references public.profiles,
  verified_at timestamptz,
  minutes_spent int,
  source_hash text,
  source_checked_at timestamptz,
  source_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index benefits_state_idx on public.benefits (state) where status = 'published';

create table public.change_log (
  id bigint generated always as identity primary key,
  benefit_id text not null references public.benefits on delete cascade,
  changed_by uuid references public.profiles,
  field text not null,
  old_value text,
  new_value text,
  reason text,
  created_at timestamptz not null default now()
);

create table public.member_benefits (
  member_id uuid not null references public.profiles on delete cascade,
  benefit_id text not null references public.benefits on delete cascade,
  status text not null default 'not_claimed' check (status in ('not_claimed', 'applied', 'receiving', 'not_eligible')),
  updated_at timestamptz not null default now(),
  primary key (member_id, benefit_id)
);

create table public.alerts_sent (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.profiles on delete cascade,
  benefit_id text references public.benefits on delete set null,
  channel text not null check (channel in ('email', 'sms')),
  kind text not null check (kind in ('new_benefit', 'changed_benefit', 'renewal')),
  sent_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Business offers
-- ---------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles on delete cascade,
  name text not null,
  abn text not null check (abn ~ '^[0-9]{11}$'),
  contact_name text not null,
  contact_email text not null,
  phone text,
  website text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses on delete cascade,
  title text not null,
  description text not null,
  discount_text text not null,
  states text[] not null default '{NSW,VIC,QLD,WA,SA,TAS,ACT,NT}',
  postcodes text,
  starts_on date not null default current_date,
  ends_on date,
  redeem_method text not null check (redeem_method in ('code', 'link', 'show_card', 'other')),
  redeem_details text,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  views int not null default 0,
  clicks int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers and triggers
-- ---------------------------------------------------------------------------
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- True when the signed-in user is the member or an invited helper of that member.
create function public.can_act_for(member uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select member = auth.uid()
      or exists (select 1 from public.member_helpers h where h.member_id = member and h.helper_id = auth.uid());
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, email, phone)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'account_type' = 'business' then 'business' else 'member' end,
    new.email,
    new.phone
  );
  -- Link any pending helper invitations sent to this email.
  update public.member_helpers set helper_id = new.id
  where helper_id is null and new.email is not null and lower(helper_email) = lower(new.email);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Any change to an offer by a business sends it back for review, and businesses cannot
-- touch their own view and click counts. count_offer() below is the only other writer.
create function public.offers_require_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('smf.counting', true) = 'on' then
    return new;
  end if;
  if not public.is_admin() then
    new.status := 'pending';
    new.review_note := null;
    new.views := case when tg_op = 'INSERT' then 0 else old.views end;
    new.clicks := case when tg_op = 'INSERT' then 0 else old.clicks end;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger offers_review before insert or update on public.offers
  for each row execute function public.offers_require_review();

-- Counters bumped from the members area without giving members write access to offers.
create function public.count_offer(offer uuid, kind text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('smf.counting', 'on', true);
  update public.offers
  set views = views + (kind = 'view')::int, clicks = clicks + (kind = 'click')::int
  where id = offer and status = 'approved';
  perform set_config('smf.counting', 'off', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.member_helpers enable row level security;
alter table public.member_answers enable row level security;
alter table public.benefits enable row level security;
alter table public.change_log enable row level security;
alter table public.member_benefits enable row level security;
alter table public.alerts_sent enable row level security;
alter table public.businesses enable row level security;
alter table public.offers enable row level security;

create policy "own profile" on public.profiles for select using (public.can_act_for(id) or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid() or public.is_admin());
-- Members may change only these columns; role changes are admin-only (via SQL).
revoke update on public.profiles from authenticated;
grant update (full_name, phone, alert_email, alert_sms) on public.profiles to authenticated;

create policy "member manages helpers" on public.member_helpers for all
  using (member_id = auth.uid() or helper_id = auth.uid()) with check (member_id = auth.uid());

create policy "own answers" on public.member_answers for all
  using (public.can_act_for(member_id)) with check (public.can_act_for(member_id));

create policy "published benefits are public" on public.benefits for select using (status = 'published' or public.is_admin());
create policy "admins edit benefits" on public.benefits for all using (public.is_admin()) with check (public.is_admin());

create policy "admins read change log" on public.change_log for select using (public.is_admin());
create policy "admins write change log" on public.change_log for insert with check (public.is_admin());

create policy "own benefit status" on public.member_benefits for all
  using (public.can_act_for(member_id)) with check (public.can_act_for(member_id));

create policy "own alerts" on public.alerts_sent for select using (public.can_act_for(member_id) or public.is_admin());

create policy "owner or admin reads business" on public.businesses for select using (owner_id = auth.uid() or public.is_admin());
create policy "owner registers business" on public.businesses for insert with check (owner_id = auth.uid() and status = 'pending');
create policy "owner or admin updates business" on public.businesses for update using (owner_id = auth.uid() or public.is_admin());
revoke update on public.businesses from authenticated;
grant update (name, contact_name, contact_email, phone, website) on public.businesses to authenticated;

create policy "approved offers are public" on public.offers for select
  using (
    (status = 'approved' and starts_on <= current_date and (ends_on is null or ends_on >= current_date))
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
    or public.is_admin()
  );
create policy "approved businesses add offers" on public.offers for insert
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid() and b.status = 'approved'));
create policy "owner or admin updates offers" on public.offers for update
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()) or public.is_admin());
create policy "owner or admin deletes offers" on public.offers for delete
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()) or public.is_admin());

-- Admin status changes on businesses go through the service role in server code,
-- because column grants above stop the authenticated role from changing status.
