-- Sessionly — starter database schema for Supabase (Postgres)
-- Paste this whole file into the Supabase SQL Editor and click Run.
-- It is safe to run more than once (uses IF NOT EXISTS / OR REPLACE).
--
-- Covers the core entities the app uses first. The fuller entity list
-- (intake forms, packages, waitlist, calendar connections, etc.) is in
-- SESSIONLY_BUILD_NOTES.md and can be added the same way later.

create extension if not exists pgcrypto;

-- ───────────────────────────────────────────────────────────────────
-- hosts: one row per signed-in professional, linked to Supabase Auth
-- ───────────────────────────────────────────────────────────────────
create table if not exists hosts (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique references auth.users (id) on delete cascade,
  first_name    text not null default '',
  last_name     text not null default '',
  business      text not null default '',
  role          text not null default '',
  slug          text unique,
  timezone      text not null default 'America/Los_Angeles',
  created_at    timestamptz not null default now()
);

-- Helper: the host id for the currently logged-in user.
create or replace function current_host_id()
returns uuid
language sql
stable
as $$
  select id from hosts where auth_user_id = auth.uid()
$$;

-- ───────────────────────────────────────────────────────────────────
-- clients
-- ───────────────────────────────────────────────────────────────────
create table if not exists clients (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references hosts (id) on delete cascade,
  name           text not null,
  email          text,
  phone          text,
  address        text,
  tag            text not null default 'New lead',  -- Repeat | Package | At risk | Overdue | New lead
  color          text not null default '#3E5C76',
  photo          text,
  since          text,
  prefs          text[] not null default '{}',
  lifetime_cents integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists clients_host_idx on clients (host_id);

-- If you ran an earlier version of this schema, this backfills the new columns:
alter table clients add column if not exists address text;
alter table clients add column if not exists color text not null default '#3E5C76';
alter table clients add column if not exists photo text;
alter table clients add column if not exists since text;

-- ───────────────────────────────────────────────────────────────────
-- services
-- ───────────────────────────────────────────────────────────────────
create table if not exists services (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references hosts (id) on delete cascade,
  name           text not null,
  duration_min   integer not null default 60,
  price_cents    integer not null default 0,
  deposit_cents  integer not null default 0,
  requires_intake boolean not null default true,
  cancel_window_hours integer not null default 24,
  policy         text not null default '',
  color          text not null default '#3E5C76',
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists services_host_idx on services (host_id);

-- ───────────────────────────────────────────────────────────────────
-- bookings (sessions)
-- ───────────────────────────────────────────────────────────────────
create table if not exists bookings (
  id           uuid primary key default gen_random_uuid(),
  host_id      uuid not null references hosts (id) on delete cascade,
  client_id    uuid not null references clients (id) on delete cascade,
  service_id   uuid not null references services (id) on delete restrict,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  status       text not null default 'scheduled', -- scheduled|confirmed|completed|cancelled|no_show
  location     text not null default '',
  deposit_paid boolean not null default false,
  intake_done  boolean not null default false,
  confirmed    boolean not null default false,
  prep         text not null default '',
  created_at   timestamptz not null default now()
);
create index if not exists bookings_host_idx on bookings (host_id);
create index if not exists bookings_client_idx on bookings (client_id);
create index if not exists bookings_starts_idx on bookings (starts_at);

-- ───────────────────────────────────────────────────────────────────
-- session_scores (host-only; always store the reasons with the number)
-- ───────────────────────────────────────────────────────────────────
create table if not exists session_scores (
  booking_id  uuid primary key references bookings (id) on delete cascade,
  host_id     uuid not null references hosts (id) on delete cascade,
  score       integer not null check (score between 0 and 100),
  reasons     jsonb not null default '{"positive":[],"negative":[]}',
  updated_at  timestamptz not null default now()
);

-- ───────────────────────────────────────────────────────────────────
-- payments
-- ───────────────────────────────────────────────────────────────────
create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  host_id      uuid not null references hosts (id) on delete cascade,
  booking_id   uuid references bookings (id) on delete set null,
  client_id    uuid not null references clients (id) on delete cascade,
  kind         text not null default 'balance',  -- deposit | balance | refund
  amount_cents integer not null,
  status       text not null default 'unpaid',   -- paid | unpaid | overdue | refunded
  due_at       timestamptz,
  paid_at      timestamptz,
  stripe_payment_intent text,
  created_at   timestamptz not null default now()
);
create index if not exists payments_host_idx on payments (host_id);

-- ───────────────────────────────────────────────────────────────────
-- follow_ups (AI drafts the host approves)
-- ───────────────────────────────────────────────────────────────────
create table if not exists follow_ups (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references hosts (id) on delete cascade,
  client_id   uuid not null references clients (id) on delete cascade,
  booking_id  uuid references bookings (id) on delete set null,
  kind        text not null,                    -- recap | review | rebook | renewal
  draft       text not null default '',
  status      text not null default 'drafted',  -- drafted | approved | sent | dismissed
  due_at      timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists follow_ups_host_idx on follow_ups (host_id);

-- ───────────────────────────────────────────────────────────────────
-- audit_events (append-only; important because AI acts on the host's behalf)
-- ───────────────────────────────────────────────────────────────────
create table if not exists audit_events (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references hosts (id) on delete cascade,
  actor       text not null,        -- host | ai
  action      text not null,
  entity      text not null,
  entity_id   text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_host_idx on audit_events (host_id);

-- ───────────────────────────────────────────────────────────────────
-- Row-Level Security: a host can only ever see and change their own rows.
-- ───────────────────────────────────────────────────────────────────
alter table hosts          enable row level security;
alter table clients        enable row level security;
alter table services       enable row level security;
alter table bookings       enable row level security;
alter table session_scores enable row level security;
alter table payments       enable row level security;
alter table follow_ups     enable row level security;
alter table audit_events   enable row level security;

-- A host sees only their own hosts row.
drop policy if exists "host self" on hosts;
create policy "host self" on hosts
  for all using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

-- All other tables: scoped by host_id = current_host_id().
do $$
declare t text;
begin
  foreach t in array array['clients','services','bookings','session_scores','payments','follow_ups','audit_events']
  loop
    execute format('drop policy if exists "host owns %1$s" on %1$s;', t);
    execute format(
      'create policy "host owns %1$s" on %1$s for all using (host_id = current_host_id()) with check (host_id = current_host_id());',
      t
    );
  end loop;
end $$;

-- Create the hosts row automatically when a user signs up.
-- `set search_path = public` is required so the function can find public.hosts.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.hosts (auth_user_id, first_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
