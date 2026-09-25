# Inhalte pflegen (Admin)

Adresse: `deine-adresse/admin` · Anmeldung mit GitHub.
Nach **Publish** baut Netlify die Seite neu, das dauert ein bis zwei Minuten.

## Neues Projekt anlegen

1. **Arbeiten (Projekte)** → **New Projekt**
2. Ausfüllen:
   - **Titel (DE)** und **Titel (EN)** – EN leer lassen heißt: deutscher Text wird angezeigt
   - **Kunde**, optional **Jahr**
   - **Kategorie**: Film, Fotografie, Logos & Branding oder Websites & Digital
   - **Adresse der Projektseite**: kleingeschrieben, mit Bindestrichen, z. B. `mueller-imagefilm`
   - **Auf der Startseite zeigen**: An = das Projekt erscheint unter „Ausgewählte Arbeiten“ (maximal drei)
   - **Reihenfolge**: kleinere Zahl steht weiter vorne
   - **Titelbild** mit Bildbeschreibung
   - **Bilder & Filme**: pro Eintrag Art wählen, Datei hochladen, bei Filmen zusätzlich Vorschaubild, Titel, Länge und „Hat Ton“
3. **Publish**

**Filme bitte vorher zu MP4 (H.264) umwandeln**, zum Beispiel mit HandBrake.
iPhone-Aufnahmen (.mov/HEVC) spielen in Chrome sonst nicht ab.
Richtwert: unter 25 MB pro Clip.

## Objects in Motion (Produktgalerie)

1. **Objects in Motion (Produktgalerie)** → **New Objekt**
2. Bild hochladen (am besten freigestellt oder vor dunklem Grund), Bildbeschreibung eintragen, **Publish**.

Die Bilder laufen automatisch in zwei Ebenen mit unterschiedlichem Tempo über die Startseite. Der Abschnitt erscheint nur, wenn mindestens ein Objekt eingetragen ist. Besucher können die Bewegung über den Knopf „Pause motion“ jederzeit anhalten; bei reduzierter Bewegung (Systemeinstellung) läuft sie von vornherein nicht.

## Besetzung (Models, DJs …)

1. **Besetzung** → **New Person**
2. Ausfüllen: **Name oder Künstlername** (Vorname genügt), **Adresse der Seite** (z. B. `lena`), **Rolle** (z. B. Model, DJ, Host), optional Stadt, Kurztext und Instagram, dann **Fotos** hochladen.
3. **Schriftliche Einwilligung liegt vor** anhaken – **nur dann** erscheint die Person auf der Website. Vorlage: `EINWILLIGUNG-VORLAGE.md`.
4. **Publish**

Die Filter auf der Seite entstehen automatisch aus dem Feld **Rolle**. Wenn du eine
neue Rolle schreibst, zum Beispiel „DJ“, entsteht dafür eine eigene Kategorie – gleiche
Schreibweise bedeutet gleiche Kategorie. Die Seite „Besetzung“ erscheint erst in der
Navigation, sobald mindestens eine Person freigegeben ist.

Auf jeder Personenseite gibt es den Button **„Diese Person anfragen“**. Er führt zum
Kontaktformular, in dem der Name schon in der Nachricht steht.

## Weitere Bereiche

- **Kunden & Partner**: Name, Logo, Website. Die Logoleiste auf der Startseite erscheint automatisch **ab fünf Logos**.
- **Seiten & Einstellungen → Allgemein**: Ort, E-Mail, Instagram, Suchmaschinen-Texte, die beiden Filme, Showreel, Freigabe für Suchmaschinen.
- **Startseite**: Überschriften und Kurztexte.
- **Leistungen**: die vier Begriffe zum Aufklappen.
- **Studio**: Porträt, Absätze, Stationen & Projekte, Schritte der Zusammenarbeit.
- **Kontaktseite**: Überschrift, Einleitung, Auswahlmöglichkeiten im Formular.
- **Impressum & Datenschutz**: Leerzeile = neuer Absatz. Eine Zeile, die mit `## ` beginnt, wird zur Zwischenüberschrift. Solange die Felder leer sind, steht auf der Seite „in Vorbereitung“.

## Wenn etwas nicht erscheint

- Der Build prüft die Inhalte. Schlägt er fehl, bleibt die alte Version online. Die Meldung steht in Netlify unter **Deploys** im Log, zum Beispiel „Titelbild fehlt“.
- Bilder und Filme immer über das Admin-Feld hochladen, nicht von Hand ins Repository legen.
