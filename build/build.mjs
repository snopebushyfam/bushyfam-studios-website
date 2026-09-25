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
import { T, ROUTES, CATEGORIES } from "./i18n.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist");
const LANGS = ["de", "en"];
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
const tr = (obj, key, lang) => (obj && (obj[`${key}_${lang}`] || obj[`${key}_de`])) || "";
const pick = (obj, lang) => (obj && (obj[lang] || obj.de)) || "";
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
  if (ON_NETLIFY && s.startsWith("/assets/uploads/") && /\.(jpe?g|png|webp)$/i.test(s)) {
    srcset = ` srcset="${widths.map((w) => `/.netlify/images?url=${encodeURIComponent(s)}&amp;w=${w} ${w}w`).join(", ")}" sizes="${sizes}"`;
  }
  return `<img${cls ? ` class="${cls}"` : ""} src="${esc(s)}"${srcset}${dim.w ? ` width="${dim.w}" height="${dim.h}"` : ""} alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async">`;
}
const ext = (href, label, lang, cls = "link-arrow") =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label} <span aria-hidden="true">↗</span><span class="vh"> ${esc(T[lang].newTab)}</span></a>`;

/* ---------- Inhalte laden und prüfen ---------- */
const S = readJson("content/settings.json");
const HOME = readJson("content/home.json");
const SERV = readJson("content/services.json");
const STU = readJson("content/studio.json");
const CON = readJson("content/contact.json");
const LEGAL = readJson("content/legal.json");
const PROJECTS = readDir("content/projects").sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
const CLIENTS = readDir("content/clients").sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
/* Besetzung: nur Personen mit vorliegender Einwilligung und Häkchen „sichtbar“ */
const CAST = readDir("content/cast")
  .filter((p) => p.visible !== false && p.consent === true)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

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
const castSlugs = new Set();
for (const p of CAST) {
  const where = `Besetzung „${p.name || p.__file}“`;
  need(/^[a-z0-9-]+$/.test(p.slug || ""), `${where}: Die Adresse (Slug) darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.`);
  need(!castSlugs.has(p.slug), `${where}: Die Adresse „${p.slug}“ ist doppelt vergeben.`); castSlugs.add(p.slug);
  need(p.name, `${where}: Name fehlt.`);
  need(tr(p, "role", "de"), `${where}: Rolle (DE) fehlt.`);
  need(p.photos && p.photos.length && p.photos[0].src, `${where}: Mindestens ein Foto wird gebraucht.`);
  for (const ph of (p.photos || [])) need(assetExists(ph.src), `${where}: Foto nicht gefunden: ${ph.src}`);
}
for (const v of [S.hero?.video, S.ending?.video]) for (const s of (v?.sources || [])) need(assetExists(s.src), `Film-Datei nicht gefunden: ${s.src}`);
if (errors.length) {
  console.error("\n✖ Build abgebrochen – bitte im Admin korrigieren:\n" + errors.map((e) => "  • " + e).join("\n") + "\n");
  process.exit(1);
}

/* ---------- Layout ---------- */
const hrefFor = (lang, key, slug) => {
  const r = ROUTES[lang][key];
  return slug ? `${r}${slug}/` : r;
};
function layout({ lang, key, slug, title, description, body, scripts = [], ogImage }) {
  const t = T[lang], other = lang === "de" ? "en" : "de";
  const site = (S.siteUrl || "").replace(/\/+$/, "");
  const here = hrefFor(lang, key, slug), there = hrefFor(other, key, slug);
  const abs = (p) => site + p;
  const nav = [["work", t.nav.work], ...(CAST.length ? [["cast", t.nav.cast]] : []), ["services", t.nav.services], ["studio", t.nav.studio]];
  const navHref = (k) => (k === "services" ? ROUTES[lang].home + "#" + t.servicesId : ROUTES[lang][k]);
  const cur = (k) => (k === key || (k === "work" && key === "project") || (k === "cast" && key === "person") ? ' aria-current="page"' : "");
  const ld = {
    "@context": "https://schema.org", "@type": "ProfessionalService", name: S.brandName,
    address: { "@type": "PostalAddress", addressLocality: tr(S, "location", lang), addressCountry: "DE" },
    areaServed: "DE", sameAs: [S.instagramUrl].filter(Boolean), ...(site ? { url: abs(ROUTES[lang].home) } : {})
  };
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${S.launch ? "" : '<meta name="robots" content="noindex, nofollow">\n'}<meta name="theme-color" content="#000000">
${site ? `<link rel="canonical" href="${abs(here)}">
<link rel="alternate" hreflang="${lang}" href="${abs(here)}">
<link rel="alternate" hreflang="${other}" href="${abs(there)}">
<link rel="alternate" hreflang="x-default" href="${abs(hrefFor("de", key, slug))}">
` : ""}<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.brandName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:locale" content="${lang === "de" ? "de_DE" : "en_GB"}">
${site && ogImage ? `<meta property="og:image" content="${abs(url(ogImage))}">\n` : ""}<link rel="icon" href="/assets/brand/icons/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/icons/icon-32.png">
<link rel="apple-touch-icon" href="/assets/brand/icons/icon-180.png">
<link rel="preload" href="/assets/fonts/poppins-bold.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/css/site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body class="page-${key}">
<a class="skip" href="#main">${esc(t.skip)}</a>
<header class="site-header${key === "home" ? "" : " solid"}" data-header>
  <div class="header-inner">
    <a class="brand" href="${ROUTES[lang].home}" aria-label="${esc(S.brandName)} – ${esc(t.homeLabel)}"><span class="brand-crop"><img src="/assets/brand/bushyfam-logo-original.png" width="500" height="500" alt=""></span></a>
    <nav class="nav" aria-label="${esc(t.mainNav)}">
      <ul>
        ${nav.map(([k, l]) => `<li><a href="${navHref(k)}"${cur(k)}>${esc(l)}</a></li>`).join("\n        ")}
        <li><a class="lang" href="${there}" hreflang="${other}" lang="${other}"><span aria-hidden="true">${other.toUpperCase()}</span><span class="vh">${esc(t.switchTo)}</span></a></li>
        <li><a class="btn btn--primary btn--nav" href="${ROUTES[lang].contact}"${cur("contact")}>${esc(t.cta)}</a></li>
      </ul>
    </nav>
    <a class="btn btn--primary header-cta" href="${ROUTES[lang].contact}">${esc(t.cta)}</a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mmenu" data-menu-btn><span class="menu-label">${esc(t.menu)}</span><span class="menu-lines" aria-hidden="true"></span></button>
  </div>
</header>
<div class="mobile-menu" id="mmenu" hidden data-menu>
  <nav aria-label="${esc(t.mobileNav)}"><ul>
    <li><a href="${ROUTES[lang].home}">${esc(t.nav.home)}</a></li>
    ${nav.map(([k, l]) => `<li><a href="${navHref(k)}">${esc(l)}</a></li>`).join("\n    ")}
    <li><a href="${ROUTES[lang].contact}">${esc(t.cta)}</a></li>
    <li class="mm-lang"><a href="${there}" hreflang="${other}" lang="${other}">${esc(t.switchTo)}</a></li>
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
      <span class="brand-crop brand-crop--footer"><img src="/assets/brand/bushyfam-logo-original.png" width="500" height="500" alt="${esc(S.brandName)}" loading="lazy"></span>
      <p class="muted footer-line">${esc(S.brandName)} · ${esc(tr(S, "location", lang))} · ${esc(tr(S, "reach", lang))}</p>
    </div>
    <nav aria-label="${esc(t.footerNav)}">
      <ul class="footer-links">
        <li><a href="${R.work}">${esc(t.nav.work)}</a></li>
        ${CAST.length ? `<li><a href="${R.cast}">${esc(t.nav.cast)}</a></li>` : ""}
        <li><a href="${R.studio}">${esc(t.nav.studio)}</a></li>
        <li><a href="${R.contact}">${esc(t.nav.contact)}</a></li>
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

function projectCard(p, lang, { headingLevel = 3 } = {}) {
  const hasVideo = (p.media || []).some((m) => m.type === "video");
  return `<a class="card" href="${hrefFor(lang, "project", p.slug)}" data-cat="${esc(p.category)}">
      <div class="tile${p.category === "video" ? " cover" : ""}">${img(p.cover.src, tr(p.cover, "alt", lang), { sizes: "(min-width: 900px) 30vw, 76vw" })}${hasVideo ? `<span class="play">${esc(T[lang].film)}</span>` : ""}</div>
      <div class="cap"><span class="cat">${esc(catLabel(p.category, lang))}</span><h${headingLevel} class="ttl">${esc(tr(p, "title", lang))}</h${headingLevel}><span class="client">${esc([p.client, p.year].filter(Boolean).join(" · "))}</span></div>
    </a>`;
}
const sourcesAttr = (v) => esc(JSON.stringify((v.sources || []).map((s) => ({ ...s, src: url(s.src) }))));

/* ---------- Seiten ---------- */
function pageHome(lang) {
  const t = T[lang], R = ROUTES[lang], H = S.hero, V = H.video;
  const featured = PROJECTS.filter((p) => p.featured).slice(0, 3);
  const logos = CLIENTS.filter((c) => c.logo);
  const E = S.ending && S.ending.enabled !== false && S.ending.video && (S.ending.video.sources || []).length ? S.ending.video : null;
  const SR = S.showreel && S.showreel.enabled && S.showreel.src ? S.showreel : null;
  const body = `
<section class="hero" data-hero style="--ar:${(V.width / V.height).toFixed(4)}" aria-labelledby="h-home">
  <div class="hero-copy" data-hero-copy>
    <div class="hero-copy-inner">
      <h1 class="hero-title" id="h-home"><span>${esc(tr(H, "line1", lang))}</span><span>${esc(tr(H, "line2", lang))}</span></h1>
      <p class="hero-text">${esc(tr(H, "text", lang))}</p>
      <div class="btn-row"><a class="btn btn--primary" href="${R.contact}">${esc(t.cta)}</a><a class="btn btn--ghost" href="${R.work}">${esc(t.seeWork)}</a></div>
    </div>
  </div>
  <div class="hero-scrub" data-hero-scrub>
    <div class="hero-stage">
      <figure class="hero-media" data-hero-media data-sources="${sourcesAttr(V)}">
        <img class="hero-poster" src="${esc(url(V.poster))}" width="${V.width}" height="${V.height}" alt="${esc(tr(V, "description", lang))}" fetchpriority="high" decoding="async">
        <video class="hero-video" muted playsinline preload="none" disablepictureinpicture disableremoteplayback aria-hidden="true" tabindex="-1" width="${V.width}" height="${V.height}"></video>
      </figure>
    </div>
  </div>
  ${tr(H, "outro", lang) ? `<div class="hero-outro" data-hero-outro><div class="hero-outro-stage"><p class="hero-outro-text">${esc(tr(H, "outro", lang))}</p></div></div>` : ""}
</section>

${featured.length ? `<section class="section" aria-labelledby="h-picks">
  <div class="wrap">
    <div class="head-row">
      <div><p class="eyebrow">${esc(t.nav.work)}</p><h2 class="h2" id="h-picks">${esc(tr(HOME, "workTitle", lang))}</h2></div>
      <a class="link-arrow" href="${R.work}">${esc(t.allWork)} <span aria-hidden="true">→</span></a>
    </div>
    <ul class="picks">
      ${featured.map((p) => `<li>${projectCard(p, lang)}</li>`).join("\n      ")}
    </ul>
    <p class="picks-more"><a class="btn btn--ghost" href="${R.work}">${esc(t.seeAllWork)}</a></p>
  </div>
</section>` : ""}

${SR ? `<section class="section showreel" aria-labelledby="h-reel">
  <div class="wrap">
    <div class="head-row"><h2 class="h2" id="h-reel">${esc(tr(SR, "title", lang))}${SR.duration ? ` <span class="muted">${esc(SR.duration)}</span>` : ""}</h2></div>
    <div class="clip-frame clip-frame--wide" data-clip data-src="${esc(url(SR.src))}">
      ${SR.poster ? img(SR.poster, "", { sizes: "100vw" }) : ""}
      <button class="clip-play" type="button" data-clip-play data-title="${esc(tr(SR, "title", lang))}"><span class="clip-play-icon" aria-hidden="true"></span><span>${esc(t.play)}</span><span class="vh">: ${esc(tr(SR, "title", lang))}</span></button>
    </div>
  </div>
</section>` : ""}

<section class="section" id="${t.servicesId}" aria-labelledby="h-svc" tabindex="-1">
  <div class="wrap">
    <p class="eyebrow" aria-hidden="true">${esc(t.nav.services)}</p>
    <h2 class="vh" id="h-svc">${esc(t.nav.services)}</h2>
    <ul class="acc" data-acc>
      ${(SERV.items || []).map((s, i) => `<li><h3><button type="button" aria-expanded="false" aria-controls="svc-${i}">${esc(tr(s, "title", lang))}<span class="pm" aria-hidden="true"></span></button></h3><p id="svc-${i}" hidden>${esc(tr(s, "text", lang))}</p></li>`).join("\n      ")}
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="h-about">
  <div class="wrap about">
    ${img(STU.portrait.src, tr(STU.portrait, "alt", lang), { cls: "about-img", sizes: "(min-width: 600px) 22rem, 90vw" })}
    <div>
      <p class="eyebrow">${esc(t.nav.studio)}</p>
      <h2 class="h2" id="h-about">${esc(STU.name)}</h2>
      <p class="role">${esc(tr(STU, "role", lang))}</p>
      <p class="body">${esc(tr(HOME, "aboutText", lang))}</p>
      <p class="more"><a class="link-arrow" href="${R.studio}">${esc(t.moreAbout)} <span aria-hidden="true">→</span></a></p>
    </div>
  </div>
</section>

${logos.length >= 5 ? `<section class="section clients" aria-labelledby="h-clients">
  <div class="wrap"><h2 class="eyebrow" id="h-clients">${esc(t.clients)}</h2>
    <ul class="client-row">${logos.map((c) => `<li>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">` : ""}${img(c.logo, c.name, { sizes: "160px" })}${c.url ? `<span class="vh"> ${esc(t.newTab)}</span></a>` : ""}</li>`).join("")}</ul>
  </div>
</section>` : ""}

<section class="section cta" aria-labelledby="h-cta">
  <div class="wrap">
    <h2 class="h2" id="h-cta">${esc(tr(HOME, "ctaTitle", lang))}</h2>
    <p class="lead">${esc(tr(HOME, "ctaText", lang))}</p>
    <div class="btn-row"><a class="btn btn--primary" href="${R.contact}">${esc(t.cta)}</a>${S.instagramUrl ? ext(S.instagramUrl, esc(S.instagramHandle || "Instagram"), lang) : ""}</div>
  </div>
</section>

${E ? `<section class="ending" data-ending style="--ar:${(E.width / E.height).toFixed(4)}" aria-label="${esc(t.ending)}">
  <div class="ending-track" data-ending-track>
    <div class="ending-stage">
      <figure class="ending-media" data-ending-media data-sources="${sourcesAttr(E)}">
        <img class="ending-poster" src="${esc(url(E.poster))}" width="${E.width}" height="${E.height}" alt="${esc(tr(E, "description", lang))}" loading="lazy" decoding="async">
        <video class="ending-video" muted playsinline preload="none" disablepictureinpicture disableremoteplayback aria-hidden="true" tabindex="-1" width="${E.width}" height="${E.height}"></video>
      </figure>
    </div>
  </div>
</section>` : ""}`;
  return layout({ lang, key: "home", title: tr(S.seo, "title", lang), description: tr(S.seo, "description", lang), body,
    scripts: ["hero-scrub.js", ...(E ? ["ending-scrub.js"] : []), ...(SR ? ["video-preview.js"] : [])], ogImage: V.poster });
}

function pageWork(lang) {
  const t = T[lang];
  const cats = CATEGORIES.map((c) => ({ ...c, n: PROJECTS.filter((p) => p.category === c.id).length })).filter((c) => c.n);
  const body = `
<section class="wrap page-head" aria-labelledby="h-work">
  <p class="eyebrow">${esc(t.portfolio)}</p>
  <h1 class="page-title" id="h-work">${esc(t.nav.work)}</h1>
  <p class="lead">${esc(t.workLead)}</p>
</section>
<section class="wrap work-list" aria-labelledby="h-work">
  ${cats.length > 1 ? `<div class="filters" role="group" aria-label="${esc(t.chooseCat)}" data-filters>
    <button class="filter" type="button" data-cat="all" aria-pressed="true">${esc(t.all)}<span class="n">${PROJECTS.length}</span></button>
    ${cats.map((c) => `<button class="filter" type="button" data-cat="${c.id}" aria-pressed="false">${esc(c[lang])}<span class="n">${c.n}</span></button>`).join("\n    ")}
  </div>
  <p class="vh" aria-live="polite" data-filter-status data-tpl="${esc(t.filterStatus)}" data-tpl-one="${esc(t.filterStatusOne)}"></p>` : ""}
  <ul class="grid" data-grid>
    ${PROJECTS.map((p) => `<li data-cat="${esc(p.category)}">${projectCard(p, lang, { headingLevel: 2 })}</li>`).join("\n    ")}
  </ul>
</section>`;
  return layout({ lang, key: "work", title: `${t.nav.work} – ${S.brandName}`, description: t.workLead, body, ogImage: PROJECTS[0]?.cover?.src });
}

function pageProject(p, lang, i) {
  const t = T[lang], R = ROUTES[lang];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const media = (p.media || []).map((m) => {
    if (m.type === "video") {
      const ttl = tr(m, "title", lang) || tr(p, "title", lang);
      const meta = [m.duration, m.audio === true ? t.withSound : m.audio === false ? t.noSound : ""].filter(Boolean).join(" · ");
      const dim = m.poster ? imageSize(m.poster) || {} : {};
      return `<li class="m m--video"><div class="clip-frame" style="--ar:${dim.w ? (dim.w / dim.h).toFixed(4) : "0.5625"}" data-clip data-src="${esc(url(m.src))}">
        ${m.poster ? img(m.poster, "", { sizes: "(min-width: 900px) 30vw, 80vw" }) : ""}
        <button class="clip-play" type="button" data-clip-play data-title="${esc(ttl)}"><span class="clip-play-icon" aria-hidden="true"></span><span>${esc(t.play)}</span><span class="vh">: ${esc(ttl)}</span></button>
      </div><p class="m-cap"><strong>${esc(ttl)}</strong>${meta ? ` <span>${esc(meta)}</span>` : ""}</p></li>`;
    }
    const cap = tr(m, "caption", lang);
    return `<li class="m m--image"><figure>${img(m.src, tr(m, "alt", lang), { sizes: "(min-width: 900px) 45vw, 92vw" })}${cap ? `<figcaption class="m-cap">${esc(cap)}</figcaption>` : ""}</figure></li>`;
  }).join("\n      ");
  const body = `
<article>
  <header class="wrap page-head project-head">
    <p class="eyebrow"><a class="crumb" href="${R.work}">${esc(t.nav.work)}</a> · ${metaLine(p, lang)}</p>
    <h1 class="page-title">${esc(tr(p, "title", lang))}</h1>
    ${tr(p, "summary", lang) ? `<p class="lead">${esc(tr(p, "summary", lang))}</p>` : ""}
  </header>
  ${paras(tr(p, "body", lang)).length ? `<div class="wrap project-body">${paras(tr(p, "body", lang)).map((x) => `<p>${esc(x)}</p>`).join("")}</div>` : ""}
  <section class="wrap project-media" aria-label="${esc(t.media)}">
    <ul class="media-grid${(p.media || []).every((m) => m.type === "video") ? " media-grid--video" : ""}">
      ${media}
    </ul>
  </section>
  <nav class="wrap project-next" aria-label="${esc(t.moreWork)}">
    ${next && next.slug !== p.slug ? `<a class="next-link" href="${hrefFor(lang, "project", next.slug)}"><span class="eyebrow">${esc(t.nextProject)}</span><span class="next-title">${esc(tr(next, "title", lang))} <span aria-hidden="true">→</span></span><span class="client">${esc(next.client || "")}</span></a>` : ""}
    <a class="link-arrow" href="${R.work}">${esc(t.allWork)} <span aria-hidden="true">→</span></a>
  </nav>
</article>
${ctaBlock(lang)}`;
  return layout({ lang, key: "project", slug: p.slug, title: `${tr(p, "title", lang)} – ${p.client ? p.client + " – " : ""}${S.brandName}`,
    description: tr(p, "summary", lang) || t.workLead, body, scripts: (p.media || []).some((m) => m.type === "video") ? ["video-preview.js"] : [], ogImage: p.cover.src });
}

const ctaBlock = (lang) => `<section class="section cta" aria-labelledby="h-cta2">
  <div class="wrap"><h2 class="h2" id="h-cta2">${esc(T[lang].ctaSmall)}</h2><div class="btn-row"><a class="btn btn--primary" href="${ROUTES[lang].contact}">${esc(T[lang].cta)}</a></div></div>
</section>`;

function personCard(p, lang, headingLevel = 3) {
  const ph = p.photos[0];
  return `<a class="card" href="${hrefFor(lang, "person", p.slug)}" data-cat="${esc(roleKey(p))}">
      <div class="tile cover">${img(ph.src, tr(ph, "alt", lang) || p.name, { sizes: "(min-width: 900px) 24vw, 45vw" })}</div>
      <div class="cap"><span class="cat">${esc(tr(p, "role", lang))}</span><h${headingLevel} class="ttl">${esc(p.name)}</h${headingLevel}>${p.city ? `<span class="client">${esc(p.city)}</span>` : ""}</div>
    </a>`;
}
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
</section>
<section class="wrap work-list">
  ${roles.length > 1 ? `<div class="filters" role="group" aria-label="${esc(t.chooseRole)}" data-filters>
    <button class="filter" type="button" data-cat="all" aria-pressed="true">${esc(t.all)}<span class="n">${CAST.length}</span></button>
    ${roles.map((r) => `<button class="filter" type="button" data-cat="${esc(r.id)}" aria-pressed="false">${esc(r.label)}<span class="n">${r.n}</span></button>`).join("\n    ")}
  </div>
  <p class="vh" aria-live="polite" data-filter-status data-tpl="${esc(t.castStatus)}" data-tpl-one="${esc(t.castStatusOne)}"></p>` : ""}
  <ul class="grid grid--cast" data-grid>
    ${CAST.map((p) => `<li data-cat="${esc(roleKey(p))}">${personCard(p, lang, 2)}</li>`).join("\n    ")}
  </ul>
</section>
${ctaBlock(lang)}`;
  return layout({ lang, key: "cast", title: `${t.nav.cast} – ${S.brandName}`, description: t.castLead, body, ogImage: CAST[0]?.photos?.[0]?.src });
}

function pagePerson(p, lang, i) {
  const t = T[lang], R = ROUTES[lang];
  const next = CAST[(i + 1) % CAST.length];
  const gallery = (p.photos || []).slice(1).map((ph) => `<li class="m m--image"><figure>${img(ph.src, tr(ph, "alt", lang) || p.name, { sizes: "(min-width: 900px) 45vw, 92vw" })}</figure></li>`).join("\n      ");
  const body = `
<article>
  <header class="wrap page-head person-head">
    <p class="eyebrow"><a class="crumb" href="${R.cast}">${esc(t.nav.cast)}</a> · ${esc(tr(p, "role", lang))}${p.city ? " · " + esc(p.city) : ""}</p>
    <h1 class="page-title">${esc(p.name)}</h1>
    ${tr(p, "text", lang) ? `<p class="lead">${esc(tr(p, "text", lang))}</p>` : ""}
    <div class="btn-row person-actions">
      <a class="btn btn--primary" href="${R.contact}?person=${encodeURIComponent(p.name)}">${esc(t.bookThis)}</a>
      ${p.instagram ? ext(p.instagram, esc(p.instagramHandle || "Instagram"), lang) : ""}
    </div>
  </header>
  <section class="wrap project-media" aria-label="${esc(t.photos)}">
    <ul class="media-grid">
      <li class="m m--image"><figure>${img(p.photos[0].src, tr(p.photos[0], "alt", lang) || p.name, { sizes: "(min-width: 900px) 45vw, 92vw", lazy: false })}</figure></li>
      ${gallery}
    </ul>
  </section>
  <nav class="wrap project-next" aria-label="${esc(t.nav.cast)}">
    ${next && next.slug !== p.slug ? `<a class="next-link" href="${hrefFor(lang, "person", next.slug)}"><span class="eyebrow">${esc(t.nextPerson)}</span><span class="next-title">${esc(next.name)} <span aria-hidden="true">→</span></span><span class="client">${esc(tr(next, "role", lang))}</span></a>` : ""}
    <a class="link-arrow" href="${R.cast}">${esc(t.allCast)} <span aria-hidden="true">→</span></a>
  </nav>
</article>`;
  return layout({ lang, key: "person", slug: p.slug, title: `${p.name} – ${tr(p, "role", lang)} – ${S.brandName}`,
    description: tr(p, "text", lang) || `${p.name} – ${tr(p, "role", lang)}`, body, ogImage: p.photos[0].src });
}

function pageStudio(lang) {
  const t = T[lang];
  const body = `
<section class="wrap page-head" aria-labelledby="h-studio">
  <p class="eyebrow">${esc(t.nav.studio)}</p>
  <h1 class="page-title" id="h-studio">${esc(STU.name)}</h1>
  <p class="lead">${esc(tr(STU, "lead", lang))}</p>
</section>
<section class="wrap studio-top">
  ${img(STU.portrait.src, tr(STU.portrait, "alt", lang), { sizes: "(min-width: 900px) 26rem, 92vw" })}
  <div>${(STU.paragraphs || []).map((x) => `<p class="body">${esc(pick(x, lang))}</p>`).join("")}</div>
</section>
${(STU.stations || []).length ? `<section class="section" aria-labelledby="h-st">
  <div class="wrap">
    <div class="head-row"><h2 class="h2" id="h-st">${esc(tr(STU, "stationsTitle", lang))}</h2></div>
    <ul class="stations">
      ${STU.stations.map((s) => `<li><div>${tr(s, "year", lang) ? `<p class="year">${esc(tr(s, "year", lang))}</p>` : ""}<h3>${esc(tr(s, "title", lang))}</h3><p class="t">${esc(tr(s, "text", lang))}</p>${s.link && s.link.url ? `<p class="st-link">${ext(s.link.url, esc(tr(s.link, "label", lang)), lang)}${tr(s.link, "note", lang) ? `<span class="note-link">${esc(tr(s.link, "note", lang))}</span>` : ""}</p>` : ""}</div>${s.image && s.image.src ? img(s.image.src, tr(s.image, "alt", lang), { sizes: "(min-width: 900px) 26rem, 92vw" }) : ""}</li>`).join("\n      ")}
    </ul>
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
  const t = T[lang], f = t.form, live = !!(S.form && S.form.enabled);
  const field = (id, label, type, req, extra = "") => `<div class="field"><label for="f-${id}">${esc(label)} ${req ? `<span aria-hidden="true">*</span><span class="vh">(${esc(f.required)})</span>` : `<span class="opt">(${esc(f.optional)})</span>`}</label>${type === "textarea" ? `<textarea id="f-${id}" name="${id}"${req ? " required" : ""} aria-describedby="e-${id}"${extra}></textarea>` : `<input id="f-${id}" name="${id}" type="${type}"${req ? " required" : ""} aria-describedby="e-${id}"${extra}>`}<p class="err" id="e-${id}" hidden></p></div>`;
  const body = `
<section class="wrap page-head" aria-labelledby="h-contact">
  <p class="eyebrow">${esc(t.nav.contact)}</p>
  <h1 class="page-title" id="h-contact">${esc(tr(CON, "title", lang))}</h1>
</section>
<section class="wrap contact-grid">
  <div>
    <p class="lead">${esc(tr(CON, "intro", lang))}</p>
    ${S.instagramUrl ? `<p class="muted direct-label">${esc(t.direct)}</p><p>${ext(S.instagramUrl, esc(S.instagramHandle || "Instagram"), lang, "link-arrow link-big")}</p>` : ""}
    ${S.email ? `<p><a class="link-arrow link-big" href="mailto:${esc(S.email)}">${esc(S.email)}</a></p>` : ""}
  </div>
  <form class="form" name="kontakt" method="POST" data-netlify="true" netlify-honeypot="bot-field" novalidate data-form data-live="${live}" data-lang="${lang}">
    <input type="hidden" name="form-name" value="kontakt">
    <input type="hidden" name="sprache" value="${lang}">
    <p class="hp" aria-hidden="true"><label>${esc(f.hp)} <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
    <div class="form-summary" tabindex="-1" hidden data-summary></div>
    ${field("name", f.name, "text", true, ' autocomplete="name"')}
    ${field("email", f.email, "email", true, ' autocomplete="email" inputmode="email"')}
    ${field("unternehmen", f.company, "text", false, ' autocomplete="organization"')}
    <fieldset class="field"><legend>${esc(f.services)} <span class="opt">(${esc(f.optional)})</span></legend><div class="chips">
      ${(CON.options || []).map((o) => `<label class="chip"><input type="checkbox" name="leistungen" value="${esc(o.de)}"><span class="box" aria-hidden="true"></span>${esc(pick(o, lang))}</label>`).join("\n      ")}
    </div></fieldset>
    ${field("nachricht", f.message, "textarea", true)}
    <div class="field-row">${field("zeitraum", f.timeframe, "text", false)}${field("budget", f.budget, "text", false)}</div>
    <p class="pv">${live ? `${esc(f.privacyNote)} <a href="${ROUTES[lang].privacy}">${esc(t.privacy)}</a>.` : `<strong>${esc(f.previewTitle)}</strong> ${esc(f.previewText)}`}</p>
    <div><button class="btn btn--primary" type="submit">${esc(f.submit)}</button></div>
    <div class="result" role="status" aria-live="polite" data-result></div>
  </form>
</section>
<script type="application/json" id="form-i18n">${JSON.stringify(f).replace(/</g, "\\u003c")}</script>`;
  return layout({ lang, key: "contact", title: `${t.nav.contact} – ${S.brandName}`, description: tr(CON, "intro", lang), body, scripts: ["contact.js"] });
}

function pageLegal(lang, key) {
  const t = T[lang], field = key === "imprint" ? "imprint" : "privacy";
  const text = tr(LEGAL, field, lang);
  const blocks = paras(text).map((b) => b.startsWith("## ") ? `<h2>${esc(b.slice(3))}</h2>` : `<p>${esc(b).replace(/\n/g, "<br>")}</p>`).join("\n");
  const body = `
<section class="wrap page-head" aria-labelledby="h-legal">
  <h1 class="page-title page-title--sm" id="h-legal">${esc(t[field])}</h1>
</section>
<section class="wrap legal">${blocks || `<p class="lead">${esc(t.inPreparation)}</p>`}</section>`;
  return layout({ lang, key, title: `${t[field]} – ${S.brandName}`, description: `${t[field]} – ${S.brandName}`, body });
}

function page404() {
  const body = `
<section class="wrap page-head" aria-labelledby="h-404">
  <p class="eyebrow">404</p>
  <h1 class="page-title" id="h-404">${esc(T.de.notFound)}</h1>
  <p class="lead">${esc(T.de.notFoundText)}</p>
  <div class="btn-row" style="margin-top:2rem"><a class="btn btn--primary" href="/">${esc(T.de.backHome)}</a><a class="btn btn--ghost" href="/en/" lang="en">${esc(T.en.backHome)}</a></div>
</section>`;
  return layout({ lang: "de", key: "home404", title: `404 – ${S.brandName}`, description: T.de.notFoundText, body }).replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"');
}

/* ---------- Schreiben ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
const written = [];
const write = (route, html) => {
  const file = path.join(OUT, route.endsWith("/") ? route + "index.html" : route);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  written.push(route);
};
ROUTES.de.home404 = ROUTES.en.home404 = "/404.html";
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
  write(R.imprint, pageLegal(lang, "imprint"));
  write(R.privacy, pageLegal(lang, "privacy"));
}
write("/404.html", page404());

// Statische Dateien übernehmen (nur was die Seite braucht)
for (const dir of ["assets", "css", "admin"]) fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true });
fs.mkdirSync(path.join(OUT, "js"), { recursive: true });
for (const f of ["site.js", "contact.js", "hero-scrub.js", "ending-scrub.js", "video-preview.js"]) fs.copyFileSync(path.join(ROOT, "js", f), path.join(OUT, "js", f));
// Inhalte für den Admin nicht öffentlich ausliefern ist nicht nötig – sie liegen ohnehin im Repository.

// robots.txt und sitemap.xml
const site = (S.siteUrl || "").replace(/\/+$/, "");
fs.writeFileSync(path.join(OUT, "robots.txt"), S.launch
  ? `User-agent: *\nAllow: /\nDisallow: /admin/\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ""}`
  : "# Vorschau – noch nicht für Suchmaschinen freigegeben\nUser-agent: *\nDisallow: /\n");
if (site) {
  const urls = written.filter((r) => r.endsWith("/"));
  fs.writeFileSync(path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
}
console.log(`✓ Build fertig: ${written.length} Seiten, ${PROJECTS.length} Projekte, ${CAST.length} in der Besetzung, Sprachen: ${LANGS.join(", ")}${S.launch ? "" : " (noindex – Vorschau)"}`);
