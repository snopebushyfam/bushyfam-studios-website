# BushyFam Studios – Website

Statische Website, zweisprachig (Deutsch/Englisch), mit Admin-Bereich.
Inhalte werden unter `/admin` gepflegt, Netlify baut und veröffentlicht automatisch.

## Aufbau

| Ordner / Datei | Zweck |
|---|---|
| `content/` | **Alle Inhalte** als JSON (vom Admin bearbeitet) |
| `content/projects/` | ein Projekt = eine Datei |
| `content/clients/` | Kunden & Partner |
| `build/build.mjs` | Build: erzeugt aus den Inhalten alle Seiten nach `dist/` |
| `build/i18n.mjs` | Feste Oberflächentexte und Adressen je Sprache |
| `css/site.css` | Gestaltung |
| `js/` | Verhalten: Menü/Filter (`site.js`), Filme (`hero-scrub.js`, `ending-scrub.js`), Clips (`video-preview.js`), Formular (`contact.js`) |
| `admin/` | Eingabemaske (Decap CMS) |
| `assets/` | Medien und Schriften; Uploads aus dem Admin unter `assets/uploads/` |
| `dist/` | Ergebnis des Builds – wird **nicht** ins Repository geladen |

## Seiten

Deutsch: `/`, `/arbeiten/`, `/arbeiten/<projekt>/`, `/studio/`, `/kontakt/`, `/impressum/`, `/datenschutz/`
Englisch: `/en/`, `/en/work/`, `/en/work/<projekt>/`, `/en/studio/`, `/en/contact/`, `/en/imprint/`, `/en/privacy/`

## Lokal bauen

Voraussetzung: Node.js (https://nodejs.org)

```
node build/build.mjs      # erzeugt dist/
```

Oder `vorschau-starten.bat` doppelklicken (baut und öffnet die Vorschau).

Fehlt in den Inhalten etwas, bricht der Build mit einer verständlichen Meldung ab –
online bleibt dann die zuletzt veröffentlichte Version.
