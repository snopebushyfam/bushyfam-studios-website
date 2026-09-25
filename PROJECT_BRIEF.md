# BushyFam Studios – Projektbrief

Stand: 15.09.2026 · Version 0.1 (Startseiten-Vorschau, Deutsch)

## Bestätigte Grundlagen

| Thema | Entscheidung |
|---|---|
| Marke | BushyFam Studios |
| Positionierung | Kreativstudio für Markenaufbau, Content und digitales Marketing |
| Ziel | Passende Unternehmensanfragen aus ganz Deutschland |
| Schwerpunkt | Werbeclips und Social-Media-Videos |
| Weiteres Standbein | Kunst: Gemälde und Kunstwerke als Auftragsarbeit (u. a. für Büros und Geschäftsräume) |
| Weitere Leistungen | Namensentwicklung, Logos, visuelle Markenauftritte, Fotografie, Grafikdesign, Social-Media-Planung und -Betreuung, Websites, Google- und Instagram-Anzeigen |
| Ansprechpartner | Taha Gürsoy, Gründer; übernimmt die Arbeit persönlich; bei Ads mit einem Partner |
| Standort | Köln (Zusammenarbeit deutschlandweit) |
| Instagram | https://www.instagram.com/bushyfamstudios/ (@bushyfamstudios) |
| Referenz Nelvie Tiafack | Nennung und Logos freigegeben (15.09.2026) |
| Sprache | Deutsch (Hauptsprache); vollständige englische Version folgt |
| Gestaltung | Nahezu schwarz, weiße Schrift, breite kräftige Sans, feine Orbitlinien, Farbe aus echten Projektbildern |
| Medien | Originale unverändert, keine generativen Änderungen, fehlende Dateien als sachliche Platzhalter |

## Umfang dieser Version

Enthalten:
- Startseite mit Navigation (Desktop + zugängliches mobiles Menü), Einstieg mit scrollgesteuertem Video, MASON’S (Video-Bereich + Produktkarussell), Nelvie Tiafack (Logodesign), Leistungen, Zusammenarbeit, Gründer, Kontaktformular (Oberfläche + Validierung, ohne Versand), Footer.
- Inhalte in `content/*.json`, bearbeitbar über den Admin-Bereich `/admin`.
- Scrub-optimierte Hero-Videodateien und skalierte Produktfotos.

Bewusst nicht enthalten (folgt in weiteren Schritten):
- Hosting, Domain, echte Formularanbindung
- Englische Version und DE/EN-Umschalter (vorbereitet: `navigation.languageSwitch.enabled = false`)
- Projektunterseiten
- Eingabemaske zur Inhaltspflege
- Impressum und Datenschutzerklärung (im Footer als „in Vorbereitung“ gekennzeichnet, keine Links)
- Analytics, Tracking, Drittanbieter-Einbettungen (keine vorhanden; Schrift ist selbst gehostet)

## Technische Entscheidung

**Statisches HTML + CSS + JavaScript, ohne Framework und ohne Build-Schritt.**

Begründung:
- Läuft per Doppelklick am Windows-PC, auf jedem statischen Hosting (z. B. Netlify, Cloudflare Pages, klassischer Webspace) und ist vollständig exportierbar.
- Keine Abhängigkeiten, keine Lizenz- oder Update-Pflichten, schnelle Ladezeit.
- Klare Trennung: `content/` (Inhalte) · `assets/` (Medien) · `css/` (Layout) · `js/` (Verhalten).
- Die Inhaltsdatei ist JSON-kompatibel. Empfohlener nächster Schritt für die Eingabemaske: Umstellung auf einen Static-Site-Generator (z. B. Eleventy oder Astro) mit JSON-Daten plus Git-basiertem CMS (z. B. Decap CMS). Dann wird HTML vorab erzeugt (besser für Suchmaschinen), und die Pflege läuft über eine Maske ohne eigenes Adminsystem.

Hinweis: In dieser Vorschau werden die Inhalte per JavaScript eingesetzt. Für den Livegang sollte das HTML vorab erzeugt werden (siehe oben). Außerdem enthält `index.html` ein `noindex`, das vor dem Livegang entfernt werden muss.

## Hero-Video – Befund und Lösung

Aktuelle Quelle (15.09.2026): `AILEENUFO.mov`, gegradete Fassung. ProRes 422 HQ, 1080 × 1920, 10 Bit, BT.709, 24 fps, 7,04 s, 169 Bilder, mit Tonspur, 112 MB. ProRes wird von Browsern nicht zuverlässig abgespielt und ist für das Web viel zu groß.
(Vorgänger: `hf_20260915_012005_….mp4`, H.264 mit nur 2 Keyframes – ersetzt.)

Web-Fassungen (Bildinhalt und Grading unverändert, nur technisch kodiert: H.264 8 Bit 4:2:0, BT.709 gekennzeichnet, jedes Bild ein Keyframe, keine B-Frames, ohne Ton, Faststart):
- `hero-ufo-scrub-1080.mp4` – 1080 × 1920, 6,4 MB (nur Desktop mit hochauflösendem Bildschirm)
- `hero-ufo-scrub-720.mp4` – 720 × 1280, 3,5 MB
- `hero-ufo-scrub-540.mp4` – 540 × 960, 2,1 MB
- `hero-ufo-poster.jpg` – erstes Bild, Standbild/Ersatz

Auswahl: nach Anzeigebreite × Pixeldichte; mobil höchstens 720 (Datenvolumen). Gleiche Länge und Bildzahl wie die Vorgängerfassung, daher keine Änderung an Scrollstrecke oder Timing. Der obere Sternenhimmel des ersten Bildes ist weiterhin motivfrei (≈ 22 %), der mobile Anschluss unter den Buttons bleibt gültig.

Verhalten: Scrollposition → Videoposition (vor- und rückwärts), weich nachgeführt; ohne Scrollen steht das Bild. Kein Autoplay, kein Ton, kein Abfangen von Mausrad/Touch. Scrollstrecke: Desktop 270 vh, mobil 230 svh. Der Film läuft auf den ersten 85 % der Strecke; ab ≈ 76 % (Film bereits schwarz) wird der Satz „Kreativstudio für Markenaufbau, Content und digitales Marketing.“ eingeblendet. Danach normale Seite.
Ersatz (Standbild, Satz als normaler Textblock darunter) bei: reduzierter Bewegung, Datensparmodus des Geräts, fehlender H.264-Unterstützung, Ladefehler.

Hinweis iPad/iPhone: WebKit zeigt Frames beim Suchen teils erst nach einem Wiedergabeimpuls. Das Skript startet deshalb nur auf Apple-Touch-Geräten einmal stumm und stoppt sofort bei 0 s (nicht sichtbar). Auf echten Geräten noch zu prüfen.

## Offene Punkte

1. **Bestätigter dunkler Website-Entwurf** lag in diesem Chat nicht als Datei vor → Umsetzung nach schriftlicher Beschreibung. Bitte hochladen, dann Abgleich.
2. ~~MASON’S-Videoclips~~ → erledigt: 3 Clips eingebunden (Zuordnung über „M“-Signet, bitte bestätigen).
2a. **Kontext zu MASON’S** (Was ist MASON’S, Aufgabe, Einsatz des Materials): fehlt → Einleitungstext leer und ausgeblendet.
3. ~~Gründerporträt~~ → eingebunden.
4. **Logo als freigestellte Datei** (SVG oder PNG mit Transparenz, höhere Auflösung). Aktuell 500 × 500 px mit schwarzem Grund, per CSS-Ausschnitt gezeigt.
5. **Original-Fotodateien** für MASON’S: 5 der 6 Bilder wirken wie exportierte Kopien (PNG mit Alphakanal, 1018–1026 × 1536 px). Kamera-Originale bzw. finale Exporte wären besser.
6. **Künstlername** von Taha: offen.
7. **Museumsreferenz**: redaktionell zu prüfen, nicht veröffentlicht.
8. **Englische Version**: Texte fehlen.
9. **Formularversand**: Dienst wählen (z. B. eigener Mailserver/Webspace-PHP, Formspree, Netlify Forms – Datenschutz prüfen), Datenschutzhinweis am Formular ergänzen. Spam-Schutz ist vorbereitet (Honeypot + Mindestzeit 3 s, ohne Drittanbieter); die serverseitige Prüfung muss beim Anbinden ergänzt werden.
10. **Impressum und Datenschutzerklärung**: Angaben fehlen; vor Livegang zwingend erforderlich.
11. ~~Freigabe Nelvie Tiafack~~ → erteilt.
13. **E-Mail-Adresse**: folgt (Feld `brand.email` ist vorbereitet, wird automatisch im Kontaktbereich angezeigt).
14. ~~Zuordnung Foto `41C5F299-….png`~~ → Porträt Taha, eingebunden.
12. **Zeitraum/Budget**: bewusst Freitext statt Auswahllisten, damit keine Budgetstufen erfunden werden. Bei Wunsch später auf Auswahl umstellen.

## Änderungen Version 0.2 (15.09.2026)

- Einstieg: Übergangssatz über dem schwarzen Filmende statt leerem Bildschirm; Datensparmodus zeigt Standbild.
- MASON’S: leerer Videobereich und inhaltsleerer Einleitungssatz ausgeblendet.
- Leistungen: präzisere Texte mit Suchbegriffen (Videoproduktion, Werbeclips, Reels, Google- und Instagram-Anzeigen); keine neuen Leistungen, keine Versprechen. Abschnittstitel „Von der Marke bis zur Kampagne“.
- Seitentitel und Beschreibung für Suchmaschinen geschärft.
- Formular: Leistungsauswahl als kompakte Auswahl-Chips (mobil 8 statt 10 Zeilen, Desktop 4 statt 5); Spam-Schutz vorbereitet.
- Provisorische Favicons aus dem Original-Logo (Symbol ausgeschnitten, auf schwarzen Grund gesetzt, nicht nachgezeichnet).

Offen (Stand v0.2, aktualisiert in v0.3 unten).

## Änderungen Version 0.3 (15.09.2026)

- MASON’S: drei Videoclips eingebunden (Start nur per Klick, Titel, Dauer, Ton-Hinweis; mobil seitlich wischbar, Tastaturfokus scrollt Clip ins Bild; nur ein Clip läuft gleichzeitig).
- Standort Köln im Kontaktbereich, Footer und in der Seitenbeschreibung.
- Instagram als direkter Kontaktweg und im Footer (neuer Tab, Tracking-Parameter aus dem Link entfernt).
- Nelvie-Tiafack-Freigabe dokumentiert.
- Gründerporträt eingebunden (verzögert geladen, 540/1086 px je nach Bildschirm, Originalformat 3:4).

Weiterhin offen: Kontext zu MASON’S, Logo als SVG, E-Mail, Angaben für Impressum und Datenschutz.

## Änderungen Version 0.4 (15.09.2026)

- Alle Texte gelesen und vereinheitlicht (Gedankenstriche in den Projekttiteln korrigiert; keine Rechtschreibfehler gefunden).
- Leistungen deutlich ausführlicher, neuer Abschnittstitel „Video, Marke und Kunst“ mit Einleitungssatz, damit nicht der Eindruck entsteht, es gäbe nur Video.
- Neue Leistung **„Kunst & Gemälde“** (Auftragsarbeiten für Büros und Geschäftsräume) und neue Formularauswahl „Gemälde & Kunstwerke“.
- Zusammenarbeit und Gründertext länger und persönlicher, weiterhin ohne Zeitversprechen oder Erfolgsgarantien.
- Seitenbeschreibung um Gemälde ergänzt.
- Neuer, vorbereiteter Bereich **„Stationen & Projekte“** im Gründerteil: erscheint automatisch, sobald Einträge in `founder.stations` stehen. Technisch getestet, derzeit leer.

### Stationen & Projekte – benötigte Angaben

Pro Station: Jahr, Titel, ein bis drei Sätze zu Tahas konkretem Beitrag, optional ein Link, optional ein Bild. Noch zu klären:

| Station | Offene Angaben |
|---|---|
| Museum für Moderne Kunst | Welches Museum (Stadt), Jahr, Form der Beteiligung (Ausstellung, Sammlung, Aktion), Werktitel, Foto |
| Hans-Peter Porzner | Art und Zeitraum der Zusammenarbeit, zeigbares Ergebnis |
| Olaf Neumann / Comic „Doc Tari“ | Tahas Rolle (Zeichnungen, Cover, Figuren, Logo), genaue Schreibweise, Bildfreigabe |
| Buch „Der Pfad durch den Sturm“ | Genauer Titel und Autorenname wie bei Amazon, Amazon-Link, Coverbild, kurze Inhaltsangabe |
| Rotes Kreuz / Buch zum Theaterstück | Welcher Verband, Jahr, genaue Rolle. **Achtung:** Das Rotkreuz-Zeichen ist gesetzlich geschützt – Logo nur mit ausdrücklicher Erlaubnis, Namensnennung im Text ist unkritisch |
| Gemälde für Unternehmen | Fotos der Werke (gern im Raum), Freigabe zur Nennung der Auftraggeber |

Quellen bzw. Belege liefert Taha nach; bis dahin bleibt der Bereich unveröffentlicht.

### Ebenfalls angekündigt
Weitere Produktbilder und Videos. Benötigt: Originaldateien (ZIP) und pro Datei die Zuordnung zum Kunden; bei neuen Kunden zusätzlich Name, Kontext und Freigabe.

## Änderungen Version 0.5 (20.09.2026) – Inhaltspflege

- Inhalte von `content/site-content.js` auf acht JSON-Dateien in `content/` umgestellt; `js/boot.js` lädt sie und startet danach die übrigen Skripte.
- Admin-Bereich unter `/admin` mit **Decap CMS** (Version 3.11, fest verdrahtet) und Eingabemasken für alle Bereiche, auf Deutsch beschriftet.
- Anmeldung über **GitHub-Backend mit Netlify-OAuth**. Netlify Identity und Git Gateway wurden bewusst nicht gewählt: Netlify hat beide als veraltet gekennzeichnet (Identity 02/2025, Git Gateway wird für Neueinrichtungen nicht mehr empfohlen).
- `netlify.toml` mit Sicherheits-Headern, `noindex` für `/admin`, kurzer Cache für `content/`, langer Cache für `assets/`.
- `.gitignore` schließt `originals/` aus; Masterdateien bleiben lokal.
- Neue Anleitungen: `ANLEITUNG-GITHUB-NETLIFY.md` (einmalige Einrichtung) und `ANLEITUNG-INHALTE.md` (Videos, Bilder und Texte selbst einpflegen).
- Lokale Vorschau läuft ab jetzt über `vorschau-starten.bat`, nicht mehr per Doppelklick auf `index.html` (JSON lässt sich über `file://` nicht laden). Die Seite zeigt in dem Fall einen verständlichen Hinweis.

Offen für diesen Schritt: GitHub-Benutzername in `admin/config.yml` eintragen (eine Zeile), Netlify mit dem Repository verbinden, GitHub-OAuth-App anlegen.

## Änderungen Version 0.6 (21.09.2026)

- **Neues Einstiegsvideo** (quadratisch, 1080 × 1080, Frau im UFO-Cockpit, Zoom bis in die Pupille). Web-Fassungen `assets/hero/hero-cockpit-sq-540/720/1080.mp4`, nur Keyframes, ohne Ton. Neue Dateinamen, weil Netlify Medien ein Jahr zwischenspeichert.
- **Mobiler Einstieg:** nur Headline, direkt darunter der Film. Beschreibung und Buttons mobil ausgeblendet; „Projekt anfragen“ sitzt mobil in der Kopfleiste (unter 420 px Menü nur als Symbol, Beschriftung bleibt für Screenreader erhalten). Desktop unverändert.
- **Keine Orbitringe im Einstieg**; Filmränder laufen per Maske weich ins Schwarz aus (kein sichtbarer Bildkasten).
- **Abschlussfilm vor dem Footer** (Gegenstück zum Einstieg: Zoom aus der Pupille bis zum UFO-Bullauge). Scrollgesteuert vor- und rückwärts, startet ab halb sichtbarem Bereich, lädt erst in der Nähe, Standbild bei reduzierter Bewegung, Datensparmodus, Ladefehler. Die ersten 18 schwarzen Bilder des Originals wurden weggelassen. Im Admin unter „Allgemein, Navigation & Einstieg → Abschlussfilm“ ein- und ausschaltbar.
- Layout liest das Seitenverhältnis aus den Videoangaben – Hochformat und Quadrat funktionieren ohne Codeänderung.
- Videogröße wird nach tatsächlicher Anzeigegröße gewählt (Handy 720, Desktop 720 bzw. 1080 bei hochauflösenden Bildschirmen).

## Version 1.0 (22.09.2026) – neuer Aufbau, zweisprachig

**Architektur**
- Aus der einen, im Browser zusammengebauten Seite wurden **fertig erzeugte HTML-Seiten**: ein Build-Skript ohne externe Abhängigkeiten (`build/build.mjs`, Node) erzeugt bei jedem Commit alle Seiten nach `dist/`. Das behebt das Suchmaschinen-Problem, ermöglicht Projektseiten und Netlify Forms. Admin, GitHub und Netlify bleiben unverändert.
- **Zweisprachig:** Deutsch unter `/`, Englisch unter `/en/`, mit Sprachumschalter, `hreflang`-Verweisen und eigenen Seitentiteln. Im Admin hat jeder Text ein DE- und ein EN-Feld; Bilder, Filme und Listen gibt es nur einmal. Bewusst **nicht** über die i18n-Funktion von Decap gelöst: Dort werden Listen je Sprache getrennt gepflegt, und die Funktion hat mehrere offene Fehlerberichte.
- **Datenmodell skaliert:** Projekte und Kunden sind eigene Sammlungen. Neue Kunden brauchen keinen Code mehr. MASON’S und Nelvie Tiafack wurden zu drei Projekten übertragen.

**Seiten**
`/` · `/arbeiten/` (Filter nach Kategorie) · `/arbeiten/<projekt>/` · `/studio/` · `/kontakt/` · `/impressum/` · `/datenschutz/` – jeweils auch unter `/en/`.

**Startseite (Reihenfolge)**
Einstieg mit Film → Ausgewählte Arbeiten (drei) → Leistungen zum Aufklappen → Taha-Teaser → Kundenlogos (erscheinen ab fünf) → Abschluss-CTA → Abschlussfilm → Footer. Showreel-Platz vorhanden, erscheint sobald eine Datei hinterlegt ist.

**Bewusst nicht umgesetzt (aus dem Brief)**
- *Ticker* und *eigener Mauszeiger*: Agentur-Klischee, doppeln die Leistungen bzw. helfen mobil nicht.
- *Lab/Experiments*: entfällt, Kunst bleibt privat (Entscheidung vom 22.09.).
- *„We“ und „Available Worldwide“*: Ein-Personen-Studio mit Partner für Anzeigen – bleibt bei „Köln · deutschlandweit“.
- *Kundenlogo-Laufband*: gebaut, erscheint aber erst ab fünf Logos statt mit zwei.
- *Englisch als einzige Sprache*: stattdessen beide Sprachen.

**Neu im Admin**
Projekte (inkl. Reihenfolge, Kategorie, „Auf Startseite zeigen“, Galerie), Kunden & Partner, Showreel, Formular-Freigabe, Freigabe für Suchmaschinen, Impressum und Datenschutz.

**Weiterhin offen**
E-Mail-Adresse, Angaben für Impressum und Datenschutz, Domain, Logo als SVG, Vorschaubild für geteilte Links (Open Graph nutzt derzeit das Standbild des Einstiegsfilms), Jahreszahlen der Projekte, Kontext zu MASON’S, englische Texte gegenlesen.

## Version 1.1 – Besetzung (24.09.2026)

Neue Sammlung **Besetzung** für Menschen, mit denen das Studio arbeitet: Models (Priorität), später DJs, Hosts und andere Rollen.

- Eigene Seiten `/besetzung/` und `/besetzung/<person>/` (englisch `/en/cast/`), Filter entstehen automatisch aus dem Feld „Rolle“.
- Anzeige mit Vorname oder Künstlername, Rolle, Stadt, Kurztext, Fotos und optional Instagram.
- Button „Diese Person anfragen“ führt ins Kontaktformular und trägt den Namen dort ein.
- **Datenschutz:** Pflichtfeld „Schriftliche Einwilligung liegt vor“. Ohne Häkchen erscheint die Person nirgends – auch nicht in Sitemap oder Navigation. Vorlage für die Einwilligung liegt als `EINWILLIGUNG-VORLAGE.md` bei (juristisch prüfen lassen). Bei Minderjährigen zusätzlich Zustimmung der Sorgeberechtigten.
- Die Datenschutzerklärung muss die Veröffentlichung von Personenfotos abdecken, bevor die Seite öffentlich geht.
- Events und Festivals als Angebot sind bewusst noch nicht umgesetzt (zweitrangig laut Absprache).
