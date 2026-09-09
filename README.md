# Vyklízecí sprint

Rodinná appka na zábavné protřídění věcí v přeplněném bytě — oblečení, hračky, nádobí, elektro.
Vanilla JS bez buildu; data buď jen v prohlížeči (lokální režim), nebo sdílená mezi telefony celé rodiny přes Supabase.

## Co umí

- **Karty jako Tinder** — u každé věci swipneš (nebo ťukneš) rozhodnutí: ← Vyhodit · → Prodat · ↑ Nechat · ↓ Darovat, navíc *Krabice na rok*
- **Vyklízecí sprint** — časovka na jednu zónu (10 / 15 / 25 min), +5 XP za kus, ostatní vidí, že sprintuješ
- **Gamifikace** — XP, úrovně, série dní v řadě, konfety
- **Rodina** — jedna domácnost, každý na svém mobilu, společný stack i hromádky, živý žebříček
- **Chytrý odhad** — z kategorie a stavu se dopočítá orientační cena a doporučení prodat / darovat
- **Fotky** — vyfotíš věc, zmenší se a uloží do Storage

## Soubory

| | |
|---|---|
| `index.html` | vzhled + kostra stránky |
| `app.js` | UI a herní logika |
| `db.js` | datová vrstva — `LocalDB` (localStorage) nebo `RemoteDB` (Supabase), stejné rozhraní |
| `config.js` | URL + anon klíč Supabase; prázdné = lokální režim |
| `supabase/schema.sql` | tabulky, RLS, RPC, realtime, Storage bucket |

## Lokální režim (bez nastavování)

Otevři `index.html` v prohlížeči. Běží na ukázkových datech, nic se nikam neposílá.

## Rodinný režim (Supabase) — nastavení

1. **Supabase projekt** — na [supabase.com](https://supabase.com) založ projekt (free tier stačí).
2. **Anonymní přihlášení** — *Authentication → Providers → Anonymous sign-ins* → zapnout. Každý telefon dostane vlastní identitu bez e-mailu a hesla.
3. **Schéma** — *SQL Editor → New query*, vlož celý obsah `supabase/schema.sql` a spusť.
4. **Klíče** — *Project Settings → API* → zkopíruj *Project URL* a *anon public* klíč do `config.js`.
5. **Hosting** — appka musí běžet přes https (kvůli fotoaparátu a Supabase). Nejjednodušší je GitHub Pages: repo → *Settings → Pages → Deploy from branch → master / root*.

Pak na prvním telefonu **založ domácnost** (dostaneš 6místný kód), na ostatních **Přidat se kódem**. Kód je kdykoli vidět pod ikonou 👥 nahoře.

### Bezpečnost

Anon klíč je určený pro klienty a smí být v kódu. Data chrání Row Level Security: každý řádek patří domácnosti a vidí ho jen zařízení, která jsou jejími členy (tabulka `household_members`, funkce `is_member`). Připojit se jde jen přes RPC `join_household(kód)`.

## Co (zatím) není

- rozpoznání věci z fotky (AI) a automatický odhad ceny podle reálných inzerátů
- instalace jako PWA (ikona na ploše, offline)
- napojení na Vinted / Bazoš
