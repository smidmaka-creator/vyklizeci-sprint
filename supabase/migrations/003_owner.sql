-- Migrace 003: majitel věci (čí to je). null = společné.
-- Spusť v Supabase → SQL Editor (čerstvý schema.sql sloupec už obsahuje).

alter table items
  add column if not exists owner_id uuid references players(id) on delete set null;

create index if not exists items_owner_idx on items (household_id, owner_id) where decision is null;
