# Einmalige Einrichtung: GitHub + Netlify + Admin-Bereich

Zeitbedarf etwa 20–30 Minuten. Schritt 1 bitte am **Windows-PC** machen, den Rest kannst du auch am iPad erledigen.

**Bitte keine Passwörter weitergeben.** Alle Schritte hier machst du selbst in deinem Konto.

---

## Schritt 1 – Projekt zu GitHub hochladen (am PC)

1. Auf [github.com](https://github.com) anmelden (Konto ist kostenlos).
2. Oben rechts auf **+** → **New repository**.
3. Ausfüllen:
   - **Repository name:** `bushyfam-studios-website`
   - **Private** auswählen
   - Haken bei „Add a README file“ **nicht** setzen
   - **Create repository**
4. Auf der nächsten Seite: **uploading an existing file** anklicken.
5. ZIP **entpacken** (Rechtsklick → Alle extrahieren). Wichtig: Die ZIP-Datei selbst darf **nicht** hochgeladen werden, GitHub packt sie nicht aus. Dann **den Inhalt** des entpackten Ordners `bushyfam-studios-github` ins Browserfenster ziehen – also `index.html`, `admin`, `assets`, `content`, `css`, `js` und die übrigen Dateien, **nicht** den Ordner selbst.
6. Warten, bis alle Dateien hochgeladen sind, dann unten auf **Commit changes**.

> Der Ordner `originals/` mit den Masterdateien ist bewusst nicht dabei. Er bleibt bei dir auf dem PC.

---

## Schritt 2 – entfällt

Dein GitHub-Benutzername `snopebushyfam` ist in `admin/config.yml` bereits eingetragen.

---

## Schritt 3 – Netlify mit dem Repository verbinden

Deine Seite „inspiring-mandazi-b55d10“ wurde bisher per Drag-and-drop hochgeladen. Jetzt wird sie mit GitHub verbunden, damit Änderungen automatisch online gehen.

1. In Netlify die Seite öffnen → **Project configuration** → **Build & deploy** → **Continuous deployment**.
2. **Link repository** bzw. **Connect to repository** → **GitHub** → Zugriff bestätigen.
3. Repository `bushyfam-studios-website` auswählen.
4. Einstellungen:
   - **Branch:** `main`
   - **Build command:** leer lassen
   - **Publish directory:** `.` (ein Punkt)
5. Speichern. Netlify veröffentlicht die Seite anschließend automatisch.

---

## Schritt 4 – Anmeldung für den Admin-Bereich einrichten

Damit du dich unter `/admin` mit deinem GitHub-Konto anmelden kannst.

**a) In GitHub eine Anmelde-App anlegen**

1. [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Ausfüllen:
   - **Application name:** `BushyFam Admin`
   - **Homepage URL:** die Adresse deiner Netlify-Seite, z. B. `https://inspiring-mandazi-b55d10.netlify.app`
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
3. **Register application**.
4. **Client ID** notieren. Dann **Generate a new client secret** und das **Client Secret** notieren. Es wird nur einmal angezeigt.

**b) In Netlify eintragen**

1. Netlify → deine Seite → **Project configuration** → **Access** (bzw. **Access & security**) → Bereich **OAuth** / **Authentication providers**.
2. **Install provider** → **GitHub** auswählen.
3. Client ID und Client Secret einfügen, speichern.

---

## Schritt 5 – Testen

1. `https://DEINE-NETLIFY-ADRESSE/admin` aufrufen.
2. **Login with GitHub** klicken und den Zugriff bestätigen.
3. Links erscheinen die Bereiche: Allgemein, Arbeiten, MASON’S, Leistungen, Zusammenarbeit, Studio, Kontakt.
4. Zum Test: unter **Leistungen** ein Wort ändern → **Publish**.
5. Nach ein bis zwei Minuten die Seite neu laden. Die Änderung ist online.

---

## Wenn etwas klemmt

| Problem | Ursache und Lösung |
|---|---|
| `/admin` bleibt weiß | `admin/config.yml`: `repo:` steht noch auf `DEIN-GITHUB-NAME` |
| „Login with GitHub“ führt zu einem Fehler | Callback-URL in der GitHub-App muss exakt `https://api.netlify.com/auth/done` lauten |
| Änderung erscheint nicht | In Netlify unter **Deploys** prüfen, ob ein neuer Deploy läuft |
| Datei zu groß beim Upload | GitHub nimmt maximal 100 MB pro Datei. Videos vorher verkleinern |

## Wichtig für später

- **Domain:** Wenn die Domain kommt, muss die **Homepage URL** in der GitHub-App auf die neue Adresse geändert werden.
- **Vor dem Livegang:** In `index.html` die Zeile mit `noindex` entfernen, sonst bleibt die Seite für Google unsichtbar. Außerdem müssen Impressum und Datenschutz fertig sein.

---

## Nachtrag zum Umbau (Version 1.0)

Ab jetzt baut Netlify die Seite aus den Inhalten. Das ist in `netlify.toml` hinterlegt:

- **Build command:** `node build/build.mjs`
- **Publish directory:** `dist`

Du musst dazu in Netlify nichts einstellen, die Datei hat Vorrang vor den Einstellungen in der Oberfläche.

### Einmalig in Netlify prüfen
1. **Deploys** → nach dem Upload muss ein neuer Deploy mit „Published“ erscheinen. Scheitert er, steht der Grund im Log.
2. **Forms** → **Formularerkennung aktivieren**, damit das Kontaktformular Anfragen entgegennimmt. Danach unter **Notifications** eine E-Mail-Benachrichtigung einrichten.
3. Das Formular sendet seit Version 3 immer an Netlify Forms (kein Vorschau-Schalter mehr). Ist die Formularerkennung aus, meldet das Formular beim Absenden einen Fehler und verweist auf WhatsApp – es behauptet nie fälschlich, die Anfrage sei angekommen. Nach dem Einschalten der Erkennung einmal neu veröffentlichen (Deploys → Trigger deploy), damit Netlify das Formular erfasst, und eine Testanfrage schicken.
4. **Für Suchmaschinen freigeben** (im Admin unter *Allgemein*) erst einschalten, wenn Domain, Impressum und Datenschutz stehen. Solange bleibt die Seite auf `noindex`.

---

## Wichtig bei diesem Update (v1.3): zwei Dateien manuell löschen

MASON’S wurde von zwei getrennten Projekten zu einem zusammengeführt. GitHub-Uploads
löschen nie automatisch alte Dateien, deshalb bitte **nach** dem Hochladen dieser
ZIP zusätzlich von Hand entfernen:

1. In GitHub zu `content/projects/` navigieren.
2. `masons-clips.json` öffnen → Mülltonne oben rechts → Commit.
3. `masons-produktfotografie.json` öffnen → Mülltonne oben rechts → Commit.

Ohne diesen Schritt erscheint MASON’S doppelt: einmal als der neue zusammengeführte
Fall, einmal als die beiden alten Einzelprojekte.


---

## ⚠️ Wichtig bei diesem Update (v1.4): Build schlägt jetzt absichtlich fehl

Dieses Update enthält eine neue Sicherung. **Wenn `masons-clips.json` und
`masons-produktfotografie.json` noch in `content/projects/` liegen, bricht
der nächste Deploy mit einem Fehler ab** – das ist gewollt, damit MASON’S
nicht dreifach live geht.

**Bitte in dieser Reihenfolge vorgehen:**

1. Diese ZIP wie gewohnt komplett hochladen und committen.
2. **Sofort danach**, noch bevor du zu Netlify wechselst: in GitHub zu
   `content/projects/` gehen und dort löschen:
   - `masons-clips.json`
   - `masons-produktfotografie.json`

   (Datei anklicken → Mülltonne oben rechts → Commit.)
3. Erst danach in Netlify **Deploy project without cache** auslösen.

Falls der Deploy trotzdem fehlschlägt: im Deploy-Log nachsehen, welche
Datei laut Fehlermeldung noch vorhanden ist, und genau die löschen.
