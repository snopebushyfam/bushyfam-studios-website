# Lokal ansehen (Windows)

Seit dem Umbau erzeugt ein Build-Skript die Seiten. Dafür wird **Node.js** gebraucht:
https://nodejs.org (Version „LTS“, Standardeinstellungen).

## Vorschau starten
1. Projektordner öffnen.
2. **`vorschau-starten.bat`** doppelklicken. Das Skript baut die Seite und öffnet sie unter http://localhost:8080
3. Zum Beenden das schwarze Fenster schließen.

Nach jeder Änderung an Texten oder Bildern erneut starten, damit neu gebaut wird.

## Nur bauen
```
node build\build.mjs
```
Das Ergebnis liegt in `dist\`.

## Mobile Ansicht prüfen
Chrome/Edge: `F12` → `Strg + Umschalt + M` → Breite z. B. 390 px.

## Hinweis
Der Ordner `dist\` gehört nicht ins Repository – Netlify baut ihn selbst.
