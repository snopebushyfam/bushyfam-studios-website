# ASSETS – Medienzuordnung

Alle gelieferten Originale liegen **unverändert** in `originals/` (bzw. bei Logos direkt in `assets/`). Ausnahme: der ProRes-Master des Einstiegsvideos (112 MB) ist nicht im Projekt enthalten. Abgeleitete Dateien sind nur skaliert oder technisch neu kodiert – nicht beschnitten, nicht retuschiert, nicht generativ verändert.

## Gelieferte Dateien

| Upload-Dateiname | Inhalt | Verwendung | Datei im Projekt |
|---|---|---|---|
| `1.png` (500 × 500) | BushyFam-Studios-Logo, weiß auf Schwarz | Header, Footer (CSS-Ausschnitt, Datei unverändert) | `assets/brand/bushyfam-logo-original.png` |
| `AILEENUFO.mov` (ProRes 422 HQ, 1080 × 1920, 10 Bit, BT.709, 24 fps, 7,04 s, 112 MB) – **gegradete Fassung, ersetzt `hf_20260915_012005_….mp4`** | UFO-Kurzfilm, Kamerafahrt ins Auge | Einstieg | Master nicht im Projekt (Dateigröße; bitte beim Kunden archivieren) · Scrub: `assets/hero/hero-ufo-scrub-1080.mp4`, `…-720.mp4`, `…-540.mp4` · Standbild: `assets/hero/hero-ufo-poster.jpg` (erstes Bild, 1080 × 1920) |
| `1789436174791_image.png` (1018 × 1536) | Longdrink mit Orangenscheiben | MASON’S-Karussell, Position 1 | Original: `originals/masons-longdrink-orange.png` · Web: `assets/work/masons/photos/masons-longdrink-orange-400.webp`, `-800.webp` |
| `1789436192434_image.png` (1026 × 1536) | Eisbecher mit Keksen | MASON’S-Karussell, Position 2 | `originals/masons-eisbecher.png` · `…/masons-eisbecher-400/800.webp` |
| `1789436197204_image.png` (1018 × 1536) | Roter Cocktail mit Melone | MASON’S-Karussell, Position 3 | `originals/masons-cocktail-melone.png` · `…/masons-cocktail-melone-400/800.webp` |
| `1789436269326_image.png` (3264 × 4928) | Frozen-Drink mit Kiwi im Martiniglas | MASON’S-Karussell, Position 4 | `originals/masons-martini-kiwi.png` · `…/masons-martini-kiwi-400/800.webp` |
| `Bigmo.mp4` (H.264, 1080 × 1920, 60 fps, 29,4 s, mit Ton) | Lounge-Szene mit Gästen, Abschluss mit „M“-Signet | MASON’S-Video 1 „Lounge-Clip“ | `assets/work/masons/videos/masons-lounge.mp4` (720 × 1280, 60 fps, Ton, 5,9 MB) · Vorschaubild `masons-lounge.jpg` (Bild bei 2,0 s) |
| `copy_5948202C-….mov` (HEVC, 886 × 1920, 60 fps, 6,8 s, mit Ton) | Drink wird in hängendes Glas eingeschenkt, „M“-Signet | MASON’S-Video 2 „Drink-Clip „Einschenken““ | `assets/work/masons/videos/masons-drink-einschenken.mp4` (590 × 1280, 60 fps, Ton, 0,8 MB) · `masons-drink-einschenken.jpg` (5,2 s) |
| `copy_5773B5A4-….mov` (HEVC, 886 × 1920, 60 fps, 6,5 s, **stumme** Tonspur) | Drink an der Bar, „M“-Signet | MASON’S-Video 3 „Drink-Clip „Bar““ | `assets/work/masons/videos/masons-drink-bar.mp4` (590 × 1280, 60 fps, ohne Tonspur, 0,4 MB) · `masons-drink-bar.jpg` (0,6 s) |
| `41C5F299-….png` (1086 × 1448) | Porträt Taha Gürsoy im Sessel (bestätigt) | Gründerbereich | Original: `originals/taha-guersoy-portrait.png` · Web: `assets/studio/taha-guersoy-540.webp`, `taha-guersoy-1086.webp` (nur skaliert, nicht beschnitten) |
| `1789436179500_image.png` (1000 × 1000) | Logo N.E.V auf lila Verlauf | Nelvie Tiafack | `assets/work/nelvie-tiafack/nev-logo-lila.png` (unverändert) |
| `1789436184141_image.png` (1000 × 1000) | Logo NEV mit 3 und Pyramide, gelb | Nelvie Tiafack | `assets/work/nelvie-tiafack/nev3-logo-gelb.png` (unverändert) |

Die Zuordnung der drei Clips zu MASON’S beruht auf dem „M“-Signet in den Videos. Die Web-Fassungen sind nur skaliert und nach H.264 umgewandelt (Bildrate, Schnitt und Ton unverändert); die stumme Tonspur von Clip 3 wurde entfernt. HEVC-Originale spielen in Chrome unter Windows nicht zuverlässig. Master-Dateien liegen beim Kunden.

Die Zuordnung der Produktfotos zu MASON’S und die Motivbezeichnungen (z. B. „Eisbecher“) beruhen auf dem Bildinhalt. Namen der Drinks sind nicht bekannt und wurden nicht erfunden. Bitte bestätigen, dass alle vier Fotos zu MASON’S gehören.

Reihenfolge und Alt-Texte des Karussells: Admin-Bereich → „Arbeiten – MASON’S“ → Produktkarussell (Datei: `content/work-masons.json`).

## Fehlende Originaldateien

| Benötigt | Status | Platzhalter |
|---|---|---|
| Bestätigter dunkler Website-Entwurf | nicht im Chat vorhanden | – |
| BushyFam-Logo als SVG | fehlt (transparentes PNG liegt seit 25.09.2026 vor, siehe unten) | – |
| Favicon / App-Icon in finaler Qualität (aus SVG) | fehlt | provisorisch: `assets/brand/icons/favicon.ico` (16/32/48), `icon-32.png`, `icon-180.png`, `icon-192.png` – Symbol aus dem Original-Logo ausgeschnitten, mittig auf Schwarz gesetzt, nur skaliert |
| Kamera-Originale bzw. finale Exporte der MASON’S-Fotos | teilweise unklar | Uploads verwendet |
| Social-Sharing-Bild (Open Graph) | fehlt | keins eingebunden |

## Neue MASON’S-Clips einbinden

1. Datei nach `assets/work/masons/videos/` kopieren (MP4/H.264, am besten mit Faststart; optional Vorschaubild als JPG).
2. Im Admin-Bereich unter „Arbeiten – MASON’S“ → Videos eintragen (Datei: `content/work-masons.json`):
   `{ title: "Clip 1", src: "assets/work/masons/videos/clip-1.mp4", poster: "assets/work/masons/videos/clip-1.jpg", width: 1080, height: 1920 }`
3. Der Videobereich erscheint automatisch. Clips werden erst beim Klick geladen.

## Schrift

Poppins (Regular, Medium, Bold) von Indian Type Foundry, Lizenz **SIL Open Font License 1.1**. Selbst gehostet als WOFF-Teilmenge (Latein + deutsche Sonderzeichen) in `assets/fonts/`. Keine Anfrage an Google-Server. Lizenztext: https://openfontlicense.org – vor Livegang als `assets/fonts/OFL.txt` beilegen.

## Nachtrag 21.09.2026 – Videos

| Upload | Inhalt | Verwendung | Web-Dateien |
|---|---|---|---|
| `hf_20260921_151844_….mp4` (HEVC 10 Bit, 1440 × 1440, 7,05 s, 169 Bilder) | Frau im UFO-Cockpit, Zoom bis in die Pupille, endet schwarz | Einstieg (ersetzt AILEENUFO) | `assets/hero/hero-cockpit-sq-540/720/1080.mp4`, Standbild `hero-cockpit-sq-poster.jpg` (erstes Bild) |
| `copy_624AF360-….mov` (HEVC, 1080 × 1080, 7,08 s, 170 Bilder) | Zoom aus der Pupille bis zum UFO-Bullauge | Abschlussfilm vor dem Footer | `assets/ending/ending-ufo-sq-540/720/1080.mp4` (ab Bild 18, vorher reines Schwarz), Standbild `ending-ufo-sq-poster.jpg` (letztes Bild) |
| `hf_20260921_151631_….mp4` | UFO-Bullauge, Zoom ins Auge | nur Vorschau, nicht verwendet | – |

Hinweis: Im quadratischen Einstiegsvideo ist der Schriftzug „BUSHYFAM STUDIOS“ auf dem UFO-Rumpf am unteren Bildrand angeschnitten („STUDIOS“ fehlt). Liegt am Bildausschnitt der Datei.
Nicht mehr verwendet und im Repository löschbar: `assets/hero/hero-ufo-scrub-540/720/1080.mp4`, `assets/hero/hero-ufo-poster.jpg`.

## Nachtrag 25.09.2026 – Einstiegsvideo

| Upload | Inhalt | Verwendung | Web-Dateien |
|---|---|---|---|
| `hf_20260925_143923_….mp4` (HEVC 10 Bit, 1080 × 1920, 24 fps, 7,05 s, mit Ton) | Frau im UFO-Cockpit, Schriftzug „BUSHYFAM STUDIOS“ vollständig sichtbar, Zoom bis in die Pupille, endet schwarz (ab ≈ 6,7 s) | Einstieg (ersetzt `hero-cockpit-sq`) | `assets/hero/hero-cockpit-hoch-540/720/1080.mp4` (540 × 960, 720 × 1280, 1080 × 1920; H.264, nur Keyframes, ohne Ton), Standbild `hero-cockpit-hoch-poster.jpg` (erstes Bild) |

Die quadratischen Dateien `assets/hero/hero-cockpit-sq-*` wurden entfernt. Der Hinweis zum angeschnittenen Schriftzug oben gilt damit nicht mehr.

## Nachtrag 25.09.2026 – Logo

| Upload | Inhalt | Verwendung | Datei im Projekt |
|---|---|---|---|
| `image.png` (PNG, 813 × 813, weiß auf transparent) | BushyFam-Studios-Logo | Header und Footer (ersetzt den CSS-Ausschnitt aus `bushyfam-logo-original.png`) | `assets/brand/bushyfam-logo-weiss.png` (664 × 362, nur leerer Rand abgeschnitten, sonst unverändert) |

Die Favicons stammen weiterhin aus dem alten Ausschnitt.
