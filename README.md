# ⚽ VM-tipping 2026

En enkel nettside for tippekonkurransen (VM 2026) som hvem som helst kan åpne i
nettleseren – ingen Excel nødvendig. Bygget med ren HTML/CSS/JavaScript og
Supabase som database.

Tre sider:

| Side          | Fil          | Hva                                                            |
|---------------|--------------|---------------------------------------------------------------|
| Tippeskjema   | `index.html` | Tipp resultater i gruppespillet + hvilke lag som går videre   |
| Bonusspørsmål | `bonus.html` | Dueller, ja/nei og fritekst-spørsmål                          |
| Admin         | `admin.html` | Passordbeskyttet: rette skjema, sette fasit, endre oppsett    |

Admin-passord: **4054** (kan endres i `js/supabase-config.js`).

---

## 1) Lag en Supabase-database (gratis, ca. 5 min)

1. Gå til **https://supabase.com** og lag en gratis konto.
2. Klikk **New project**. Velg et navn (f.eks. `vm-tipping`) og et passord til
   databasen (du trenger det sjelden – lagre det likevel). Velg region
   *Europe* og klikk **Create new project**. Vent ~1 minutt.
3. I venstremenyen: **SQL Editor** → **New query**.
4. Åpne filen `sql/schema.sql` i dette prosjektet, kopier ALT, lim inn i
   SQL-editoren og klikk **Run**. Du skal få "Success".
5. I venstremenyen: **Project Settings** (tannhjulet) → **API**.
   - Kopier **Project URL**
   - Kopier **anon public**-nøkkelen (den lange under "Project API keys")

> Anon-nøkkelen er laget for å ligge åpent i en nettside – det er helt greit at
> den er synlig. Vi har bevisst skrudd av sikkerhet (RLS) fordi dette bare er en
> liten vennegjeng uten hemmeligheter.

## 2) Lim inn nøklene

Åpne `js/supabase-config.js` og lim inn de to verdiene:

```js
window.SUPABASE_URL      = "https://gmxydynthqgsmvkszzba.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOi...din lange nøkkel...";
window.ADMIN_PASSWORD    = "4054";
```

Lagre filen.

> **Vil du bare teste først?** Du kan hoppe over steg 1–2. Hvis nøklene ikke er
> satt, lagrer siden alt lokalt i din egen nettleser (localStorage), så du kan
> prøve den. Da deles ingenting mellom folk – sett opp Supabase når du er klar.

## 3) Last opp standardoppsettet (én gang)

1. Åpne `admin.html` i nettleseren, logg inn med **4054**.
2. Gå til fanen **⚙️ Oppsett** → nederst, klikk **«Tilbakestill til
   2026-standard»**. Dette fyller databasen med alle lag, kamper og
   bonusspørsmål for 2026. Nå ser alle det samme.

## 4) Publiser nettsiden på GitHub Pages (gratis)

1. Lag en GitHub-konto og et nytt **repository** (f.eks. `vm-tipping`), sett det
   til **Public**.
2. Last opp alle filene i dette prosjektet (dra og slipp i GitHub, eller bruk
   git). Pass på at `index.html` ligger i **roten** av repoet.
3. På repo-siden: **Settings** → **Pages**.
4. Under "Build and deployment" → **Source: Deploy from a branch**, velg branch
   **main** og mappe **/ (root)**, klikk **Save**.
5. Etter ~1 minutt får du en URL som `https://brukernavn.github.io/vm-tipping/`.
   Del den med vennene dine!

> Endrer du noe i `js/supabase-config.js` eller filene, last opp på nytt så
> oppdateres siden automatisk.

---

## Slik bruker dere det

**Deltakere:** Åpner lenken, skriver navnet sitt øverst, fyller ut tippeskjema
og bonusspørsmål, og klikker **«Publiser svarene mine»**. Svarene lagres
underveis i deres egen nettleser, så ingenting forsvinner ved oppdatering.
Trykker man publiser flere ganger, oppdateres samme skjema.

**Admin (deg):** Logg inn på `admin.html` med 4054.

- **🏆 Resultattavle** – ser alle med poengsum.
- **📝 Deltakere & retting** – åpne et skjema, slå hvert svar riktig/feil (✓/✗),
  poeng summeres automatisk. «Lagre retting».
- **✅ Fasit** – legg inn de faktiske resultatene etter hvert. Trykk «Lagre +
  rett alle» så regnes alles poeng ut automatisk. Du kan fortsatt overstyre
  enkeltsvar manuelt i retting-visningen.
- **❓ Bonusspørsmål** – legg til / fjern / dra for å endre rekkefølge, sett
  poeng og type (fritekst, duell, ja/nei). Husk **Lagre**.
- **⚙️ Oppsett** – endre årstall, poengregler, lag/flagg, og last opp et nytt
  **kampoppsett (CSV)** for neste år. Last gjerne ned dagens oppsett som mal
  først, rediger den, og last opp.

### Spillerliste (søkbare spørsmål)
Spørsmål som «Toppscorer» og «Norges målscorer» er **søkefelt** – man skriver og
velger et navn fra en liste, så fasit og svar alltid staves likt (ingen feil pga.
skrivefeil). Spørsmål om land («Land med flest mål» osv.) søker i landslisten.

Siden kommer med en startliste på ~400 kjente spillere (ikke komplette tropper).
Du kan oppdatere den på to måter i **Admin → Oppsett → Spillere**:

- **Automatisk fra API-Football** (anbefalt): klikk **«⚽ Hent spillere fra
  API-Football»**. Da hentes alle troppene for VM-lagene og lagres i databasen.
  Krever en API-nøkkel i `js/supabase-config.js` (`window.API_FOOTBALL_KEY`).
  > ⚠ **Ikke spam knappen.** Gratis-nøkkelen tillater bare **100 kall/dag**
  > (10/min), og ett hent bruker ~1 kall per lag. Det tar derfor noen minutter –
  > hold fanen åpen til det er ferdig. Du trenger normalt å gjøre dette bare én
  > gang (og evt. på nytt når de endelige troppene er klare). Vanlige besøkende
  > henter aldri fra API-et – de leser bare den lagrede listen fra databasen.
- **Manuelt**: lim inn én spiller per linje som `Navn, Land` (land er valgfritt)
  og klikk «Oppdater spillerliste fra tekst over». Nyttig for å rette enkeltnavn.

  Improvements to be made; vertical size of gruppespill entries to match enmtries in the different groups of the tabeller
  green gradient behind winner on the gruppespill table
  Admin panel, fasit setup to be IDENTICAL to normal tippeskjema and bonusspørsmål page, reusing directly, instead of duplicate page..
  Remove "lag og flagg" area, as these should be permanent anyway, country names or flags dont change.
  And remove Football players API ( names were too cryptic, we want full names )

Listen lagres i databasen sammen med resten av oppsettet, så alle ser den samme.

### Neste år (nytt mesterskap)
1. Admin → Oppsett → last ned CSV-malen, fyll inn neste års kamper, last opp.
2. Oppdater lag/flagg-listen ved behov.
3. Rediger bonusspørsmål.
4. Tøm gamle skjema: slett dem under «Deltakere» (eller behold for historikk).
5. Lagre konfigurasjon.

---

## Poengberegning (standard 2026)

| Hva                                    | Poeng |
|----------------------------------------|-------|
| Riktig utfall (H/U/B) i gruppekamp     | 1     |
| Helt riktig resultat (eksakt skår)     | +2    |
| Riktig lag til 16-delsfinalen          | 3     |
| Riktig lag til åttendedelsfinalen      | 3     |
| Riktig lag i kvartfinalen              | 5     |
| Riktig lag i semifinalen               | 7     |
| Riktig lag i finalen                   | 10    |
| Riktig verdensmester                   | 15    |
| Bonusduell (f.eks. flest mål)          | 2     |
| Simens saftige / Norge-spørsmål        | 5     |
| Individuell pris (toppscorer osv.)     | 10    |

Alle verdier kan endres i admin under **Oppsett** og **Bonusspørsmål**.

## Filstruktur

```
index.html        Tippeskjema
bonus.html        Bonusspørsmål
admin.html        Adminpanel
css/styles.css    Design
js/config.js      Standarddata for 2026 (lag, kamper, spørsmål)
js/supabase-config.js   <-- LIM INN NØKLENE DINE HER
js/db.js          Databaselag (Supabase + localStorage-fallback)
js/app.js         Felles hjelpefunksjoner / flagg / nav
js/draft.js       Lagrer kladden til deltakeren
js/publish.js     «Publiser»-knappen
js/scoring.js     Regner ut poeng mot fasit
js/tippeskjema.js Tippeskjema-siden
js/bonus.js       Bonus-siden
js/admin.js       Adminpanelet
sql/schema.sql    Databaseoppsett (kjøres i Supabase én gang)
```
