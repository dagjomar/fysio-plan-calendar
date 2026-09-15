# Fysio Plan Calendar – Akilles Senerehabilitering

Interaktiv treningsplan og kalender for opptrening etter akillesseneruptur, spesifikt tilpasset **Uke 24 til 28** (12. september – 12. oktober).

## Innhold

- **Interaktiv Web-App (`index.html`)**:
  - Oversikt over alle dager og de 16 planlagte treningsøktene (annenhver dag).
  - Avkrysning per øvelse og per dag med direkte lagring i nettleseren (`localStorage`).
  - Beregning av streak, fullførte økter og visuell fremdriftsindikator.
  - Tilpasning av øvelser uke for uke etter avtale med fysioterapeut.
  - Lyst og mørkt tema, samt A4-utskriftsvennlig visning.
- **Treningsplan i Markdown (`TRENINGSPLAN.md`)**:
  - Fullstendig sjekkliste (`- [ ]`) og øvelsesbeskrivelser for manuell sporing i GitHub, Obsidian eller Notion.
- **Kjernelogikk og Enhetstester (`tracker-core.js` & `tests/`)**:
  - Testet med Node.js sitt innebygde testverktøy (`node --test`).

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
