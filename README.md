# Vyklízecí sprint

Rodinná appka na zábavné protřídění věcí v přeplněném bytě — oblečení, hračky, nádobí, elektro.
Vanilla JS bez buildu; data buď jen v prohlížeči (lokální režim), nebo sdílená mezi telefony celé rodiny přes Supabase.

## Co umí

- **Karty jako Tinder** — u každé věci swipneš (nebo ťukneš) rozhodnutí: ← Vyhodit · → Prodat · ↑ Nechat · ↓ Darovat, navíc *Krabice na rok*
- **Vyklízecí sprint** — časovka na jednu zónu (10 / 15 / 25 min), +5 XP za kus, ostatní vidí, že sprintuješ
- **Gamifikace** — XP, úrovně, série dní v řadě, konfety
- **Rodina** — jedna domácnost, každý na svém mobilu, společný stack i hromádky, živý žebříček
- **Čí to je** — u věci se určí majitel (nebo „společné"); každý vidí napřed svoji frontu, v žebříčku je vidět, kdo kolik má k vyřízení (`supabase/migrations/003_owner.sql` pro starší DB)
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

## AI rozpoznání z fotky (volitelné)

Vyfotíš věc → Claude navrhne název, kategorii, stav, cenu na Vinted/Bazoši a doporučení. Klíč k Anthropic API
je jen v Edge Function na Supabase (`supabase/functions/analyze-item/index.ts`), do prohlížeče se nedostane.

1. **Sloupce v DB** — pokud máš DB z dřívějška, spusť v SQL Editoru `supabase/migrations/002_ai_fields.sql`
   (čerstvý `schema.sql` je už obsahuje).
2. **Klíč k Anthropic API** — na [console.anthropic.com](https://console.anthropic.com) → *API keys* → vytvoř klíč.
   Nastav si tam i limit útraty (*Limits*), ať máš strop.
3. **Secret ve funkci** — Supabase → *Edge Functions → Secrets* → `ANTHROPIC_API_KEY` = tvůj klíč.
4. **Nasazení funkce** — buď v Supabase → *Edge Functions → Deploy a new function → Via editor*, název `analyze-item`,
   vložit obsah `index.ts`; nebo přes CLI:

   ```bash
   npx supabase login
   npx supabase functions deploy analyze-item --project-ref <project-ref>
   ```

Appka funkci pozná sama: v rodinném režimu se po vyfocení objeví „Rozpoznávám…" a formulář se předvyplní.
Cena: model `claude-opus-5`, jedna fotka ≈ 1–2 Kč. V `index.ts` jde přepnout na levnější `claude-haiku-4-5`
(cca 5× levnější, o něco méně přesné odhady).

## Co (zatím) není

- instalace jako PWA (ikona na ploše, offline)
- napojení na Vinted / Bazoš
