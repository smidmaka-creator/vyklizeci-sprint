-- Migrace 004: dvě kola rozhodování
--   1. kolo (Stack):    nechat / zbavit se ('out') / krabice na rok
--   2. kolo (Hromádky): out → prodat / vyhodit  (sorted_at, sorted_by = kdo a kdy roztřídil)
-- Spusť v Supabase → SQL Editor. Staré hodnoty (sell/donate/trash) zůstávají platné.

alter table items drop constraint if exists items_decision_check;
alter table items add constraint items_decision_check
  check (decision in ('keep','out','sell','donate','trash','maybe'));

alter table items
  add column if not exists sorted_at timestamptz,
  add column if not exists sorted_by uuid references players(id) on delete set null;
