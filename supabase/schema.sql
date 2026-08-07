-- Brew Log — database schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- It is safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- profiles: one row per registered user, created automatically on sign-up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  -- personal defaults, prefilled into the brew form
  default_grinder text,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Create the profile row the moment a user registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- brews: one row per cup / shot
-- ---------------------------------------------------------------------------
create table if not exists public.brews (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,

  brewed_on     date not null default current_date,

  -- the bean
  coffee_name   text not null,
  roaster       text,
  origin        text,
  roast_type    text not null check (roast_type in ('filter', 'espresso')),

  -- the grind
  grinder       text,
  grind_setting text,

  -- the brew
  brew_method   text not null,
  dose_g        numeric(6,2) not null check (dose_g > 0),
  water_g       numeric(7,2) not null check (water_g > 0),
  water_temp_c  numeric(4,1),
  brew_time_s   integer check (brew_time_s >= 0),

  -- the verdict
  taste         text,
  acidity       smallint check (acidity between 1 and 5),
  bitterness    smallint check (bitterness between 1 and 5),
  sweetness     smallint check (sweetness between 1 and 5),
  body          smallint check (body between 1 and 5),
  rating        smallint check (rating between 1 and 10),
  improve       text,
  comments      text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists brews_user_date_idx on public.brews (user_id, brewed_on desc, created_at desc);
create index if not exists brews_user_coffee_idx on public.brews (user_id, coffee_name);

alter table public.brews enable row level security;

drop policy if exists "own brews" on public.brews;
create policy "own brews" on public.brews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists brews_touch_updated_at on public.brews;
create trigger brews_touch_updated_at
  before update on public.brews
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- chat_messages: the running conversation with the assistant
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_user_time_idx on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "own messages" on public.chat_messages;
create policy "own messages" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Suggestion sources for the form's autocomplete: distinct values this user
-- has already typed. Exposed as a view so the client fetches one small payload.
-- ---------------------------------------------------------------------------
create or replace view public.my_suggestions
with (security_invoker = on) as
  select
    user_id,
    'coffee_name'::text as field,
    coffee_name         as value,
    count(*)            as uses,
    max(brewed_on)      as last_used
  from public.brews where coffee_name is not null and coffee_name <> ''
  group by user_id, coffee_name
  union all
  select user_id, 'roaster', roaster, count(*), max(brewed_on)
  from public.brews where roaster is not null and roaster <> ''
  group by user_id, roaster
  union all
  select user_id, 'origin', origin, count(*), max(brewed_on)
  from public.brews where origin is not null and origin <> ''
  group by user_id, origin
  union all
  select user_id, 'brew_method', brew_method, count(*), max(brewed_on)
  from public.brews where brew_method is not null and brew_method <> ''
  group by user_id, brew_method
  union all
  select user_id, 'grinder', grinder, count(*), max(brewed_on)
  from public.brews where grinder is not null and grinder <> ''
  group by user_id, grinder;
