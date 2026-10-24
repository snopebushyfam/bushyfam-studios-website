/*
 * BushyFam Studios – Build ohne externe Abhängigkeiten.
 *
 * Liest content/*.json (vom Admin bearbeitet), prüft die Inhalte und erzeugt
 * fertige HTML-Seiten in beiden Sprachen nach dist/. Netlify führt das bei
 * jedem Commit aus (siehe netlify.toml). Lokal: `node build/build.mjs`.
 *
 * Schlägt die Prüfung fehl, bricht der Build mit verständlicher Meldung ab –
 * die zuletzt veröffentlichte Version bleibt dann online.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { T, ROUTES, CATEGORIES, LANG_NAMES, PUBLIC_LANGS, DEFAULT_LANG, LEGACY_ROUTES } from "./i18n.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist");
const LANGS = ["de", "en", "tr"];
const ON_NETLIFY = process.env.NETLIFY === "true";
const errors = [];

/* ---------- Hilfen ---------- */
const readJson = (rel) => {
  const p = path.join(ROOT, rel);
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch (e) { errors.push(`${rel}: Datei fehlt oder ist kein gültiges JSON (${e.message})`); return {}; }
};
const readDir = (rel) => {
  const dir = path.join(ROOT, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => ({ __file: `${rel}/${f}`, ...readJson(`${rel}/${f}`) }));
};
export const esc = (v) => String(v ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
/** Feld in der gewünschten Sprache, sonst Deutsch als Rückfall */
/* Fehlt ein Text in der gewählten Sprache: Türkisch fällt auf Englisch zurück, sonst auf Deutsch */
/* Platzhalter „[TODO: …]“ gelten als leer: Sie erscheinen nie auf der Website, der Abschnitt wird ausgeblendet */
const isTodo = (v) => typeof v === "string" && /\[\s*TODO\b/i.test(v);
const filled = (v) => (v && !isTodo(v) ? v : "");
const tr = (obj, key, lang) => (obj && (filled(obj[`${key}_${lang}`]) || (lang === "tr" && filled(obj[`${key}_en`])) || filled(obj[`${key}_de`]))) || "";
const pick = (obj, lang) => (obj && (filled(obj[lang]) || (lang === "tr" && filled(obj.en)) || filled(obj.de))) || "";
const url = (p) => (!p ? "" : /^https?:\/\//.test(p) ? p : "/" + String(p).replace(/^\/+/, ""));
const assetExists = (p) => !p || /^https?:\/\//.test(p) || fs.existsSync(path.join(ROOT, url(p)));
const paras = (text) => String(text || "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
const need = (cond, msg) => { if (!cond) errors.push(msg); };

/* Bildgrößen aus der Datei lesen (PNG, JPEG, WebP) – für width/height ohne Layout-Sprung */
function imageSize(p) {
  const f = path.join(ROOT, url(p));
  let b; try { b = fs.readFileSync(f); } catch { return null; }
  if (b.toString("ascii", 1, 4) === "PNG") return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const t = b.toString("ascii", 12, 16);
    if (t === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (t === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (t === "VP8L") { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
  }
  return null;
}

/* Bild-Tag. Uploads aus dem Admin laufen auf Netlify über das Image CDN in passender Größe. */
function img(src, alt, { sizes = "100vw", cls = "", lazy = true, widths = [480, 960, 1600] } = {}) {
  const s = url(src), dim = imageSize(src) || {};
  let srcset = "";
  /* Auf Netlify: JPG/PNG (und hochgeladene WebP) laufen über das Image CDN – passende Breite, als WebP.
     Die Originaldateien bleiben unverändert im Repository; künftige Uploads werden automatisch genauso ausgeliefert. */
  let out = s;
  if (ON_NETLIFY && s.startsWith("/assets/") && (/\.(jpe?g|png)$/i.test(s) || (s.startsWith("/assets/uploads/") && /\.webp$/i.test(s)))) {
    const cdn = (w) => `/.netlify/images?url=${encodeURIComponent(s)}&amp;w=${w}&amp;fm=webp`;
    srcset = ` srcset="${widths.map((w) => `${cdn(w)} ${w}w`).join(", ")}" sizes="${sizes}"`;
    out = cdn(960);
  }
  return `<img${cls ? ` class="${cls}"` : ""} src="${out.startsWith("/.netlify/") ? out : esc(out)}"${srcset}${dim.w ? ` width="${dim.w}" height="${dim.h}"` : ""} alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
}
/* Pakete: nur mit Namen UND Preis sichtbar; Leistungspunkte mit [TODO] fallen weg */
const trList = (obj, key, lang) => {
  const pickList = (k) => (Array.isArray(obj[k]) ? obj[k].map(filled).filter(Boolean) : []);
  const own = pickList(`${key}_${lang}`);
  return own.length ? own : (lang === "tr" && pickList(`${key}_en`).length ? pickList(`${key}_en`) : pickList(`${key}_de`));
};
/* Preis: ausgeschriebener Preis je Sprache (z. B. „ab 1.190 € / Monat“); sonst nur die Zahl im Feld „price“ */
const pkgPrice = (k, lang) => tr(k, "price", lang) ? esc(tr(k, "price", lang)) : filled(String(k.price ?? "").trim()) ? T[lang].priceFrom.replace("{p}", esc(String(k.price).replace(/€/g, "").trim())) : "";
/* Preis in Teile zerlegen: kleines „ab/from“, große Summe, leises „/ Monat“ – wie im Kartenstil der Pakete */
const pkgPriceParts = (k, lang) => {
  const raw = tr(k, "price", lang) || (filled(String(k.price ?? "").trim()) ? T[lang].priceFrom.replace("{p}", String(k.price).replace(/€/g, "").trim()) : "");
  const m = raw.match(/^\s*(ab|from|itibaren)?\s*(.+?)\s*(\/\s*.+)?$/i);
  if (!m) return esc(raw);
  return `${m[1] ? `<span class="pkg-price-pre">${esc(m[1])}</span> ` : ""}<span class="pkg-price-amount">${esc(m[2])}</span>${m[3] ? ` <span class="pkg-price-per">${esc(m[3])}</span>` : ""}`;
};
const CHECK_ICON = `<svg class="pkg-check" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="10" fill="currentColor"/><path d="M6 10.3l2.6 2.5L14 7.4" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// „Pakete auf der Website zeigen“ aus = kein Paket-Bereich auf der Startseite und keine Paketauswahl im Formular
const visiblePackages = (lang) => PKG.enabled === false ? [] : (PKG.items || []).filter((k) => tr(k, "name", lang) && pkgPrice(k, lang));

/* Leistungs-Kachel: Bild oder stummes Loop-Video, unten der Titel; Antippen/Draufhalten klappt Text und Stichworte auf */
function svcCard(s, i, lang) {
  const id = `svc-more-${i + 1}`, alt = tr(s, "imageAlt", lang);
  const media = s.video
    ? `<video class="svc-card-img" muted loop playsinline preload="none"${s.image ? ` poster="${esc(url(s.image))}"` : ""} data-svc-video aria-hidden="true"><source src="${esc(url(s.video))}" type="video/mp4"></video>`
    : s.image ? img(s.image, alt, { sizes: "(min-width: 900px) 25vw, 78vw", cls: "svc-card-img" }) : "";
  return `<li class="svc-card" data-svc-card>
      <div class="svc-card-media">${media}${s.video && alt ? `<span class="vh">${esc(alt)}</span>` : ""}</div>
      <div class="svc-card-body">
        <span class="svc-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <h3><button class="svc-card-toggle" type="button" aria-expanded="false" aria-controls="${id}">${esc(tr(s, "title", lang))}<span class="svc-card-plus" aria-hidden="true"></span></button></h3>
        <div class="svc-card-more" id="${id}"><div><p>${esc(tr(s, "text", lang))}</p>${tr(s, "tags", lang) ? `<p class="svc-tags">${esc(tr(s, "tags", lang))}</p>` : ""}</div></div>
      </div>
    </li>`;
}
/* Satz unter den Leistungen als große Zeile zum Kontakt: Frage leise, Antwort groß */
function svcNote(note, href, t) {
  const m = note.match(/^(.*?\?)\s+(.+)$/s);
  const text = m ? `<span class="svc-note-q">${esc(m[1])}</span> <span class="svc-note-a">${esc(m[2])}</span>` : `<span class="svc-note-a">${esc(note)}</span>`;
  return `<a class="svc-note" href="${href}"><span class="svc-note-text">${text}</span><span class="svc-note-go"><span class="svc-note-label">${esc(t.cta)}</span><span class="svc-note-arrow" aria-hidden="true">→</span></span></a>`;
}
/* Besetzung als Casting-Buch (Startseite und Übersicht): Formate und Höhen wechseln im Dreierrhythmus */
function castRow(lang, { page = false } = {}) {
  const t = T[lang];
  return `<ul class="cast-row${page ? " cast-row--page" : ""}" aria-label="${esc(t.nav.cast)}"${page ? " data-grid" : ""}>
    ${CAST.map((p, i) => { const ph = p.photos[0]; return `<li class="cast-card"${page ? ` data-cat="${esc(roleKey(p))}"` : ""}><a href="${hrefFor(lang, "person", p.slug)}">
      <span class="cast-card-media">${img(ph.src, tr(ph, "alt", lang) || p.name, { sizes: i % 3 === 0 ? "(min-width: 900px) 42vw, 80vw" : "(min-width: 900px) 25vw, 66vw", lazy: i > 1 })}</span>
      <span class="cast-card-cap"><span class="cast-card-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>${page ? `<h2 class="cast-card-name">${esc(p.name)}</h2>` : `<span class="cast-card-name">${esc(p.name)}</span>`}<span class="cast-card-role">${esc(tr(p, "role", lang))}</span></span>
    </a></li>`; }).join("\n    ")}
  </ul>`;
}
const ext = (href, label, lang, cls = "link-arrow") =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span><span class="vh"> ${esc(T[lang].newTab)}</span></a>`;

/* ---------- Inhalte laden und prüfen ---------- */
const S = readJson("content/settings.json");
/* WhatsApp: angezeigte Nummer aus den Einstellungen, Link nur mit Ziffern (wa.me/491234…) */
const WA_DIGITS = String(S.whatsapp || "").replace(/\D/g, "").replace(/^00/, "");
const WA_URL = WA_DIGITS ? `https://wa.me/${WA_DIGITS}` : "";
const HOME = readJson("content/home.json");
const SERV = readJson("content/services.json");
const PKG = fs.existsSync(path.join(ROOT, "content/packages.json")) ? readJson("content/packages.json") : { items: [] };
const STU = readJson("content/studio.json");
const CON = readJson("content/contact.json");
const LEGAL = readJson("content/legal.json");
/* Projekte: „Veröffentlicht“ aus = nirgends auf der Website (Entwürfe bleiben im Admin) */
const PROJECTS = readDir("content/projects").filter((p) => p.published !== false).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
const CLIENTS = readDir("content/clients").sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
/* Besetzung: nur Personen mit vorliegender Einwilligung und Häkchen „sichtbar“ */
const OBJECTS = readDir("content/objects").filter((o) => o.enabled !== false).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
const CAST = readDir("content/cast")
  .filter((p) => p.visible !== false && p.consent === true)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

need(!S.whatsapp || (/^\+|^00/.test(String(S.whatsapp).trim()) && /^[1-9]\d{7,14}$/.test(WA_DIGITS)), `Einstellungen → WhatsApp-Nummer „${S.whatsapp}“: Bitte mit Ländervorwahl eintragen, z. B. +49 1514 4930658.`);
need(assetExists(S.seo?.image), `Einstellungen → Vorschaubild zum Teilen nicht gefunden: ${S.seo?.image}`);
/* Vor der Freigabe für Suchmaschinen dürfen Impressum und Datenschutz keine Platzhalter [ … ] mehr enthalten */
if (S.launch) for (const k of ["imprint_de", "imprint_en", "privacy_de", "privacy_en"]) need(!/\[[^\]]*(ERGÄNZEN|ADD|BITTE|PLEASE)[^\]]*\]/i.test(LEGAL[k] || "") && (LEGAL[k] || "").trim(), `Impressum & Datenschutz: „${k}“ ist leer oder enthält noch Platzhalter – erst ausfüllen, dann für Suchmaschinen freigeben.`);
need(S.hero && S.hero.video && Array.isArray(S.hero.video.sources) && S.hero.video.sources.length, "Einstellungen → Einstieg: Es ist kein Einstiegsfilm eingetragen.");
const slugs = new Set();
for (const p of PROJECTS) {
  const where = `Projekt „${p.title_de || p.__file}“`;
  need(/^[a-z0-9-]+$/.test(p.slug || ""), `${where}: Die Adresse (Slug) darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.`);
  need(!slugs.has(p.slug), `${where}: Die Adresse „${p.slug}“ ist doppelt vergeben.`); slugs.add(p.slug);
  need(p.title_de, `${where}: Titel (DE) fehlt.`);
  need(CATEGORIES.some((c) => c.id === p.category), `${where}: Unbekannte Kategorie „${p.category}“.`);
  need(p.cover && p.cover.src, `${where}: Titelbild fehlt.`);
  for (const m of [p.cover, ...(p.media || [])]) {
    if (!m) continue;
    need(assetExists(m.src), `${where}: Datei nicht gefunden: ${m.src}`);
    if (m.poster) need(assetExists(m.poster), `${where}: Vorschaubild nicht gefunden: ${m.poster}`);
  }
}
// Bekannte Altlasten aus der MASON'S-Zusammenführung: falls diese Dateien noch
// zusätzlich zu "masons.json" im Repository liegen, würde MASON'S mehrfach erscheinen.
// Lieber der Build bricht sichtbar ab, als dass die Seite live dupliziert wird.
var legacyMasonsFiles = ["content/projects/masons-clips.json", "content/projects/masons-produktfotografie.json"];
for (var lf of legacyMasonsFiles) {
  if (fs.existsSync(path.join(ROOT, lf))) errors.push(`Altlast gefunden: ${lf} liegt noch neben content/projects/masons.json. Bitte diese Datei in GitHub löschen (siehe ANLEITUNG-GITHUB-NETLIFY.md) – sonst erscheint MASON'S mehrfach.`);
}

const castSlugs = new Set();
for (const p of CAST) {
  const where = `Besetzung „${p.name || p.__file}“`;
  need(/^[a-z0-9-]+$/.test(p.slug || ""), `${where}: Die Adresse (Slug) darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.`);
  need(!castSlugs.has(p.slug), `${where}: Die Adresse „${p.slug}“ ist doppelt vergeben.`); castSlugs.add(p.slug);
  need(p.name, `${where}: Name fehlt.`);
  need(tr(p, "role", "de"), `${where}: Rolle (DE) fehlt.`);
  need(p.photos && p.photos.length && p.photos[0].src, `${where}: Mindestens ein Foto wird gebraucht.`);
  for (const ph of (p.photos || [])) need(assetExists(ph.src), `${where}: Foto nicht gefunden: ${ph.src}`);
  if (p.video && p.video.src) need(assetExists(p.video.src), `${where}: Video nicht gefunden: ${p.video.src}`);
  if (p.video && p.video.poster) need(assetExists(p.video.poster), `${where}: Vorschaubild zum Video nicht gefunden: ${p.video.poster}`);
}
for (const o of OBJECTS) need(assetExists(o.image), `Objekt „${o.title_de || o.__file}“: Bild nicht gefunden: ${o.image}`);
for (const v of [S.hero?.video, S.ending?.video]) for (const s of (v?.sources || [])) need(assetExists(s.src), `Film-Datei nicht gefunden: ${s.src}`);
/* Einzelbilder fürs Handy (f-001.webp …): nur verwenden, wenn sie zum eingetragenen Film gehören –
   nach einem Filmtausch im Admin läuft sonst wieder das Video statt veralteter Bilder. */
const frameName = (i) => `f-${String(i).padStart(3, "0")}.webp`;
const HERO_FRAMES = (() => {
  const F = S.hero?.video?.frames;
  if (!F || !F.folder || !F.count) return null;
  if (!(S.hero.video.sources || []).some((s) => s.src === F.forVideo)) {
    console.warn(`Hinweis: Einzelbilder (${F.folder}) gehören nicht zum eingetragenen Einstiegsfilm – Handys bekommen das Video.`);
    return null;
  }
  const base = F.folder.replace(/\/+$/, "");
  for (let i = 1; i <= F.count; i++) need(assetExists(`${base}/${frameName(i)}`), `Einstiegsfilm: Einzelbild fehlt: ${base}/${frameName(i)}`);
  return { base: url(base) + "/", count: F.count };
})();
if (errors.length) {
  console.error("\n✖ Build abgebrochen – bitte im Admin korrigieren:\n" + errors.map((e) => "  • " + e).join("\n") + "\n");
  process.exit(1);
}

/* ---------- Layout ---------- */
/* Seiten ohne Gegenstück/Indexierung: kein canonical, hreflang, og:url; nicht in der Sitemap */
const NO_ALT = new Set(["home404", "thanks"]);
const hrefFor = (lang, key, slug) => {
  const r = ROUTES[lang][key];
  return slug ? `${r}${slug}/` : r;
};
/* Instagram-Symbol (Umriss, weiß über currentColor) für den Header */
const IG_ICON = `<svg class="ig-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.15" fill="currentColor"/></svg>`;
const igLink = (lang, cls) => S.instagramUrl ? `<a class="${cls}" href="${esc(S.instagramUrl)}" target="_blank" rel="noopener noreferrer">${IG_ICON}<span class="vh">Instagram ${esc(S.instagramHandle || "")} ${esc(T[lang].newTab)}</span></a>` : "";
function layout({ lang, key, slug, title, description, body, scripts = [], styles = [], headerExtra = "", ogImage = S.seo?.image }) {
  const t = T[lang], others = PUBLIC_LANGS.filter((l) => l !== lang);
  /* Eingefrorene Sprache (Türkisch): erreichbar, aber noindex, ohne canonical/hreflang */
  const indexable = PUBLIC_LANGS.includes(lang);
  const site = (S.siteUrl || "").replace(/\/+$/, "");
  const here = hrefFor(lang, key, slug), hrefIn = (l) => (key === "home404" ? ROUTES[l].home : hrefFor(l, key, slug));
  const abs = (p) => site + p;
  /* Sprachauswahl: kleiner Knopf mit dem aktuellen Kürzel, darunter die Sprachen (funktioniert auch ohne JavaScript) */
  const langSwitch = (where) => `<details class="lang-switch lang-switch--${where}" data-lang-switch>
      <summary class="lang"><span aria-hidden="true">${lang.toUpperCase()}</span><span class="vh">${esc(t.switchTo)} – ${LANG_NAMES[lang]}</span></summary>
      <ul class="lang-menu">${PUBLIC_LANGS.map((l) => `<li><a href="${hrefIn(l)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ""}><span class="lang-code" aria-hidden="true">${l.toUpperCase()}</span>${LANG_NAMES[l]}</a></li>`).join("")}</ul>
    </details>`;
  const nav = [["work", t.nav.work], ...(CAST.length ? [["cast", t.nav.cast]] : []), ["services", t.nav.services], ["studio", t.nav.studio]];
  const navHref = (k) => (k === "services" ? ROUTES[lang].home + "#" + t.servicesId : ROUTES[lang][k]);
  const cur = (k) => (k === key || (k === "work" && key === "project") || (k === "cast" && key === "person") ? ' aria-current="page"' : "");
  /* Strukturierte Daten: LocalBusiness nur auf der Startseite (Adresse wie im Impressum) */
  const A = S.address || {};
  const ld = key === "home" ? {
    "@context": "https://schema.org", "@type": "LocalBusiness", name: S.brandName,
    ...(site ? { url: abs(ROUTES[lang].home), "@id": site + "/#business" } : {}),
    ...(A.street ? { address: { "@type": "PostalAddress", streetAddress: A.street, postalCode: A.postalCode, addressLocality: A.city, addressCountry: A.country || "DE" } } : {}),
    ...(S.email ? { email: S.email } : {}), ...(WA_DIGITS ? { telephone: "+" + WA_DIGITS } : {}),
    ...(site && S.seo?.image ? { image: abs(url(S.seo.image)) } : {}),
    sameAs: [S.instagramUrl].filter(Boolean), areaServed: { "@type": "Country", name: "Deutschland" },
    hasOfferCatalog: { "@type": "OfferCatalog", name: tr(SERV, "title", lang) || t.nav.services,
      itemListElement: (SERV.items || []).map((it) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: tr(it, "title", lang), description: tr(it, "text", lang) } })) }
  } : null;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${!S.launch ? '<meta name="robots" content="noindex, nofollow">\n' : !indexable ? '<meta name="robots" content="noindex">\n' : ""}<meta name="theme-color" content="#000000">
${site && indexable && !NO_ALT.has(key) ? `<link rel="canonical" href="${abs(here)}">
${PUBLIC_LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(hrefIn(l))}">`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${abs(hrefIn(DEFAULT_LANG))}">
` : ""}<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.brandName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:locale" content="${{ de: "de_DE", en: "en_GB", tr: "tr_TR" }[lang]}">
${site && indexable && !NO_ALT.has(key) ? `<meta property="og:url" content="${abs(here)}">\n` : ""}<meta name="twitter:card" content="summary_large_image">
${site && ogImage ? `<meta property="og:image" content="${abs(url(ogImage))}">\n${imageSize(ogImage) ? `<meta property="og:image:width" content="${imageSize(ogImage).w}">\n<meta property="og:image:height" content="${imageSize(ogImage).h}">\n` : ""}` : ""}<link rel="icon" href="/assets/brand/icons/favicon.ico?v=2" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/icons/icon-32.png?v=2">
<link rel="apple-touch-icon" href="/assets/brand/icons/icon-180.png?v=2">
<link rel="preload" href="/assets/fonts/poppins-bold.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/css/site.css">
${styles.map((f) => `<link rel="stylesheet" href="/css/${f}">\n`).join("")}${styles.length ? `<link rel="preload" href="/assets/fonts/unbounded-latin.woff2" as="font" type="font/woff2" crossorigin>\n` : ""}${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body class="page-${key}">
<a class="skip" href="#main">${esc(t.skip)}</a>
<header class="site-header${key === "home" ? "" : " solid"}" data-header>
  <div class="header-inner">
    <a class="brand" href="${ROUTES[lang].home}" aria-label="${esc(S.brandName)} – ${esc(t.homeLabel)}"><img class="brand-logo" src="/assets/brand/bushyfam-logo-weiss.png" width="664" height="362" alt=""></a>
    <nav class="nav" aria-label="${esc(t.mainNav)}">
      <ul>
        ${nav.map(([k, l]) => `<li><a href="${navHref(k)}"${cur(k)}>${esc(l)}</a></li>`).join("\n        ")}
        <li><a class="btn btn--primary btn--nav" href="${ROUTES[lang].contact}"${cur("contact")}>${esc(t.cta)}</a></li>
        ${S.instagramUrl ? `<li>${igLink(lang, "ig-link")}</li>` : ""}
        <li>${langSwitch("nav")}</li>
      </ul>
    </nav>
    ${headerExtra}
    <a class="btn btn--primary header-cta" href="${ROUTES[lang].contact}">${esc(t.cta)}</a>
    ${igLink(lang, "ig-link header-ig")}
    ${langSwitch("header")}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mmenu" data-menu-btn><span class="menu-label">${esc(t.menu)}</span><span class="menu-lines" aria-hidden="true"></span></button>
  </div>
</header>
<div class="mobile-menu" id="mmenu" hidden data-menu>
  <nav aria-label="${esc(t.mobileNav)}"><ul>
    <li><a href="${ROUTES[lang].home}">${esc(t.nav.home)}</a></li>
    ${nav.map(([k, l]) => `<li><a href="${navHref(k)}">${esc(l)}</a></li>`).join("\n    ")}
    <li><a href="${ROUTES[lang].contact}">${esc(t.cta)}</a></li>
    ${others.map((l) => `<li class="mm-lang"><a href="${hrefIn(l)}" hreflang="${l}" lang="${l}">${LANG_NAMES[l]}</a></li>`).join("\n    ")}
  </ul></nav>
</div>
<main id="main" tabindex="-1">
${body}
</main>
${footer(lang)}
<script src="/js/site.js" defer></script>
${scripts.map((s) => `<script src="/js/${s}" defer></script>`).join("\n")}
</body>
</html>
`;
}

function footer(lang) {
  const t = T[lang], R = ROUTES[lang];
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <img class="brand-logo brand-logo--footer" src="/assets/brand/bushyfam-logo-weiss.png" width="664" height="362" alt="${esc(S.brandName)}" loading="lazy">
      <p class="muted footer-line">${esc(S.brandName)} · ${esc(tr(S, "location", lang))} · ${esc(tr(S, "reach", lang))}</p>
    </div>
    <nav aria-label="${esc(t.footerNav)}">
      <ul class="footer-links">
        <li><a href="${R.work}">${esc(t.nav.work)}</a></li>
        ${CAST.length ? `<li><a href="${R.cast}">${esc(t.nav.cast)}</a></li>` : ""}
        <li><a href="${R.studio}">${esc(t.nav.studio)}</a></li>
        <li><a href="${R.contact}">${esc(t.nav.contact)}</a></li>
        ${WA_URL ? `<li><a href="${WA_URL}" target="_blank" rel="noopener noreferrer">WhatsApp<span class="vh"> ${esc(t.newTab)}</span></a></li>` : ""}
        ${S.instagramUrl ? `<li><a href="${esc(S.instagramUrl)}" target="_blank" rel="noopener noreferrer">Instagram<span class="vh"> ${esc(t.newTab)}</span></a></li>` : ""}
        ${S.email ? `<li><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>` : ""}
      </ul>
      <ul class="footer-links footer-legal">
        <li><a href="${R.imprint}">${esc(t.imprint)}</a></li>
        <li><a href="${R.privacy}">${esc(t.privacy)}</a></li>
      </ul>
    </nav>
  </div>
</footer>`;
}

/* ---------- Bausteine ---------- */
const catLabel = (id, lang) => (CATEGORIES.find((c) => c.id === id) || {})[lang] || id;
const metaLine = (p, lang) => [catLabel(p.category, lang), p.client, p.year].filter(Boolean).map(esc).join(" · ");

/* Ausgewählte Arbeiten: abwechselnd randloses Kinobild und geteiltes Layout (Bild | Text),
   damit nicht jede Arbeit gleich aussieht. „Bild ganz zeigen“ (cover.fit) für Logos & Grafiken. */
function featureBlock(p, lang, i, { h = 3, eager = false } = {}) {
  const hasVideo = (p.media || []).some((m) => m.type === "video");
  const disciplines = tr(p, "disciplines", lang);
  const meta = [p.client, disciplines, p.year].filter(Boolean).map(esc).join(" · ");
  const fit = p.cover.fit === "contain" ? " feature-media--contain" : "";
  return `<li class="feature feature--${i % 2 ? "split" : "wide"}">
    <a class="feature-link" href="${hrefFor(lang, "project", p.slug)}">
      <div class="feature-media${fit}">${img(p.cover.src, tr(p.cover, "alt", lang), { sizes: i % 2 ? "(min-width: 900px) 58vw, 100vw" : "100vw", lazy: !eager })}${hasVideo ? `<span class="play">${esc(T[lang].film)}</span>` : ""}</div>
      <div class="feature-cap">
        <span class="feature-no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <div class="feature-cap-text">
          <span class="cat">${meta}</span>
          <h${h} class="feature-title">${esc(tr(p, "title", lang))}</h${h}>
          ${tr(p, "summary", lang) ? `<p class="feature-summary">${esc(tr(p, "summary", lang))}</p>` : ""}
          <span class="feature-view">${esc(T[lang].viewCase)} <span aria-hidden="true">↗</span></span>
        </div>
      </div>
    </a>
  </li>`;
}

function projectCard(p, lang, { headingLevel = 3 } = {}) {
  const hasVideo = (p.media || []).some((m) => m.type === "video");
  return `<a class="card" href="${hrefFor(lang, "project", p.slug)}" data-cat="${esc(p.category)}">
      <div class="tile${p.category === "video" ? " cover" : ""}">${img(p.cover.src, tr(p.cover, "alt", lang), { sizes: "(min-width: 900px) 30vw, 76vw" })}${hasVideo ? `<span class="play">${esc(T[lang].film)}</span>` : ""}</div>
      <div class="cap"><span class="cat">${esc(catLabel(p.category, lang))}</span><h${headingLevel} class="ttl">${esc(tr(p, "title", lang))}</h${headingLevel}><span class="client">${esc([p.client, p.year].filter(Boolean).join(" · "))}</span></div>
    </a>`;
}
const sourcesAttr = (v) => esc(JSON.stringify((v.sources || []).map((s) => ({ ...s, src: url(s.src) }))));

/* ---------- Seiten ---------- */
/* „So läuft’s“ als Szene: Beim Scrollen bleibt die Bühne stehen und die Schritte laufen nacheinander durch,
   jeweils mit einer großen Zeitmarke (Jetzt → 20 Min. → 48 h). Ohne JavaScript oder mit reduzierter
   Bewegung stehen die Schritte einfach untereinander. */
function processSection(lang, t, R) {
  const steps = (HOME.processSteps || []).filter((s) => tr(s, "title", lang));
  if (!tr(HOME, "processTitle", lang) || !steps.length) return "";
  const lead = tr(HOME, "processLead", lang);
  return `<section class="section process" data-process aria-labelledby="h-process" style="--steps:${steps.length}">
  <div class="process-track">
    <div class="process-stage">
      <div class="wrap process-head">
        <h2 class="h2 process-h" id="h-process">${esc(tr(HOME, "processTitle", lang))}</h2>
        ${lead ? `<p class="process-lead">${esc(lead)}</p>` : ""}
      </div>
      <ol class="wrap process-steps">
        ${steps.map((s, i) => { const fig = tr(s, "figure", lang) || tr(s, "title", lang); return `<li class="process-step" data-step${i ? "" : " data-active"}>
          <p class="process-figure" aria-hidden="true" style="--len:${Math.max([...fig].length, 3)}">${[...fig].map((c, j) => `<span style="--i:${j}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("")}</p>
          <div class="process-copy"><h3 class="process-title">${esc(tr(s, "title", lang))}</h3><p class="process-text">${esc(tr(s, "text", lang))}</p></div>
        </li>`; }).join("\n        ")}
      </ol>
      <div class="wrap process-foot">
        <div class="process-nav" data-process-nav hidden>
          ${steps.map((s, i) => `<button type="button" class="process-dot" data-goto="${i}"${i ? "" : ' aria-current="step"'}><span class="process-dot-label">${esc(tr(s, "title", lang))}</span><span class="process-bar" aria-hidden="true"><span class="process-fill"></span></span></button>`).join("")}
        </div>
        <a class="hiw-btn process-cta" href="${R.contact}">${esc(t.cta)} <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- Startseite „One Take“ ----------
   Die ganze Startseite ist eine Kamerafahrt: durch das Bullauge in die Pupille (Einstiegsfilm),
   durch die Arbeiten im All, vorbei an Monitor, Besetzungs-Ring und Startkonsole, und am Ende
   aus einer Pupille hinaus zum UFO (Schlussfilm). Alle Inhalte kommen aus dem Admin.
   Ohne JavaScript oder mit reduzierter Bewegung stehen alle Abschnitte ruhig untereinander. */
const frameSet = (folder, count) => {
  if (!fs.existsSync(path.join(ROOT, folder))) return null;
  for (let i = 1; i <= count; i++) if (!assetExists(`${folder}/${frameName(i)}`)) return null;
  return { base: url(folder) + "/", count };
};
/* Die beiden Filme laufen als Bildfolge auf einer Zeichenfläche: 85 bzw. 76 Bilder, zwischen zwei Bildern
   wird weich übergeblendet. Handys bekommen kleinere Bilder (wenig Arbeitsspeicher, Safari wirft sonst Bilder
   aus dem Speicher); Videos werden hier bewusst nicht gespult – Safari springt darin zu langsam. */
const OT_FRAMES = {
  exit: { d: frameSet("/assets/ending/ending-ufo-frames-760", 76), m: frameSet("/assets/ending/ending-ufo-frames-480", 76) },
};
const OT_STILL = "/assets/hero/hero-cockpit-hoch-frames/f-089.webp";

/* Stationen im All: je eine Leistung, gezeigt in einem „Gerät“ (Smartphone-Feed, Kinoleinwand, Kartenstapel,
   Bild, Bullauge). Inhalte aus content/showcase.json (Admin: Seiten → Leistungen im All). Keine Kundennamen. */
const SHOW = fs.existsSync(path.join(ROOT, "content/showcase.json")) ? readJson("content/showcase.json") : { stations: [] };
const STATIONS = (SHOW.stations || []).filter((s) => s.kind && (s.media || []).length);
for (const s of STATIONS) for (const m of s.media) need(assetExists(m.src), `Leistungen im All → „${s.title_de}“: Datei nicht gefunden: ${m.src}`);
if (errors.length) { console.error("\n✖ Build abgebrochen – bitte im Admin korrigieren:\n" + errors.map((e) => "  • " + e).join("\n") + "\n"); process.exit(1); }
const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src || "");
const posterFor = (m) => m.poster || (isVideo(m.src) && assetExists(m.src.replace(/\.(mp4|webm|mov)$/i, ".jpg")) ? m.src.replace(/\.(mp4|webm|mov)$/i, ".jpg") : "");
function stationMedia(m, cls, lang, sizes) {
  if (isVideo(m.src)) {
    const p = posterFor(m);
    return `<video class="${cls}" muted loop playsinline preload="none"${p ? ` poster="${esc(url(p))}"` : ""}><source src="${esc(url(m.src))}" type="video/mp4"></video>`;
  }
  return img(m.src, tr(m, "alt", lang), { sizes, cls, widths: [480, 960] });
}
const HEART = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>`;
const BUBBLE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-1 0-2-.1-2.9-.4L4 20l1.4-4C4 14.6 3 12.8 3 10.7 3 6.4 7 3 12 3z" fill="currentColor"/></svg>`;
const PLANE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 3.5 2.8 10.6c-.8.3-.8 1.4 0 1.7l6.6 2.3 2.3 6.6c.3.8 1.4.8 1.7 0L21.5 3.5z" fill="currentColor"/></svg>`;
function stationDevice(s, lang) {
  const media = s.media || [], fit = s.fit === "contain" ? " ot-fit-contain" : "";
  if (s.kind === "feed") return `<div class="ot-dev ot-phone" data-dev="feed" aria-hidden="true"><div class="ot-phone-screen">
      <div class="ot-feed-track">${media.map((m) => `<div class="ot-feed-item">${stationMedia(m, "", lang, "300px")}</div>`).join("")}</div>
      <div class="ot-feed-ui"><span>${HEART}</span><span>${BUBBLE}</span><span>${PLANE}</span></div>
      <div class="ot-feed-handle">${esc(S.instagramHandle || "@bushyfamstudios")}</div>
      <div class="ot-feed-bar"><i></i></div>
    </div></div>`;
  if (s.kind === "cinema") return `<div class="ot-dev ot-cinema" data-dev="cinema" aria-hidden="true"><div class="ot-cinema-screen">${media.map((m, i) => `<div class="ot-cine-shot${i ? "" : " is-on"}">${stationMedia(m, "", lang, "(min-width: 900px) 46vw, 88vw")}</div>`).join("")}</div></div>`;
  if (s.kind === "cards") return `<div class="ot-dev ot-cards${fit}" data-dev="cards" aria-hidden="true">${media.map((m, i) => `<div class="ot-card" data-pos="${i}">${stationMedia(m, "", lang, "(min-width: 900px) 26vw, 62vw")}</div>`).join("")}</div>`;
  if (s.kind === "porthole") return `<div class="ot-dev ot-port" data-dev="porthole" aria-hidden="true">${stationMedia(media[0], "", lang, "360px")}</div>`;
  return `<div class="ot-dev ot-still" aria-hidden="true">${stationMedia(media[0], "", lang, "(min-width: 900px) 28vw, 70vw")}</div>`;
}

function pageHome(lang) {
  const t = T[lang], o = t.ot, R = ROUTES[lang], H = S.hero, V = H.video;
  const E = S.ending && S.ending.enabled !== false && S.ending.video && (S.ending.video.sources || []).length ? S.ending.video : null;
  const SR = S.showreel && S.showreel.enabled && S.showreel.src ? S.showreel : null;
  const namedClients = CLIENTS.filter((c) => c.name && c.enabled !== false && c.logo);
  const steps = (HOME.processSteps || []).filter((s) => tr(s, "title", lang));
  const services = SERV.items || [];
  const reelBtn = (label) => SR ? `<button class="ot-btn ot-btn--ghost" type="button" data-ot-reel data-cursor="Play"><span class="ot-tri" aria-hidden="true"></span>${esc(label)}</button>` : "";
  const flightHold = Math.max(2.4, (STATIONS.length + 1) * 0.7).toFixed(2);
  const i18n = { ...o, channel: o.channel, labels: services.map((s) => tr(s, "title", lang)), wa: WA_URL, email: S.email || "" };

  const body = `
<nav class="ot-tl" aria-label="${esc(o.timeline)}">
  <span class="ot-tl-dot" aria-hidden="true"></span><span class="ot-tl-tc" aria-hidden="true">00:00:00:00</span><span class="ot-tl-ch" aria-hidden="true">${esc(o.chIntro)}</span>
  <div class="ot-tl-track" data-ot-track><div class="ot-tl-fill"></div><div class="ot-tl-head"></div></div>
</nav>
<div class="ot-cur" aria-hidden="true"></div><div class="ot-cur-ring" aria-hidden="true"><span></span></div>
${SR ? `<div class="ot-reel" data-ot-reel-box hidden role="dialog" aria-modal="true" aria-label="${esc(tr(SR, "title", lang) || o.showreel)}">
  <video data-ot-reel-video src="${esc(url(SR.src))}"${SR.poster ? ` poster="${esc(url(SR.poster))}"` : ""} controls playsinline preload="none"></video>
  <button class="ot-btn ot-btn--ghost ot-reel-x" type="button" data-ot-reel-close>${esc(o.close)}</button>
</div>` : ""}

<!-- Einstieg: unverändert wie auf der bisherigen Seite (auf iPhones optimiertes Scroll-Video, js/hero-scrub.js) -->
<section class="hero${V.height > V.width ? " hero--tall" : ""}" id="top" data-chapter="${esc(o.chIntro)}" data-hero style="--ar:${(V.width / V.height).toFixed(4)}" aria-labelledby="h-home">
  <div class="hero-copy" data-hero-copy>
    <div class="hero-copy-inner">
      <h1 class="hero-title${tr(H, "line1", lang).length > 20 ? " hero-title--statement" : ""}${tr(H, "line1", lang).length > 45 ? " hero-title--long" : ""}" id="h-home">${tr(H, "line1", lang).includes(S.brandName) ? "" : `<span class="vh">${esc(S.brandName)}: </span>`}<span>${esc(tr(H, "line1", lang))}</span>${tr(H, "line2", lang) ? `<span>${esc(tr(H, "line2", lang))}</span>` : ""}</h1>
      <div class="hero-foot">
        ${tr(H, "text", lang) ? `<p class="hero-text">${esc(tr(H, "text", lang))}</p>` : ""}
        <div class="btn-row"><a class="btn btn--primary" href="${R.contact}">${esc(t.cta)}</a>${SR ? `<button class="btn btn--ghost" type="button" data-ot-reel><span class="ot-tri" aria-hidden="true"></span>${esc(o.showreel)}</button>` : ""}</div>
      </div>
    </div>
  </div>
  <div class="hero-scrub" data-hero-scrub>
    <div class="hero-stage">
      <figure class="hero-media" data-hero-media data-sources="${sourcesAttr(V)}"${HERO_FRAMES ? ` data-frames="${esc(JSON.stringify(HERO_FRAMES))}"` : ""}>
        <img class="hero-poster" src="${esc(url(V.poster))}" width="${V.width}" height="${V.height}" alt="${esc(tr(V, "description", lang))}" fetchpriority="high" decoding="async">
        <video class="hero-video" muted playsinline preload="none" disablepictureinpicture disableremoteplayback aria-hidden="true" tabindex="-1" width="${V.width}" height="${V.height}"></video>
      </figure>
    </div>
  </div>
  ${tr(H, "outro", lang) ? `<div class="hero-outro" data-hero-outro><div class="hero-outro-stage"><p class="hero-outro-text">${esc(tr(H, "outro", lang))}</p></div></div>` : ""}
</section>

<section class="ot-scene ot-space" id="${t.servicesId}" data-ot-scene="space" data-chapter="${esc(o.chServices)}" style="--hold:${flightHold}" aria-labelledby="h-svc" tabindex="-1">
  <div class="ot-stage">
    <canvas class="ot-stars" aria-hidden="true"></canvas>
    <div class="ot-world">
      <div class="ot-item ot-item--title" data-z="0" data-x="0">
        <h2 id="h-svc">${esc(tr(SHOW, "title", lang) || tr(SERV, "title", lang) || t.nav.services)}</h2>
        ${tr(SHOW, "lead", lang) ? `<p>${esc(tr(SHOW, "lead", lang))}</p>` : ""}
      </div>
      ${STATIONS.map((s, k) => `<div class="ot-item ot-item--dev${k % 2 ? " ot-item--flip" : ""}" data-z="${-1900 * (k + 1)}" data-x="${k % 2 ? 0.12 : -0.12}">
        ${stationDevice(s, lang)}
        <div class="ot-cap"><h3>${esc(tr(s, "title", lang))}</h3>${tr(s, "text", lang) ? `<p>${esc(tr(s, "text", lang))}</p>` : ""}</div>
      </div>`).join("\n      ")}
      <div class="ot-item ot-item--end" data-z="${-1900 * (STATIONS.length + 1)}" data-x="0">
        <h3>${esc(o.endTitle)}</h3>
        <div class="ot-ctas"><a class="ot-btn" href="${R.contact}" data-cursor="Los">${esc(t.cta)} <span class="ot-arr" aria-hidden="true">→</span></a>${reelBtn(o.showreelLong)}</div>
        <a class="ot-go" href="${R.work}">${esc(t.allWork)} →</a>
      </div>
    </div>
    <div class="ot-warp-out" aria-hidden="true"></div>
  </div>
</section>

${namedClients.length ? `<section class="ot-board" aria-labelledby="h-clients">
  <h2 id="h-clients" data-ot-reveal>${esc(o.clientsTitle)}</h2>
  <div class="ot-marq"><div class="ot-marq-track">${[0, 1].map((copy) => namedClients.map((c) => {
    const d = imageSize(c.logo) || { w: 2, h: 1 };
    return `<img${d.h / d.w > 0.55 ? ' class="sq"' : ""} src="${esc(url(c.logo))}" width="${d.w}" height="${d.h}" alt="${copy ? "" : esc(c.name)}" loading="lazy" decoding="async"${copy ? ' aria-hidden="true"' : ""}>`;
  }).join("")).join("")}</div></div>
</section>` : ""}

${CAST.length ? `<section class="ot-scene ot-cast" id="besetzung" data-ot-scene="cast" data-chapter="${esc(o.chCast)}" style="--hold:0.9" aria-labelledby="h-cast-home">
  <div class="ot-stage">
    <div class="ot-cast-text">
      <h2 id="h-cast-home">${esc(t.castHomeTitle)}</h2>
      <p>${esc(t.castLead)}</p>
      <div class="ot-who" aria-live="polite">${esc(CAST[0].name)}<small>${esc(tr(CAST[0], "role", lang))}</small></div>
      <a class="ot-btn ot-btn--ghost" href="${R.cast}" data-cursor="Alle">${esc(t.exploreCast)} <span class="ot-arr" aria-hidden="true">→</span></a>
    </div>
    <div class="ot-ringwrap"><ul class="ot-ring">
      ${CAST.map((p, i) => `<li data-role="${esc(tr(p, "role", lang))}"><a href="${hrefFor(lang, "person", p.slug)}">${img(p.photos[0].src, tr(p.photos[0], "alt", lang) || p.name, { sizes: "(min-width: 900px) 20vw, 46vw", widths: [480, 960], lazy: i > 2 })}<span class="ot-ring-name">${esc(p.name)}</span></a></li>`).join("\n      ")}
    </ul></div>
  </div>
</section>` : ""}

<section class="ot-block" id="anfrage" data-chapter="${esc(o.chLaunch)}" aria-labelledby="h-launch">
  <div class="ot-block-head">
    <h2 id="h-launch" data-ot-reveal>${esc(o.launchTitle)}</h2>
    <p data-ot-reveal style="--d:.1s">${esc(o.launchLead)}</p>
  </div>
  <div class="ot-launch">
    <form class="ot-builder" data-ot-builder onsubmit="return false">
      <fieldset class="ot-q"><legend>${esc(o.qWhat)}</legend><div class="ot-chips">
        ${(CON.options || []).filter((op) => !/^(noch offen|still open|henüz belli değil)/i.test(pick(op, "de")) && !/noch offen/i.test(op.de || "")).map((op, i) => `<input type="checkbox" id="ot-w${i}" value="${esc(pick(op, lang))}"${i ? "" : " checked"}><label for="ot-w${i}">${esc(pick(op, lang))}</label>`).join("")}
      </div></fieldset>
      <fieldset class="ot-q"><legend>${esc(o.qWhen)}</legend><div class="ot-chips">
        ${o.when.map((w, i) => `<input type="radio" name="ot-when" id="ot-t${i}" value="${esc(w)}"${i ? "" : " checked"}><label for="ot-t${i}">${esc(w)}</label>`).join("")}
      </div></fieldset>
      <label class="ot-q" for="ot-note"><span>${esc(o.qNote)}</span><textarea id="ot-note" placeholder="${esc(o.notePh)}"></textarea></label>
      <a class="link-arrow" href="${R.contact}">${esc(o.formLink)} <span aria-hidden="true">→</span></a>
    </form>
    <aside class="ot-plan" aria-label="${esc(o.plan)}">
      <div class="ot-now"><span>${esc(o.plan)}</span><span>${esc(o.now)}: <b data-ot-now>–</b></span></div>
      <ol class="ot-track3">
        ${steps.map((s, i) => `<li><span class="ot-pt"></span><div><div class="ot-when" data-ot-when="${i}">${esc(tr(s, "figure", lang) || tr(s, "title", lang))}</div><div class="ot-what"><b>${esc(tr(s, "title", lang))}</b> · ${esc(tr(s, "text", lang))}</div></div></li>`).join("\n        ")}
      </ol>
      <p class="ot-mission" data-ot-mission></p>
      <div class="ot-console" data-ot-console>
        <button class="ot-launch-btn" type="button" data-ot-launch data-cursor="Start"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ot-lr-bg" cx="60" cy="60" r="54"/><circle class="ot-lr" cx="60" cy="60" r="54"/></svg><span class="ot-lbl" data-ot-lbl>${esc(o.launch)}</span></button>
        <div class="ot-ctext"><b>${esc(o.consoleTitle)}</b><span>${esc(o.consoleText)}</span></div>
        <img class="ot-ufo" src="/assets/brand/bushyfam-logo-weiss.png" width="664" height="362" alt="" aria-hidden="true">
      </div>
      <div class="ot-send" data-ot-send hidden>
        <p class="ot-ready">${esc(o.readyText)}</p>
        <blockquote data-ot-preview></blockquote>
        <div class="ot-ctas">
          ${WA_URL ? `<a class="ot-btn" data-ot-wa href="${WA_URL}" target="_blank" rel="noopener noreferrer" data-cursor="Senden">${esc(o.sendWa)} <span aria-hidden="true">↗</span><span class="vh"> ${esc(t.newTab)}</span></a>` : ""}
          ${S.email ? `<a class="ot-btn ot-btn--ghost" data-ot-mail href="mailto:${esc(S.email)}">${esc(o.sendMail)}</a>` : ""}
        </div>
      </div>
      ${S.email ? `<div class="ot-mailrow">E-Mail: <span class="ot-mail">${esc(S.email)}</span> <button class="ot-copy" type="button" data-ot-copy>${esc(o.copy)}</button></div>` : ""}
    </aside>
  </div>
</section>

<section class="ot-block" id="studio" data-chapter="${esc(o.chStudio)}" aria-labelledby="h-about">
  <div class="ot-studio">
    <div class="ot-iris" data-ot-iris>${img(STU.portrait.src, tr(STU.portrait, "alt", lang), { sizes: "(min-width: 900px) 45vw, 92vw" })}</div>
    <div class="ot-studio-txt">
      <h2 id="h-about" data-ot-reveal>${esc(STU.name)}</h2>
      <p class="ot-role" data-ot-reveal style="--d:.08s">${esc(tr(STU, "role", lang))}</p>
      <p data-ot-reveal style="--d:.16s">${esc(tr(HOME, "aboutText", lang))}</p>
      <a class="ot-btn ot-btn--ghost" href="${R.studio}" data-ot-reveal style="--d:.24s">${esc(t.discoverStory)} <span class="ot-arr" aria-hidden="true">→</span></a>
    </div>
  </div>
</section>

${visiblePackages(lang).length ? `<section class="section packages-home" aria-labelledby="h-pkg">
  <div class="wrap">
    <h2 class="h2" id="h-pkg">${esc(tr(PKG, "title", lang) || t.pkgTitle)}</h2>
    <ul class="pkg-grid">
      ${visiblePackages(lang).map((k) => `<li class="pkg${k.highlight ? " pkg--featured" : ""}" data-pixel-card${k.highlight ? ' data-pc-opacity="0.45" data-pc-glow="0.6"' : ""}>
        <h3 class="pkg-name">${esc(tr(k, "name", lang))}</h3>
        ${tr(k, "text", lang) ? `<p class="pkg-text">${esc(tr(k, "text", lang))}</p>` : ""}
        <div class="pkg-price-wrap" aria-live="polite">
          <p class="pkg-price" data-pkg-price="base">${pkgPriceParts(k, lang)}</p>
          ${k.addon && tr(k.addon, "price", lang) ? `<p class="pkg-price" data-pkg-price="addon" hidden>${pkgPriceParts(k.addon, lang)}</p>` : ""}
        </div>
        ${tr(k, "note", lang) ? `<p class="pkg-note">${esc(tr(k, "note", lang))}</p>` : ""}
        ${trList(k, "points", lang).length ? `<ul class="pkg-points">${trList(k, "points", lang).map((x) => `<li>${CHECK_ICON}<span>${esc(x)}</span></li>`).join("")}</ul>` : ""}
        ${k.addon && tr(k.addon, "price", lang) ? `<label class="pkg-addon"><input type="checkbox" data-pkg-addon data-addon-id="${esc(k.addon.id || "")}"><span class="pkg-switch" aria-hidden="true"></span><span class="pkg-addon-label">${esc(tr(k.addon, "label", lang))}</span>${tr(k.addon, "extra", lang) ? `<span class="pkg-addon-extra">${esc(tr(k.addon, "extra", lang))}</span>` : ""}</label>` : ""}
        <a class="pkg-cta" data-pkg-link data-base-id="${esc(k.id || "")}" href="${R.contact}?paket=${encodeURIComponent(k.id || "")}">${esc(t.pkgEnquire)}<span class="vh">: ${esc(tr(k, "name", lang))}</span> <span aria-hidden="true">→</span></a>
      </li>`).join("\n      ")}
    </ul>
    ${tr(PKG, "vatNote", lang) ? `<p class="pkg-vat">${esc(tr(PKG, "vatNote", lang))}</p>` : ""}
    <div class="pkg-foot">${tr(PKG, "note", lang) ? `<p>${esc(tr(PKG, "note", lang))}</p>` : ""}<a class="btn btn--primary" href="${R.contact}">${esc(t.cta)}</a></div>
  </div>
</section>` : ""}

<section class="ot-scene ot-exit" id="kontakt" data-ot-scene="exit" data-chapter="${esc(o.chExit)}" style="--hold:1.3" aria-labelledby="h-cta">
  <div class="ot-stage">
    ${E ? `<canvas data-ot-canvas="exit" role="img" aria-label="${esc(tr(E, "description", lang))}" data-poster="${esc(url(E.poster))}" data-frames-d="${esc(JSON.stringify(OT_FRAMES.exit.d || ""))}" data-frames-m="${esc(JSON.stringify(OT_FRAMES.exit.m || ""))}"></canvas>` : ""}
    <div class="ot-grain" aria-hidden="true"></div>
    <div class="ot-front" aria-hidden="true"></div>
    <div class="ot-cta">
      <div><h2 id="h-cta">${esc(tr(HOME, "ctaTitle", lang))}</h2>${tr(HOME, "ctaText", lang) ? `<p>${esc(tr(HOME, "ctaText", lang))}</p>` : ""}</div>
      <div class="ot-ctas">
        <a class="ot-btn" href="${R.contact}" data-cursor="Los">${esc(t.cta)} <span class="ot-arr" aria-hidden="true">→</span></a>
        ${WA_URL ? `<a class="ot-btn ot-btn--ghost" href="${WA_URL}" target="_blank" rel="noopener noreferrer">WhatsApp ↗<span class="vh"> ${esc(t.newTab)}</span></a>` : ""}
        ${S.instagramUrl ? `<a class="ot-btn ot-btn--ghost" href="${esc(S.instagramUrl)}" target="_blank" rel="noopener noreferrer">${esc(S.instagramHandle || "Instagram")} ↗<span class="vh"> ${esc(t.newTab)}</span></a>` : ""}
      </div>
    </div>
  </div>
</section>
<p class="ot-fwm" aria-hidden="true">BushyFam</p>
<script type="application/json" id="ot-i18n">${JSON.stringify(i18n).replace(/</g, "\\u003c")}</script>`;
  return layout({ lang, key: "home", title: tr(S.seo, "title", lang), description: tr(S.seo, "description", lang), body,
    styles: ["one-take.css"], scripts: ["hero-scrub.js", "lenis.min.js", "one-take.js", ...(visiblePackages(lang).length ? ["pixel-card.js"] : [])], ogImage: S.seo?.image || V.poster });
}

function pageWork(lang) {
  const t = T[lang];
  const cats = CATEGORIES.map((c) => ({ ...c, n: PROJECTS.filter((p) => p.category === c.id).length })).filter((c) => c.n);
  // Filter nur zeigen, wenn sie echten Nutzen bringen. Bei wenigen Projekten wirken einzelne "(1)"-Zähler
  // kleiner als das Portfolio ist – dann lieber die kuratierte Liste ohne Filter zeigen.
  const showFilters = cats.length > 1 && (PROJECTS.length >= 6 || cats.filter((c) => c.n >= 2).length >= 2);
  const body = `
<section class="wrap page-head" aria-labelledby="h-work">
  <p class="eyebrow">${esc(t.portfolio)}</p>
  <h1 class="page-title" id="h-work">${esc(t.nav.work)}</h1>
  <p class="lead">${esc(t.workLead)}</p>
</section>
<section class="wrap work-list" aria-labelledby="h-work">
  ${showFilters ? `<div class="filters" role="group" aria-label="${esc(t.chooseCat)}" data-filters>
    <button class="filter" type="button" data-cat="all" aria-pressed="true">${esc(t.all)}<span class="n">${PROJECTS.length}</span></button>
    ${cats.map((c) => `<button class="filter" type="button" data-cat="${c.id}" aria-pressed="false">${esc(c[lang])}<span class="n">${c.n}</span></button>`).join("\n    ")}
  </div>
  <p class="vh" aria-live="polite" data-filter-status data-tpl="${esc(t.filterStatus)}" data-tpl-one="${esc(t.filterStatusOne)}"></p>` : ""}
  <ul class="feature-list work-page-list" data-grid>
    ${PROJECTS.map((p, i) => featureBlock(p, lang, i, { h: 2, eager: i === 0 }).replace('<li class="', `<li data-cat="${esc(p.category)}" class="`)).join("\n    ")}
  </ul>
</section>`;
  return layout({ lang, key: "work", title: `${t.nav.work} – ${S.brandName}`, description: t.workLead, body, ogImage: PROJECTS[0]?.cover?.src });
}

function pageProject(p, lang, i) {
  const t = T[lang], R = ROUTES[lang];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const title = tr(p, "title", lang);
  const films = (p.media || []).filter((m) => m.type === "video");
  const images = (p.media || []).filter((m) => m.type !== "video");

  const film = (m) => {
    const ttl = tr(m, "title", lang) || title;
    const meta = [m.duration, m.audio === true ? t.withSound : m.audio === false ? t.noSound : ""].filter(Boolean).join(" · ");
    const dim = m.poster ? imageSize(m.poster) || {} : {};
    return `<li class="clip${dim.w && dim.w / dim.h > 1.2 ? " clip--wide" : ""}"><div class="clip-frame" style="--ar:${dim.w ? (dim.w / dim.h).toFixed(4) : "0.5625"}" data-clip data-src="${esc(url(m.src))}">
        ${m.poster ? img(m.poster, "", { sizes: "(min-width: 900px) 30vw, 78vw" }) : ""}
        <button class="clip-play" type="button" data-clip-play data-title="${esc(ttl)}"><span class="clip-play-icon" aria-hidden="true"></span><span>${esc(t.play)}</span><span class="vh">: ${esc(ttl)}</span></button>
      </div><p class="m-cap"><strong>${esc(ttl)}</strong>${meta ? ` <span>${esc(meta)}</span>` : ""}</p></li>`;
  };
  const still = (m, k) => {
    const cap = tr(m, "caption", lang);
    return `<li class="still still--${k % 4}"><figure>${img(m.src, tr(m, "alt", lang), { sizes: k % 4 === 0 || k % 4 === 3 ? "(min-width: 900px) 55vw, 100vw" : "(min-width: 900px) 40vw, 80vw" })}${cap ? `<figcaption class="m-cap">${esc(cap)}</figcaption>` : ""}</figure></li>`;
  };
  // Kapitel in der Reihenfolge, in der die Medienarten im Admin zuerst vorkommen
  const chapters = [];
  for (const m of p.media || []) {
    const kind = m.type === "video" ? "film" : "image";
    if (!chapters.includes(kind)) chapters.push(kind);
  }
  const chapterHtml = chapters.map((kind, ci) => {
    const id = `ch-${kind}`;
    const label = kind === "film" ? t.chFilm : p.category === "branding" ? t.chIdentity : t.chPhoto;
    const n = kind === "film" ? films.length : images.length;
    const head = `<div class="wrap chapter-head"><span class="chapter-no" aria-hidden="true">${String(ci + 1).padStart(2, "0")}</span><h2 class="chapter-title" id="${id}">${esc(label)}</h2>${n > 1 ? `<span class="chapter-n">${n}</span>` : ""}</div>`;
    return kind === "film"
      ? `<section class="chapter chapter--film" aria-labelledby="${id}">${head}
    <ul class="film-row${films.length > 1 ? "" : " film-row--single"}${(() => { const w = films.map((m) => { const d = m.poster ? imageSize(m.poster) : null; return d ? d.w / d.h > 1.2 : false; }); return w.some(Boolean) && !w.every(Boolean) ? " film-row--mixed" : ""; })()}">${films.map(film).join("\n      ")}</ul>
  </section>`
      : `<section class="chapter chapter--stills" aria-labelledby="${id}">${head}
    <ul class="wrap stills">${images.map(still).join("\n      ")}</ul>
  </section>`;
  }).join("\n  ");

  const facts = [[t.factClient, filled(p.client)], [t.factIndustry, tr(p, "industry", lang)], [t.factYear, filled(p.year)], [t.factDisciplines, tr(p, "disciplines", lang), "wide"]].filter(([, v]) => v);
  /* Case-Aufbau: Aufgabe – Lösung – Ergebnis (+ optional Kundenzitat). Leere oder [TODO]-Felder werden ausgeblendet;
     ohne Aufgabe und Lösung erscheint wie bisher der ausführliche Text. */
  const blocks = [["task", t.caseTask], ["solution", t.caseSolution], ["result", t.caseResult]].map(([k, label]) => [label, paras(tr(p, k, lang))]).filter(([, ps]) => ps.length);
  const Q = p.quote || {};
  const quote = tr(Q, "text", lang) && filled(Q.name) ? `<figure class="case-quote"><blockquote><p>${esc(tr(Q, "text", lang))}</p></blockquote><figcaption>${esc(Q.name)}${tr(Q, "role", lang) ? `, ${esc(tr(Q, "role", lang))}` : ""}</figcaption></figure>` : "";
  const caseHtml = blocks.length ? `<div class="case-blocks">${blocks.map(([label, ps]) => `<section class="case-block"><h2 class="case-label">${esc(label)}</h2>${ps.map((x) => `<p>${esc(x)}</p>`).join("")}</section>`).join("")}${quote}</div>`
    : `${paras(tr(p, "body", lang)).length ? `<div class="project-body">${paras(tr(p, "body", lang)).map((x) => `<p>${esc(x)}</p>`).join("")}</div>` : ""}${quote}`;
  const nextSame = next && next.client && next.client === tr(next, "title", lang);
  const body = `
<article class="project">
  <header class="wrap page-head project-head">
    <p class="eyebrow"><a class="crumb" href="${R.work}">${esc(t.nav.work)}</a> · ${esc(catLabel(p.category, lang))}</p>
    <h1 class="page-title">${esc(title)}</h1>
    ${tr(p, "summary", lang) ? `<p class="lead">${esc(tr(p, "summary", lang))}</p>` : ""}
  </header>
  <div class="wrap project-intro">
    ${facts.length ? `<dl class="facts">${facts.map(([k, v, w]) => `<div${w ? ` class="fact--${w}"` : ""}><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
    ${caseHtml}
  </div>
  ${chapterHtml}
  ${next && next.slug !== p.slug ? `<nav class="project-next" aria-label="${esc(t.moreWork)}">
    <a class="next-link wrap" href="${hrefFor(lang, "project", next.slug)}">
      <span class="next-text"><span class="eyebrow">${esc(t.nextProject)}</span><span class="next-title">${esc(tr(next, "title", lang))}&nbsp;<span aria-hidden="true">→</span></span>${next.client && !nextSame ? `<span class="client">${esc(next.client)}</span>` : ""}</span>
      <span class="next-media${next.cover.fit === "contain" ? " next-media--contain" : ""}">${img(next.cover.src, "", { sizes: "(min-width: 900px) 30vw, 100vw" })}</span>
    </a>
    <p class="wrap"><a class="link-arrow" href="${R.work}">${esc(t.allWork)} <span aria-hidden="true">→</span></a></p>
  </nav>` : `<p class="wrap project-all"><a class="link-arrow" href="${R.work}">${esc(t.allWork)} <span aria-hidden="true">→</span></a></p>`}
</article>
${ctaBlock(lang)}`;
  return layout({ lang, key: "project", slug: p.slug, title: `${title} – ${p.client && p.client !== title ? p.client + " – " : ""}${S.brandName}`,
    description: tr(p, "summary", lang) || t.workLead, body, scripts: films.length ? ["video-preview.js"] : [], ogImage: p.cover.src });
}

function objectTile(o, lang) {
  return `<li class="obj-tile">${img(o.image, tr(o, "alt", lang) || o.title_de || "", { sizes: "320px" })}</li>`;
}

const ctaBlock = (lang) => `<section class="section cta" aria-labelledby="h-cta2">
  <div class="wrap"><h2 class="h2" id="h-cta2">${esc(T[lang].ctaSmall)}</h2><div class="btn-row"><a class="btn btn--primary" href="${ROUTES[lang].contact}">${esc(T[lang].cta)}</a></div></div>
</section>`;

const roleKey = (p) => (tr(p, "role", "de") || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function pageCast(lang) {
  const t = T[lang];
  const roles = [];
  for (const p of CAST) {
    const k = roleKey(p);
    const found = roles.find((r) => r.id === k);
    if (found) found.n++; else roles.push({ id: k, label: tr(p, "role", lang), n: 1 });
  }
  const body = `
<section class="wrap page-head" aria-labelledby="h-cast">
  <p class="eyebrow">${esc(t.nav.cast)}</p>
  <h1 class="page-title" id="h-cast">${esc(t.nav.cast)}</h1>
  <p class="lead">${esc(t.castLead)}</p>
  <p class="cast-note">${esc(t.castNote)}</p>
</section>
${roles.length > 1 ? `<section class="wrap work-list">
  <div class="filters" role="group" aria-label="${esc(t.chooseRole)}" data-filters>
    <button class="filter" type="button" data-cat="all" aria-pressed="true">${esc(t.all)}<span class="n">${CAST.length}</span></button>
    ${roles.map((r) => `<button class="filter" type="button" data-cat="${esc(r.id)}" aria-pressed="false">${esc(r.label)}<span class="n">${r.n}</span></button>`).join("\n    ")}
  </div>
  <p class="vh" aria-live="polite" data-filter-status data-tpl="${esc(t.castStatus)}" data-tpl-one="${esc(t.castStatusOne)}"></p>
</section>` : ""}
<section class="cast-page">
  ${castRow(lang, { page: true })}
</section>
${ctaBlock(lang)}`;
  return layout({ lang, key: "cast", title: `${t.nav.cast} – ${S.brandName}`, description: t.castLead, body, ogImage: CAST[0]?.photos?.[0]?.src });
}

function pagePerson(p, lang, i) {
  const t = T[lang], R = ROUTES[lang];
  const next = CAST[(i + 1) % CAST.length];
  const [first, ...rest] = p.photos;
  const photo = (ph, k, eager) => `<li class="pf-photo pf-photo--${k % 3}"><figure>${img(ph.src, tr(ph, "alt", lang) || p.name, { sizes: "(min-width: 900px) 55vw, 100vw", lazy: !eager })}</figure></li>`;
  /* Showreel: nur wenn ein Video eingetragen ist – Klick startet es (gleiches Verhalten wie bei Projekten) */
  const V = p.video && p.video.src ? p.video : null;
  const reel = V ? `<li class="pf-reel"><div class="clip-frame" style="--ar:${(() => { const d = V.poster ? imageSize(V.poster) : null; return d ? (d.w / d.h).toFixed(4) : "0.5625"; })()}" data-clip data-src="${esc(url(V.src))}">
        ${V.poster ? img(V.poster, "", { sizes: "(min-width: 900px) 55vw, 100vw" }) : ""}
        <button class="clip-play" type="button" data-clip-play data-title="${esc(p.name)} – ${esc(t.showreel)}"><span class="clip-play-icon" aria-hidden="true"></span><span>${esc(t.showreel)}</span><span class="vh">: ${esc(p.name)}</span></button>
      </div></li>` : "";
  /* Angaben nur, wenn sie im Admin eingetragen sind – nichts wird ergänzt oder geschätzt */
  const facts = [...(p.city ? [[t.factCity, p.city]] : []), ...(p.facts || []).filter((f) => f && f.value && tr(f, "label", lang)).map((f) => [tr(f, "label", lang), f.value])];
  const enquire = `${R.contact}?person=${encodeURIComponent(p.name)}`;
  const body = `
<article class="profile">
  <div class="wrap profile-grid">
    <header class="profile-info">
      <p class="eyebrow"><a class="crumb" href="${R.cast}">${esc(t.nav.cast)}</a> · ${esc(tr(p, "role", lang))}</p>
      <h1 class="profile-name">${esc(p.name)}</h1>
      ${tr(p, "text", lang) ? `<p class="lead">${esc(tr(p, "text", lang))}</p>` : ""}
      ${facts.length ? `<dl class="profile-facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
      <div class="btn-row profile-actions">
        <a class="btn btn--primary" href="${enquire}">${esc(t.bookThis)}</a>
        ${p.instagram ? ext(p.instagram, esc(p.instagramHandle || "Instagram"), lang) : ""}
      </div>
    </header>
    <ul class="profile-media" aria-label="${esc(t.photos)}">
      ${photo(first, 0, true)}
      ${reel}
      ${rest.map((ph, k) => photo(ph, k + 1, false)).join("\n      ")}
    </ul>
  </div>
  <nav class="profile-next" aria-label="${esc(t.nav.cast)}">
    <div class="wrap profile-next-inner">
      ${next && next.slug !== p.slug ? `<a class="profile-next-link" href="${hrefFor(lang, "person", next.slug)}">
        <span class="profile-next-media">${img(next.photos[0].src, "", { sizes: "160px" })}</span>
        <span><span class="eyebrow">${esc(t.nextPerson)}</span><span class="next-title">${esc(next.name)}&nbsp;<span aria-hidden="true">→</span></span></span>
      </a>` : ""}
      <a class="link-arrow" href="${R.cast}">${esc(t.allCast)} <span aria-hidden="true">→</span></a>
    </div>
  </nav>
</article>`;
  return layout({ lang, key: "person", slug: p.slug, title: `${p.name} – ${tr(p, "role", lang)} – ${S.brandName}`,
    description: tr(p, "text", lang) || `${p.name} – ${tr(p, "role", lang)}`, body, scripts: V ? ["video-preview.js"] : [], ogImage: first.src });
}

function pageStudio(lang) {
  const t = T[lang];
  const body = `
<section class="wrap page-head" aria-labelledby="h-studio">
  <p class="eyebrow">${esc(t.nav.studio)}</p>
  <h1 class="page-title" id="h-studio">${esc(STU.name)}</h1>
  <p class="role">${esc(tr(STU, "role", lang))}</p>
</section>
${tr(STU, "statement", lang) ? `<section class="wrap studio-statement"><p>${esc(tr(STU, "statement", lang))}</p></section>` : ""}
<section class="wrap studio-top">
  ${img(STU.portrait.src, tr(STU.portrait, "alt", lang), { sizes: "(min-width: 900px) 26rem, 92vw" })}
  <div>
    <p class="lead">${esc(tr(STU, "lead", lang))}</p>
    ${(STU.paragraphs || []).map((x) => `<p class="body">${esc(pick(x, lang))}</p>`).join("")}
  </div>
</section>
${(STU.stations || []).length ? `<section class="section path" aria-labelledby="h-st">
  <div class="wrap">
    <h2 class="h2 path-title" id="h-st">${esc(tr(STU, "stationsTitle", lang))}</h2>
    ${STU.stations.filter((s) => s.feature && s.image && s.image.src).map((s, k) => `<article class="moment moment--${k % 2 ? "right" : "left"}">
      <figure class="moment-media">${img(s.image.src, tr(s.image, "alt", lang), { sizes: "(min-width: 900px) 55vw, 100vw" })}</figure>
      <div class="moment-text">${tr(s, "year", lang) ? `<p class="year">${esc(tr(s, "year", lang))}</p>` : ""}<h3>${esc(tr(s, "title", lang))}</h3><p class="t">${esc(tr(s, "text", lang))}</p>${s.link && s.link.url ? `<p class="st-link">${ext(s.link.url, esc(tr(s.link, "label", lang)), lang)}${tr(s.link, "note", lang) ? `<span class="note-link">${esc(tr(s.link, "note", lang))}</span>` : ""}</p>` : ""}</div>
    </article>`).join("\n    ")}
    ${STU.stations.some((s) => !(s.feature && s.image && s.image.src)) ? `<ul class="notes">
      ${STU.stations.filter((s) => !(s.feature && s.image && s.image.src)).map((s) => `<li>${tr(s, "year", lang) ? `<p class="year">${esc(tr(s, "year", lang))}</p>` : ""}<h3>${esc(tr(s, "title", lang))}</h3><p class="t">${esc(tr(s, "text", lang))}</p>${s.image && s.image.src ? img(s.image.src, tr(s.image, "alt", lang), { sizes: "(min-width: 900px) 26rem, 92vw" }) : ""}${s.link && s.link.url ? `<p class="st-link">${ext(s.link.url, esc(tr(s.link, "label", lang)), lang)}</p>` : ""}</li>`).join("\n      ")}
    </ul>` : ""}
  </div>
</section>` : ""}
<section class="section" aria-labelledby="h-proc">
  <div class="wrap">
    <div class="head-row"><div><p class="eyebrow">${esc(t.process)}</p><h2 class="h2" id="h-proc">${esc(tr(STU, "processTitle", lang))}</h2></div></div>
    <ol class="steps">
      ${(STU.process || []).map((s, i) => `<li><span class="no" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${esc(tr(s, "title", lang))}</h3><p>${esc(tr(s, "text", lang))}</p></li>`).join("\n      ")}
    </ol>
  </div>
</section>
${ctaBlock(lang)}`;
  return layout({ lang, key: "studio", title: `${t.nav.studio} – ${STU.name} – ${S.brandName}`, description: tr(STU, "lead", lang), body, ogImage: STU.portrait.src });
}

function pageContact(lang) {
  const t = T[lang], f = t.form;
  const field = (id, label, type, req, extra = "") => `<div class="field"><label for="f-${id}">${esc(label)} ${req ? `<span aria-hidden="true">*</span><span class="vh">(${esc(f.required)})</span>` : `<span class="opt">(${esc(f.optional)})</span>`}</label>${type === "textarea" ? `<textarea id="f-${id}" name="${id}"${req ? " required" : ""} aria-describedby="e-${id}"${extra}></textarea>` : `<input id="f-${id}" name="${id}" type="${type}"${req ? " required" : ""} aria-describedby="e-${id}"${extra}>`}<p class="err" id="e-${id}" hidden></p></div>`;
  const body = `
<section class="wrap page-head" aria-labelledby="h-contact">
  <p class="eyebrow">${esc(t.nav.contact)}</p>
  <h1 class="page-title" id="h-contact">${esc(tr(CON, "title", lang))}</h1>
</section>
<section class="wrap contact-grid">
  <div>
    <p class="lead">${esc(tr(CON, "intro", lang))}</p>
    ${WA_URL || S.instagramUrl || S.email ? `<div class="direct">
      <p class="direct-label">${esc(t.direct)}</p>
      <ul class="direct-list">
        ${S.email ? `<li><a class="link-arrow" href="mailto:${esc(S.email)}">${esc(S.email)}</a></li>` : ""}
        ${WA_URL ? `<li>${ext(WA_URL, "WhatsApp", lang)}</li>` : ""}
        ${S.instagramUrl ? `<li>${ext(S.instagramUrl, esc(S.instagramHandle || "Instagram"), lang)}</li>` : ""}
      </ul>
    </div>` : ""}
  </div>
  <form class="form" name="kontakt" method="POST" action="${ROUTES[lang].thanks}" data-netlify="true" netlify-honeypot="bot-field" novalidate data-form data-lang="${lang}"${WA_URL ? ` data-wa="${WA_URL}"` : ""}>
    <input type="hidden" name="form-name" value="kontakt">
    <input type="hidden" name="sprache" value="${lang}">
    <p class="hp" aria-hidden="true"><label>${esc(f.hp)} <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
    <div class="form-summary" tabindex="-1" hidden data-summary></div>
    ${field("name", f.name, "text", true, ' autocomplete="name"')}
    ${field("email", f.email, "email", true, ' autocomplete="email" inputmode="email"')}
    ${field("unternehmen", f.company, "text", false, ' autocomplete="organization"')}
    <fieldset class="field"><legend>${esc(f.services)} <span class="opt">(${esc(f.optional)})</span></legend><div class="chips">
      ${(CON.options || []).map((o) => `<label class="chip"><input type="checkbox" name="leistungen" value="${esc(o.de)}"${o.cast ? " data-cast-option" : ""}><span class="box" aria-hidden="true"></span>${esc(pick(o, lang))}</label>`).join("\n      ")}
    </div></fieldset>
    ${visiblePackages(lang).length ? `<div class="field"><label for="f-paket">${esc(f.package)} <span class="opt">(${esc(f.optional)})</span></label><select id="f-paket" name="paket">
      <option value="">${esc(f.packageNone)}</option>
      ${visiblePackages(lang).map((k) => `<option value="${esc(tr(k, "name", "de"))}" data-id="${esc(k.id || "")}">${esc(tr(k, "name", lang))} – ${pkgPrice(k, lang)}</option>${k.addon && tr(k.addon, "price", lang) && tr(k.addon, "name", lang) ? `<option value="${esc(tr(k.addon, "name", "de"))}" data-id="${esc(k.addon.id || "")}">${esc(tr(k.addon, "name", lang))} – ${esc(tr(k.addon, "price", lang))}</option>` : ""}`).join("")}
    </select></div>` : ""}
    <div class="field field--talent" data-talent-field hidden><label for="f-talent">${esc(f.talent)} <span class="opt">(${esc(f.optional)})</span></label><input id="f-talent" name="talent" type="text" autocomplete="off" aria-describedby="e-talent"><p class="err" id="e-talent" hidden></p></div>
    ${field("nachricht", f.message, "textarea", true)}
    <div class="field-row">${field("zeitraum", f.timeframe, "text", false)}${field("budget", f.budget, "text", false)}</div>
    <p class="pv">${esc(f.privacyNote)} <a href="${ROUTES[lang].privacy}">${esc(t.privacy)}</a>.</p>
    <div><button class="btn btn--primary" type="submit" data-submit>${esc(f.submit)}</button></div>
    <div class="result" role="status" aria-live="polite" data-result></div>
  </form>
  <div class="form-done" tabindex="-1" hidden data-done>
    <p class="form-done-title">${esc(f.successTitle)}</p>
    <p class="muted">${esc(f.success)}</p>
    <button class="link-arrow" type="button" data-again>${esc(f.another)}</button>
  </div>
</section>
<script type="application/json" id="form-i18n">${JSON.stringify(f).replace(/</g, "\\u003c")}</script>`;
  return layout({ lang, key: "contact", title: `${t.nav.contact} – ${S.brandName}`, description: tr(CON, "intro", lang), body, scripts: ["contact.js"] });
}

/* Bestätigung nach dem Absenden ohne JavaScript (Netlify leitet nach dem POST hierher) */
function pageThanks(lang) {
  const t = T[lang], f = t.form;
  const body = `
<section class="wrap page-head" aria-labelledby="h-thanks">
  <p class="eyebrow">${esc(t.nav.contact)}</p>
  <h1 class="page-title page-title--sm" id="h-thanks">${esc(f.successTitle)}</h1>
  <p class="lead">${esc(f.success)}</p>
  <div class="btn-row" style="margin-top:2rem"><a class="btn btn--primary" href="${ROUTES[lang].home}">${esc(t.backToSite)}</a><a class="btn btn--ghost" href="${ROUTES[lang].work}">${esc(t.seeWork)}</a></div>
</section>`;
  return layout({ lang, key: "thanks", title: `${f.successTitle} – ${S.brandName}`, description: f.success, body }).replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"');
}

function pageLegal(lang, key) {
  const t = T[lang], field = key === "imprint" ? "imprint" : "privacy";
  const text = tr(LEGAL, field, lang);
  /* Rechtstexte gibt es verbindlich auf Deutsch und Englisch; ohne eigene türkische Fassung erscheint die englische mit Hinweis */
  const fallback = lang === "tr" && !LEGAL[`${field}_tr`];
  const blocks = paras(text).map((b) => b.startsWith("## ") ? `<h2>${esc(b.slice(3))}</h2>` : `<p>${esc(b).replace(/\n/g, "<br>")}</p>`).join("\n");
  const body = `
<section class="wrap page-head" aria-labelledby="h-legal">
  <h1 class="page-title page-title--sm" id="h-legal">${esc(t[field])}</h1>
</section>
${fallback && blocks ? `<p class="wrap legal-note muted">${esc(t.legalInEnglish)}</p>` : ""}
<section class="wrap legal"${fallback ? ' lang="en"' : ""}>${blocks || `<p class="lead">${esc(t.inPreparation)}</p>`}</section>`;
  return layout({ lang, key, title: `${t[field]} – ${S.brandName}`, description: `${t[field]} – ${S.brandName}`, body });
}

/* Eine 404-Seite für alle Adressen: Englisch zuerst (Hauptsprache), Deutsch darunter */
function page404() {
  const body = `
<section class="wrap page-head" aria-labelledby="h-404">
  <p class="eyebrow">404</p>
  <h1 class="page-title" id="h-404">${esc(T.de.notFound)}</h1>
  <p class="lead">${esc(T.de.notFoundText)}</p>
  <p class="lead" lang="en">${esc(T.en.notFound)} – ${esc(T.en.notFoundText)}</p>
  <div class="btn-row" style="margin-top:2rem"><a class="btn btn--primary" href="${ROUTES.de.home}">${esc(T.de.backHome)}</a><a class="btn btn--ghost" href="${ROUTES.en.home}" hreflang="en" lang="en">${esc(T.en.backHome)}</a></div>
</section>`;
  return layout({ lang: "de", key: "home404", title: `404 – ${S.brandName}`, description: T.de.notFoundText, body }).replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"');
}

/* ---------- Schreiben ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
const written = [];
const unlisted = new Set();
const write = (route, html) => {
  const file = path.join(OUT, route.endsWith("/") ? route + "index.html" : route);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  written.push(route);
};
ROUTES.de.home404 = ROUTES.en.home404 = ROUTES.tr.home404 = "/404.html";
for (const lang of LANGS) {
  const R = ROUTES[lang];
  write(R.home, pageHome(lang));
  write(R.work, pageWork(lang));
  PROJECTS.forEach((p, i) => write(hrefFor(lang, "project", p.slug), pageProject(p, lang, i)));
  if (CAST.length) {
    write(R.cast, pageCast(lang));
    CAST.forEach((p, i) => write(hrefFor(lang, "person", p.slug), pagePerson(p, lang, i)));
  }
  write(R.studio, pageStudio(lang));
  write(R.contact, pageContact(lang));
  write(R.thanks, pageThanks(lang)); unlisted.add(R.thanks);
  write(R.imprint, pageLegal(lang, "imprint"));
  write(R.privacy, pageLegal(lang, "privacy"));
  if (!PUBLIC_LANGS.includes(lang)) for (const r of written) if (r.startsWith(R.home)) unlisted.add(r);
}
write("/404.html", page404());

// Statische Dateien übernehmen (nur was die Seite braucht)
for (const dir of ["assets", "css", "admin"]) fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true });
fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
for (const f of ["site.js", "contact.js", "hero-scrub.js", "ending-scrub.js", "video-preview.js", "pixel-card.js", "process.js", "one-take.js", "lenis.min.js"]) fs.copyFileSync(path.join(ROOT, "js", f), path.join(OUT, "js", f));
// Inhalte für den Admin nicht öffentlich ausliefern ist nicht nötig – sie liegen ohnehin im Repository.

// 301-Weiterleitungen von den früheren Adressen (Englisch an der Wurzel, Deutsch unter /de/).
// Jede alte Seite zeigt auf dieselbe Seite in der neuen Struktur; Unterseiten (Projekte, Personen) per :splat.
{
  const lines = ["# Automatisch erzeugt von build/build.mjs – frühere Adressen → neue Struktur (Deutsch an der Wurzel, Englisch unter /en/)"];
  for (const lang of ["en", "de"]) {
    const covered = [];
    for (const [k, from] of Object.entries(LEGACY_ROUTES[lang]).sort((a, b) => a[1].length - b[1].length)) {
      const to = ROUTES[lang][k];
      if (!to || from === to) continue;
      // Unterseite einer schon weitergeleiteten Adresse mit gleichem Ziel-Muster (z. B. /de/kontakt/ unter /de/*): keine eigene Regel nötig
      if (covered.some(([f, t2]) => from.startsWith(f) && to === t2 + from.slice(f.length))) continue;
      covered.push([from, to]);
      const bare = from.replace(/\/$/, "");
      lines.push(`${bare}  ${to}  301`, `${from}*  ${to}:splat  301`);
    }
  }
  fs.writeFileSync(path.join(OUT, "_redirects"), lines.join("\n") + "\n");
}

// robots.txt und sitemap.xml
const site = (S.siteUrl || "").replace(/\/+$/, "");
fs.writeFileSync(path.join(OUT, "robots.txt"), S.launch
  ? `User-agent: *\nAllow: /\nDisallow: /admin/\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ""}`
  : "# Vorschau – noch nicht für Suchmaschinen freigegeben\nUser-agent: *\nDisallow: /\n");
if (site) {
  const urls = written.filter((r) => r.endsWith("/") && !unlisted.has(r));
  fs.writeFileSync(path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
}
console.log(`✓ Build fertig: ${written.length} Seiten, ${PROJECTS.length} Projekte, ${CAST.length} in der Besetzung, Sprachen: ${LANGS.join(", ")}${S.launch ? "" : " (noindex – Vorschau)"}`);
