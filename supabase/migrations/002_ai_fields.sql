-- Migrace 002: sloupce pro odhad z fotky (AI)
-- Spusť v Supabase → SQL Editor, pokud už máš schema.sql z dřívějška.
-- (Čerstvá instalace ze schema.sql tyhle sloupce už obsahuje.)

alter table items
  add column if not exists price_lo int,
  add column if not exists price_hi int,
  add column if not exists advice   text,
  add column if not exists channel  text check (channel in ('sell','donate','trash'));
