# Vyklízecí sprint

Prototyp appky na zábavné protřídění věcí v přeplněném bytě — oblečení, hračky, nádobí, elektro.

## Co umí

- **Karty jako Tinder** — u každé věci swipneš (nebo ťukneš) rozhodnutí:
  - ← Vyhodit · → Prodat · ↑ Nechat · ↓ Darovat
  - navíc *Krabice na rok* pro věci, u kterých si nejsi jistý
- **Vyklízecí sprint** — časovka na jednu zónu (10 / 15 / 25 min), počítadlo vyřešených kusů, +5 XP navíc za kus
- **Gamifikace** — XP, úrovně, série dní v řadě (streak), konfety za level up
- **Rodinný žebříček** — víc hráčů (děti, rodiče), XP se počítá zvlášť
- **Chytrý odhad** — z kategorie a stavu věci se dopočítá orientační cena a doporučení, jestli má smysl prodávat (Vinted / Bazoš) nebo rovnou darovat
- **Seznamy na akci** — hromádka „Prodat" a „Darovat" jde zkopírovat jako text

## Jak to spustit

Je to jeden soubor `index.html`, bez buildu a bez závislostí. Stačí ho otevřít v prohlížeči:

```bash
start index.html
```

Nebo přes lokální server (kvůli fotoaparátu na mobilu je lepší https):

```bash
npx serve .
```

## Data

Všechno se ukládá jen do `localStorage` v daném prohlížeči, nikam se nic neodesílá.
Aplikace startuje na ukázkových datech — smažeš je v ozubeném kolečku vpravo nahoře.

## Stav

Prototyp / proof of concept. Není to hotový produkt — chybí sync mezi zařízeními,
reálné napojení na bazary, kvalitní rozpoznávání věcí z fotky atd.
