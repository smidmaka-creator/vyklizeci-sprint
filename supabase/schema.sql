-- ============================================================
-- Vyklízečka — databázové schéma pro Supabase
-- Spusť celé v Supabase → SQL Editor → New query → Run.
-- Předpoklad: v Authentication → Providers je zapnuté "Anonymous sign-ins".
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- tabulky ----------

create table if not exists households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,          -- 6 znaků, kterými se rodina připojuje
  created_at  timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id      uuid not null,                -- auth.uid() zařízení (anonymní přihlášení)
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  xp            int  not null default 0,
  streak_count  int  not null default 0,
  streak_last   date,
  color         int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists players_household_idx on players (household_id);

create table if not exists items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  cat           text not null,
  cond          text not null,
  photo_path    text,                        -- cesta ve Storage bucketu "photos"
  decision      text check (decision in ('keep','out','sell','donate','trash','maybe')),  -- out = zbavit se (čeká na 2. kolo)
  review_at     timestamptz,                 -- pro "krabici na rok"
  price_lo      int,                         -- odhad z fotky (AI); null = heuristika v appce
  price_hi      int,
  advice        text,
  channel       text check (channel in ('sell','donate','trash')),
  owner_id      uuid references players(id) on delete set null,   -- čí to je; null = společné
  created_by    uuid references players(id) on delete set null,
  decided_by    uuid references players(id) on delete set null,
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,                 -- 1. kolo (nechat / zbavit se)
  sorted_at     timestamptz,                 -- 2. kolo (prodat / vyhodit)
  sorted_by     uuid references players(id) on delete set null,
  position      bigint not null default (extract(epoch from now()) * 1000)::bigint
);
create index if not exists items_stack_idx on items (household_id, decision, position desc);
create index if not exists items_owner_idx on items (household_id, owner_id) where decision is null;

create table if not exists sprints (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  player_id     uuid not null references players(id) on delete cascade,
  zone          text not null,
  minutes       int  not null,
  started_at    timestamptz not null default now(),
  ends_at       timestamptz not null,
  ended_at      timestamptz,                 -- null = právě běží
  resolved      int  not null default 0,
  xp_gained     int  not null default 0
);
create index if not exists sprints_active_idx on sprints (household_id) where ended_at is null;

-- ---------- pomocná funkce: je volající členem domácnosti? ----------
-- security definer → obejde RLS uvnitř, takže policies nejsou rekurzivní

create or replace function is_member(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members m
    where m.household_id = h and m.user_id = auth.uid()
  );
$$;

-- ---------- RLS ----------

alter table households        enable row level security;
alter table household_members enable row level security;
alter table players           enable row level security;
alter table items             enable row level security;
alter table sprints           enable row level security;

drop policy if exists "members read household"   on households;
drop policy if exists "members update household" on households;
create policy "members read household"   on households for select to authenticated using (is_member(id));
create policy "members update household" on households for update to authenticated using (is_member(id));

drop policy if exists "members read members" on household_members;
create policy "members read members" on household_members for select to authenticated using (is_member(household_id));

drop policy if exists "members all players" on players;
create policy "members all players" on players for all to authenticated
  using (is_member(household_id)) with check (is_member(household_id));

drop policy if exists "members all items" on items;
create policy "members all items" on items for all to authenticated
  using (is_member(household_id)) with check (is_member(household_id));

drop policy if exists "members all sprints" on sprints;
create policy "members all sprints" on sprints for all to authenticated
  using (is_member(household_id)) with check (is_member(household_id));

-- ---------- RPC ----------

-- Založení domácnosti: vygeneruje kód, zapíše volajícího jako člena.
create or replace function create_household(p_name text) returns households
language plpgsql security definer set search_path = public as $$
declare
  h households;
  c text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- bez 0/O/1/I
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  loop
    select string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
      into c from generate_series(1, 6);
    exit when not exists (select 1 from households where code = c);
  end loop;
  insert into households (name, code) values (trim(p_name), c) returning * into h;
  insert into household_members (household_id, user_id) values (h.id, auth.uid());
  return h;
end $$;

-- Připojení kódem.
create or replace function join_household(p_code text) returns households
language plpgsql security definer set search_path = public as $$
declare h households;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into h from households where code = upper(trim(p_code));
  if h.id is null then raise exception 'Kód neexistuje'; end if;
  insert into household_members (household_id, user_id) values (h.id, auth.uid())
    on conflict do nothing;
  return h;
end $$;

-- Domácnosti, kde je volající členem.
create or replace function my_households() returns setof households
language sql stable security definer set search_path = public as $$
  select h.* from households h
  join household_members m on m.household_id = h.id
  where m.user_id = auth.uid();
$$;

-- Atomické přičtení XP (nikdy pod nulu).
create or replace function award_xp(p_player uuid, p_delta int) returns players
language plpgsql security definer set search_path = public as $$
declare p players;
begin
  update players set xp = greatest(0, xp + p_delta)
  where id = p_player and is_member(household_id)
  returning * into p;
  if p.id is null then raise exception 'player not found'; end if;
  return p;
end $$;

-- ---------- Realtime ----------
-- (publication supabase_realtime v Supabase existuje; přidáváme tabulky)
do $$
begin
  alter publication supabase_realtime add table items;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table players;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table sprints;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table households;
exception when duplicate_object then null; end $$;

-- ---------- Storage: fotky ----------
-- Veřejné čtení (URL jsou nehádatelné), zápis jen členové domácnosti
-- do složky pojmenované id domácnosti: photos/<household_id>/<uuid>.jpg

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos public read"    on storage.objects;
drop policy if exists "photos member upload"  on storage.objects;
drop policy if exists "photos member delete"  on storage.objects;

create policy "photos public read" on storage.objects for select
  using (bucket_id = 'photos');

create policy "photos member upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and is_member(((storage.foldername(name))[1])::uuid));

create policy "photos member delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and is_member(((storage.foldername(name))[1])::uuid));
