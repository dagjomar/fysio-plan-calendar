# Fysio Plan Calendar – Akilles Senerehabilitering

Interaktiv treningsplan og kalender for opptrening etter akillesseneruptur, spesifikt tilpasset **Uke 24 til 28** (15. september – 15. oktober).

## Innhold

- **Interaktiv Web-App (`index.html`)**:
  - Kompakt visning der alt passer på én skjerm uten unødvendig scrolling.
  - Git commit-stats kalenderrutenett med fargede firkanter og fargekoding for treningsdager, hviledager og fullførte dager.
  - Enkel dag-velger med neste/forrige og hurtigknapp for «I dag».
  - Ett-klikks knapp for å markere hele treningen som fullført, samt kompakte linjer med avkrysningsbokser for hver øvelse.
  - Direkte lokal lagring i nettleseren (`localStorage`).
  - Lyst og mørkt tema.
  - Beregning av streak, fullførte økter og visuell fremdriftsindikator.
  - Tilpasning av øvelser uke for uke etter avtale med fysioterapeut.
  - Lyst og mørkt tema, samt A4-utskriftsvennlig visning.
- **Treningsplan i Markdown (`TRENINGSPLAN.md`)**:
  - Fullstendig sjekkliste (`- [ ]`) og øvelsesbeskrivelser for manuell sporing i GitHub, Obsidian eller Notion.
- **Kjernelogikk og Enhetstester (`tracker-core.js` & `tests/`)**:
  - Testet med Node.js sitt innebygde testverktøy (`node --test`).

## GitHub Pages

Appen er klargjort for automatisk publisering på GitHub Pages via GitHub Actions:
- **URL etter publisering:** `https://dagjomar.github.io/fysio-plan-calendar/`
- **Aktivering i repo-innstillinger på GitHub:**
  1. Gå til repositoriets **Settings** &rarr; **Pages**.
  2. Under **Build and deployment** / **Source**, velg **GitHub Actions** (eller **Deploy from a branch** &rarr; velg `main` og `/ (root)`).
  3. Når pull requesten merges til `main`, rulles web-appen automatisk ut og er tilgjengelig umiddelbart på mobilen din.

## Komme i gang

### Bruk på Mobil (PWA / Web-app på hjemskjermen)
Appen er bygget som en Progressive Web App (PWA) optimalisert spesielt for mobilbruk:
- **iPhone / iOS (Safari):** Åpne siden, trykk på **Del**-ikonet (firkant med pil opp) og velg **«Legg til på Hjem-skjerm»**. Da åpner den seg som en fullverdig app uten nettleserlinjer.
- **Android (Chrome):** Åpne siden, trykk på menyen med tre prikker øverst til høyre og velg **«Installer app»** eller **«Legg til på startsiden»**.
- **Offline-støtte:** Service Worker sørger for at appen fungerer selv uten internettilkobling når du trener i treningssenteret eller på farten. Alle avkrysninger og notater lagres lokalt i telefonens minne.

### Åpne direkte i nettleseren
Du kan åpne filen `index.html` direkte i en hvilken som helst nettleser på datamaskin, nettbrett eller mobil.

### Kjøre lokal utviklingsserver
```bash
npm start
```
Eller med Python:
```bash
python3 -m http.server 3000
```
Gå deretter til `http://localhost:3000` i nettleseren.

### Kjøre enhetstester
```bash
npm test
```

## Nøkkelprinsipper for Uke 24–28
1. **Annenhver dag:** Kollagensyntesen i senen trenger 36–48 timer hvile for superkompensasjon.
2. **24-timers-regelen:** Smerte under trening ≤ 3–4/10; morgenen etter skal senen være tilbake til baseline.
3. **Rolig tempo:** 3 sekunder opp, 2 sekunder stopp på topp, 3 sekunder kontrollert ned.
