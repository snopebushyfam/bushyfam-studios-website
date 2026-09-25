# Prüfbericht – Version 0.1

Getestet am 15.09.2026 in einer Linux-Testumgebung mit **Chrome 131 (Chrome for Testing, headless)** über Playwright, per lokalem Server (`python -m http.server`) und per `file://`. Zusätzlich Chromium ohne H.264-Unterstützung für den Ersatzfall. Alle Tests automatisiert mit Messwerten und Screenshots.

## Bestanden

| Prüfkriterium | Ergebnis |
|---|---|
| Kein horizontaler Überlauf | `scrollWidth` = Viewport bei 390, 768 und 1440 px, über die gesamte Seitenhöhe gemessen |
| Navigation | Desktop-Links springen zu den Abschnitten; Ziel erhält Fokus; Abstand unter fixiertem Header korrekt |
| Mobiles Menü | Öffnet (`aria-expanded=true`), Fokus auf erstem Link, Escape schließt und setzt Fokus zurück, Linkklick schließt und springt, Fokusfalle im Menü |
| Video vorwärts/rückwärts | Scrollpositionen 0 → 30 → 60 → 95 → 50 → 10 % ergaben 0,00 → 2,08 → 4,17 → 6,63 → 3,49 → 0,69 s (alle drei Breiten) |
| Video ohne Scrollen | Position nach 1 s Wartezeit unverändert; Video durchgehend pausiert; stumm; keine Tonspur |
| Video per `file://` | Scrubbing funktioniert (3,48 → 6,29 → 1,40 s) |
| Text-Ausblendung (Desktop) | Voll lesbar bis ca. 42 % der Strecke, bei 60 % halbe Deckkraft, bei 95 % ausgeblendet; bei Tastaturfokus wieder sichtbar |
| Ersatz bei Ladefehler | Standbild-Modus (`static:load-error`) |
| Ersatz ohne H.264 | Standbild-Modus (`static:no-support`) |
| Reduzierte Bewegung | Einstieg: Standbild, kein Video geladen, keine lange Scrollstrecke. Karussell: keine automatische Bewegung, Pause-Schaltfläche ausgeblendet, Wischen/Pfeiltasten weiter möglich |
| Karussell läuft | ≈ 28 px/s von rechts nach links |
| Karussell nahtlos | Anordnung der Bilder bei Position x und x + Satzbreite identisch → Sprung unsichtbar |
| Karussell Pause/Fortsetzen | Schaltfläche stoppt und startet; Beschriftung wechselt; Statusansage für Screenreader |
| Karussell bei Tastaturfokus | Pausiert; Pfeiltasten scrollen |
| Karussell außerhalb Sichtbereich | Pausiert |
| Kopien der Schleife | 8 Kopien: alle `aria-hidden`, `inert`, leerer Alt-Text |
| Bilder vollständig | Feste Höhe, Breite proportional, `object-fit: contain`, kein Beschnitt |
| Clip-Komponente | Mit temporär eingesetzter Testdatei: Video entsteht erst beim Klick, spielt mit Bedienelementen |
| Formular leer abgeschickt | Fehlerübersicht erhält Fokus, 3 verständliche Meldungen mit Sprunglinks, Felder `aria-invalid` |
| Ungültige E-Mail | „Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@firma.de.“ |
| Gültig abgeschickt | Hinweis „… wurde nicht gesendet, weil noch kein Versanddienst angeschlossen ist.“ **0 Netzwerkanfragen** nach dem Absenden |
| Tastatur-Reihenfolge | Skip-Link → Logo → Arbeiten → Leistungen → Studio → Projekt anfragen → Einstiegs-Buttons → Karussell |
| JavaScript-Fehler | Keine |
| Drittanbieter | Keine externen Anfragen (Schrift lokal) |

## Nicht getestet / Grenzen

- **Echte Geräte**: kein Test auf iPad, iPhone, Android oder Windows-PC. Insbesondere das Scrubbing auf iPadOS/iOS-Safari (inkl. des stummen Wiedergabeimpulses) muss am Gerät geprüft werden.
- **Safari und Firefox**: nicht getestet.
- **Flüssigkeit** des Scrubbings: nur Positionswerte gemessen, nicht die wahrgenommene Bildrate. Headless-Chrome ohne GPU ist nicht aussagekräftig.
- **Touch-Wischen** im Karussell: native Scrollfläche, nicht mit echter Touch-Geste getestet (Pfeiltasten und Programm-Scroll getestet).
- **Screenreader** (NVDA, VoiceOver): nicht getestet; Semantik und ARIA nur im Code geprüft.
- **Kontrast**: rechnerisch geprüft (Fließtext grau #b3b3ae auf Schwarz ≈ 9,5:1, Fehlerfarbe ≈ 9:1), kein automatisierter Audit.
- **Lighthouse/Ladezeit**: nicht gemessen.
- **Abgleich mit dem bestätigten Entwurf**: nicht möglich, da die Datei nicht vorlag.
- **Echte MASON’S-Clips**: nicht vorhanden; Komponente nur mit Testdatei geprüft.

## Bekannte Beobachtungen

- Einige Produktfotos haben keinen ganz reinschwarzen Hintergrund. Auf der schwarzen Seite sind deshalb leichte Bildkanten sichtbar. Nicht retuschiert (Vorgabe: Originale unverändert).
- Das Logo ist mit 500 px Seitenlänge knapp für hochauflösende Bildschirme; „STUDIOS“ ist im Header klein. Eine SVG-Datei würde das lösen.
- Die Inhalte werden per JavaScript eingesetzt. Ohne JavaScript erscheint ein Hinweis statt der Inhalte (für Livegang vorab erzeugen, siehe PROJECT_BRIEF.md).

## Nachtest 15.09.2026 – neues Einstiegsvideo (AILEENUFO.mov, gegradet)

| Prüfung | Ergebnis |
|---|---|
| Web-Fassungen | 1080/720/540: je 169 Bilder, 7,04 s, alle Bilder Keyframes, ohne Ton |
| Quellenauswahl | 390 px @3x → 720 · 768 px @2x → 720 · 1440 px @1x → 540 · 1440 px @2x → 1080 |
| Scrubbing vor/zurück | 2,44 → 5,59 → 0,70 s (alle vier Konfigurationen) |
| Überlauf | keiner (390/768/1440) |
| JavaScript-Fehler | keine |

Nicht geprüft: Farbwirkung des Gradings auf echten Displays (Umwandlung 10 Bit 4:2:2 → 8 Bit 4:2:0 für Browser-Kompatibilität; bei sehr feinen dunklen Verläufen ist minimales Banding möglich).

## Nachtest 15.09.2026 – Version 0.2

| Prüfung | Ergebnis |
|---|---|
| Hero-Übergang | Film läuft bis 85 % der Strecke (0 → 6,99 s), Satz bei 80 % zu 25 %, ab 86 % voll sichtbar, beim Zurückscrollen wieder ausgeblendet (390/768/1440) |
| Satz-Position | Vollständig im Bildschirm, horizontal zentriert (alle Breiten) |
| Datensparmodus (`saveData`) | Standbild, **keine** Videoanfrage |
| Reduzierte Bewegung | Standbild, Satz als sichtbarer Textblock; kein Überlauf |
| Leerer Videobereich | Nicht gerendert (keine Überschrift, kein Platzhalter) |
| Chips | Tastatur (Leertaste an/aus), Klick, sichtbarer Fokusrahmen, Mindesthöhe 44 px; mobil 8 Zeilen / Desktop 4 Zeilen |
| Spam-Schutz | Zu schnell → `too-fast`; normal → `ok`; Honeypot befüllt → `honeypot`; Honeypot per Tab nicht erreichbar; 0 Netzwerkanfragen |
| Favicons, Titel, Beschreibung | Eingebunden, alle Dateien HTTP 200 |
| Regression | Karussell (nahtlos, Pause, Fokus, außerhalb), Menü, Formularfehler, `file://`, Ladefehler, ohne H.264, Clip-Komponente: bestanden |
| Überlauf / Fehler | Kein Überlauf bei 390/768/1440; keine JavaScript- oder Ladefehler |

Nicht geprüft: echte Geräte, Safari/Firefox, Screenreader, Datensparmodus auf echtem Android-Gerät (nur simuliert). Der Spam-Schutz ist clientseitig und muss beim Anbinden eines Versanddienstes serverseitig ergänzt werden.

## Nachtest 15.09.2026 – Version 0.3

| Prüfung | Ergebnis |
|---|---|
| Clips vorab geladen? | Nein – 0 Clip-Anfragen vor dem Klick (390/768/1440) |
| Start per Tastatur (Tab + Enter) | Clip startet mit Bedienelementen, erhält Fokus, Beschriftung korrekt |
| Nur ein Clip gleichzeitig | Start von Clip 1 pausiert Clip 2 |
| Mobil wischbare Leiste | Fokus auf Clip 2/3 scrollt ihn vollständig ins Bild |
| Seitenverhältnisse | Alle Clips gleich hoch, echtes Format, kein Beschnitt |
| Instagram-Links | Korrekte URL ohne Tracking-Parameter, `noopener noreferrer`, Hinweis „öffnet in neuem Tab“ für Screenreader |
| Regression | Hero-Scrub + Übergangssatz, Datensparmodus, reduzierte Bewegung, Karussell, Menü, Formular/Chips/Spam-Schutz, `file://`, Ladefehler, ohne H.264: bestanden |
| Überlauf / Fehler | Kein Überlauf bei 390/768/1440; keine JavaScript- oder Ladefehler |

Nicht geprüft: Tonwiedergabe hörbar (nur Pegel gemessen: Clip 1 −20,8 dB, Clip 2 −11,7 dB Mittelwert), echte Geräte, Safari.

### Ergänzung – Gründerporträt

Geladen erst beim Heranscrollen; Auswahl 540 px (Desktop @1x) bzw. 1086 px (hochauflösend/mobil); Seitenverhältnis exakt 1086:1448, kein Beschnitt, keine Verzerrung (390/768/1440). Regression (Hero, Datensparmodus, reduzierte Bewegung, Karussell, Menü, Formular): bestanden, kein Überlauf, keine Fehler.

### Ergänzung – Version 0.4

Geprüft bei 390 und 1440 px: fünf Leistungen inkl. „Kunst & Gemälde“, Einleitungssatz, elf Formular-Chips, korrekte Überschriftenhierarchie (H1 → H2 → H3 → H4), kein Überlauf, keine Fehler. Der Bereich „Stationen & Projekte“ wurde mit zwei Probeeinträgen getestet (Jahr, Titel, Text, externer Link mit `noopener noreferrer`) und anschließend wieder geleert.

## Nachtest 20.09.2026 – Version 0.5 (Inhaltspflege)

| Prüfung | Ergebnis |
|---|---|
| Umstellung auf JSON | Seite lädt acht JSON-Dateien und rendert identisch (390/768/1440), keine Fehler |
| Simulierte Admin-Änderung | Neues Video, neues Karussellbild, neue Leistung und eine Station wurden direkt in den JSON-Dateien ergänzt: 4 Clips, 6 Leistungen, Stationen-Bereich erschien automatisch, kein Überlauf, keine Fehler. Danach zurückgesetzt und erneut geprüft |
| Direkt geöffnete Datei (`file://`) | Verständlicher Hinweis „Inhalte konnten nicht geladen werden“ mit Verweis auf `vorschau-starten.bat` statt kaputter Seite |
| Admin-Dateien | `/admin/index.html` und `/admin/config.yml` liefern HTTP 200; Platzhalter für den GitHub-Namen ist enthalten |
| Feldabgleich Admin ↔ Inhalte | Automatisch geprüft: Jedes Feld aller acht JSON-Dateien ist in `admin/config.yml` beschrieben, auch verschachtelte Listen. Beim Speichern im Admin geht damit kein Inhalt verloren |
| Regression | Hero-Scrub und Übergangssatz, Datensparmodus, reduzierte Bewegung, Karussell, Menü, Clips (kein Vorabladen, Tastatur, nur einer gleichzeitig), Porträt, Formular inkl. Chips und Spam-Schutz, Ladefehler, Browser ohne H.264: bestanden |

Nicht getestet: der Admin-Bereich selbst. Decap CMS lädt sein Programm aus dem Netz, und die Anmeldung setzt das fertig eingerichtete GitHub-Repository voraus. Das lässt sich erst nach den Schritten in `ANLEITUNG-GITHUB-NETLIFY.md` prüfen. Ebenfalls offen: echte Geräte, Safari, Screenreader.

## Version 1.0 (22.09.2026) – neuer Aufbau

Getestet mit Chrome 131 über einen lokalen Server, bei 390 und 1440 px.

| Prüfung | Ergebnis |
|---|---|
| Build | 19 Seiten, 3 Projekte, 2 Sprachen; Inhaltsprüfung bricht bei fehlenden Angaben mit verständlicher Meldung ab |
| Alle Seiten (22 Aufrufe) | Laden ohne JavaScript- oder Ladefehler, genau eine H1, kein horizontaler Überlauf |
| Interne Links & Dateien | 602 Ziele geprüft, keine toten Verweise, keine fehlenden Medien |
| Einstiegsfilm | Scrub vor- und rückwärts (2,45 → 6,57 → 6,99 → 1,66 s), Übergangssatz blendet ein |
| Abschlussfilm | Scrub vor- und rückwärts, lädt erst in der Nähe |
| Reduzierte Bewegung / Datensparmodus | Beide Filme als Standbild, **0** Videoanfragen |
| Leistungen | Aufklappen per Klick und Tastatur, `aria-expanded` korrekt |
| Arbeiten-Filter | Filtert korrekt, merkt sich die Auswahl in der Adresse, Ansage für Screenreader mit Ein-/Mehrzahl |
| Projektseite | Clips werden erst beim Klick geladen und starten mit Bedienelementen |
| Formular | Fehler mit Sprunglinks, Fokus auf der Zusammenfassung; im Vorschaumodus **0** POST-Anfragen; Spam-Prüfung „ok“ |
| Sprachumschalter | Führt auf die gleiche Seite in der anderen Sprache, `lang`-Attribut und Titel wechseln |
| Barrierefreiheit (automatisiert) | Alle Bilder mit Alt-Text, alle Felder beschriftet, keine Überschriftensprünge |

**Nicht geprüft:** echte Geräte, Safari und Firefox, Screenreader, Netlify Forms im Livebetrieb (erst nach Freischaltung möglich), Netlify Image CDN (greift nur für neue Uploads auf Netlify), Ladezeiten.

### Ergänzung – Besetzung (24.09.2026)

Getestet mit zwei Testpersonen (Model, DJ) und einer Person ohne Einwilligung, danach wieder entfernt.

| Prüfung | Ergebnis |
|---|---|
| Einwilligung fehlt | Person wird nicht gebaut: keine Seite, keine Kachel, kein Eintrag in Navigation oder Sitemap |
| Rollen-Filter | Entsteht automatisch aus den Rollen („Alle 2 · Model 1 · DJ 1“), filtert korrekt, Ansage in Ein-/Mehrzahl |
| Personenseite | Fotos, Rolle, Stadt, Kurztext, Weiter-Verweis auf die nächste Person |
| „Diese Person anfragen“ | Führt auf `/kontakt/?person=…`, der Name steht danach im Nachrichtenfeld |
| Zweisprachig | `/en/cast/` mit englischen Bezeichnungen, `lang`-Attribut korrekt |
| Navigation | „Besetzung“ erscheint nur, wenn mindestens eine Person freigegeben ist |
| Überlauf / Fehler | Kein Überlauf bei 390 und 1440 px, keine Fehler, keine fehlenden Dateien |
