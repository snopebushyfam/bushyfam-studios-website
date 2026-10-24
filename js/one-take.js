/*
 * BushyFam Studios – Startseite „One Take“.
 * Szenen bleiben beim Scrollen stehen und laufen mit der Scrollposition mit (ohne das Scrollen abzufangen).
 * Ohne dieses Skript oder mit reduzierter Bewegung stehen alle Abschnitte ruhig untereinander.
 * Ton gibt es nur nach Klick auf „Ton an“; er wird im Browser erzeugt, es werden keine Dateien geladen.
 */
(function () {
  "use strict";
  var html = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeIn = function (t) { return t * t * t; };
  var L = {};
  try { L = JSON.parse($("#ot-i18n").textContent); } catch (e) {}
  var probe = document.createElement("div"); probe.style.cssText = "position:fixed;left:0;top:0;width:1px;height:100svh;visibility:hidden;pointer-events:none"; document.body.appendChild(probe);
  var svh = function () { return probe.offsetHeight || innerHeight; };
  var W = innerWidth, H = svh(), phone = W < 768;
  html.classList.add("ot-js");
  var live = !reduced;

  /* ---------- Die beiden Filme ----------
     Bildfolge auf einer Zeichenfläche. Zwischen zwei Bildern wird passend zur Scrollposition weich
     übergeblendet – das wirkt flüssiger als 24 Bilder pro Sekunde und springt nie, auch nicht während
     des Ladens (dann wird zwischen den nächsten schon geladenen Bildern übergeblendet).
     Geladen wird grob nach fein: jedes 8., dann jedes 4., 2. und zuletzt jedes Bild. */
  function film(canvas) {
    var f = { poster: new Image(), imgs: [], ok: [], count: 0 };
    f.poster.onload = dirty; f.poster.src = canvas.getAttribute("data-poster");
    var small = phone || matchMedia("(pointer: coarse)").matches;
    var F = null;
    try { F = JSON.parse(canvas.getAttribute(small ? "data-frames-m" : "data-frames-d") || '""'); } catch (e) {}
    if (!F) try { F = JSON.parse(canvas.getAttribute("data-frames-m") || '""'); } catch (e) {}
    if (!F || !live) return f;
    f.count = F.count;
    var order = [], seen = {};
    [8, 4, 2, 1].forEach(function (step) { for (var i = 0; i < F.count; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); } if (!seen[F.count - 1]) { seen[F.count - 1] = 1; order.push(F.count - 1); } });
    /* Erst das Grobraster (jedes 8. Bild) zügig, danach den Rest in kleinen Portionen, wenn der Browser Luft hat –
       sonst blockiert das Entpacken gleich nach dem Öffnen das erste Scrollen */
    var coarse = Math.ceil(F.count / 8) + 1, next = 0, running = 0;
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 40); };
    function pump() {
      if (next >= coarse && running > 0) return;
      if (next >= coarse) { idle(function () { launch(2); }, { timeout: 300 }); return; }
      launch(4);
    }
    function launch(max) {
      while (running < max && next < order.length) (function (k) {
        running++;
        var im = new Image(); f.imgs[k] = im;
        var done = function () { f.ok[k] = true; running--; dirty(); pump(); };
        im.onload = function () { if (im.decode) im.decode().then(done, done); else done(); };
        im.onerror = function () { running--; pump(); };
        im.src = F.base + "f-" + String(k + 1).padStart(3, "0") + ".webp";
      })(order[next++]);
    }
    pump();
    return f;
  }
  /* Zwei Nachbarbilder und Mischanteil zur Stelle frac (0 … 1) */
  function frameAt(f, frac) {
    if (f.count) {
      var x = clamp(frac) * (f.count - 1), a = -1, b = -1;
      for (var i = Math.floor(x); i >= 0; i--) if (f.ok[i]) { a = i; break; }
      for (var j = Math.ceil(x); j < f.count; j++) if (f.ok[j]) { b = j; break; }
      if (a < 0 && b >= 0) a = b;
      if (b < 0 && a >= 0) b = a;
      /* Nur direkte Nachbarn überblenden; größere Lücken (während des Ladens) würden doppelt belichtet aussehen */
      if (a >= 0 && b - a > 2) { var n = x - a < b - x ? a : b; return { a: f.imgs[n], b: f.imgs[n], t: 0 }; }
      if (a >= 0) return { a: f.imgs[a], b: f.imgs[b], t: b > a ? (x - a) / (b - a) : 0 };
    }
    return f.poster.complete && f.poster.naturalWidth ? { a: f.poster, b: f.poster, t: 0 } : null;
  }
  var dimW = function (m) { return (m.a || m).naturalWidth; }, dimH = function (m) { return (m.a || m).naturalHeight; };
  function sizeCanvas(c) {
    var dpr = Math.min(devicePixelRatio || 1, 2), w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }
  function draw(c, fr, s, fx, fy, tx, ty) {
    var ctx = c.getContext("2d"), dpr = c.width / (c.clientWidth || 1);
    var w = dimW(fr) * s, h = dimH(fr) * s, x = (tx - fx * w) * dpr, y = (ty - fy * h) * dpr;
    ctx.globalAlpha = 1; ctx.fillStyle = "#050506"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(fr.a, x, y, w * dpr, h * dpr);
    if (fr.b && fr.b !== fr.a && fr.t > 0.02) { ctx.globalAlpha = fr.t; ctx.drawImage(fr.b, x, y, w * dpr, h * dpr); ctx.globalAlpha = 1; }
    return ctx;
  }
  var cover = function (img, cw, ch) { return Math.max(cw / dimW(img), ch / dimH(img)); };

  /* ---------- Filmkorn ---------- */
  var grainUrl = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 180; var x = c.getContext("2d"), d = x.createImageData(180, 180);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); return c.toDataURL();
  })();
  $$(".ot-grain, .ot-static").forEach(function (g) { g.style.backgroundImage = "url(" + grainUrl + ")"; });

  /* Ton gibt es nicht mehr – Platzhalter, damit Aufrufe ins Leere gehen */
  var sound = { blip: function () {}, update: function () {}, whoosh: function () {}, duck: function () {} };

  /* ---------- Szenen ---------- */
  var scenes = [];
  var scene = function (el, render, rest) { if (el) scenes.push({ el: el, render: render, rest: rest, last: -1 }); };
  function dirty() { scenes.forEach(function (s) { s.last = -1; }); }

  /* Einstieg: Original-Film (js/hero-scrub.js) – hier nichts mehr zu tun */
  var hero = null, hc = null, heroFilm = null;

  /* 2 · Arbeiten im All: die Kamera hält an jedem Projekt kurz an */
  var space = $(".ot-space"), stars = $(".ot-stars"), items = $$(".ot-space .ot-item");
  var zs = items.map(function (i) { return +i.getAttribute("data-z"); }), n = items.length;
  var stops = zs.map(function (z, k) { return k === 0 ? 0 : k === n - 1 ? -z : -z - 260; });
  var vel = 0, warpBoost = 0, warpOut = $(".ot-warp-out");
  function spaceRender(p) {
    warpBoost = seg(p, 0.9, 1) * 70;
    warpOut.style.opacity = seg(p, 0.95, 1);
    p = Math.min(p / 0.92, 1);
    var f = p * (n - 1), k = Math.min(Math.floor(f), n - 2), t = f - k;
    var cam = lerp(stops[k], stops[k + 1], ease(clamp((t - 0.14) / 0.72)));
    items.forEach(function (it, i) {
      var rel = zs[i] + cam, xf = phone ? 0 : +it.getAttribute("data-x");
      var o = clamp(rel > -120 ? 1 - (rel + 120) / 420 : (rel + 1800) / 600); /* erst sichtbar, wenn die vorige Station weg ist */
      it.style.opacity = o;
      it.style.visibility = o < 0.01 ? "hidden" : "visible";
      it.style.pointerEvents = o > 0.6 ? "auto" : "none";
      it.style.transform = "translate(-50%,-50%) translate3d(" + xf * W + "px,0," + rel + "px)";
    });
  }
  if (space && n > 1) scene(space, spaceRender, null);

  /* Sternenfeld: zieht sich beim schnellen Scrollen zu Streifen */
  if (space && stars) (function () {
    var ctx = stars.getContext("2d"), on = false, speed = 2, dpr = 1, N = phone ? 220 : 360, pts = [];
    var reset = function (s, far) { s.x = (Math.random() * 2 - 1) * 1600; s.y = (Math.random() * 2 - 1) * 1000; s.z = far ? 2000 : Math.random() * 2000 + 1; };
    for (var i = 0; i < N; i++) { var s = {}; reset(s); pts.push(s); }
    var size = function () { sizeCanvas(stars); dpr = stars.width / (stars.clientWidth || 1); };
    new IntersectionObserver(function (e) { on = e[0].isIntersecting && live; if (on) { size(); tick(); } }).observe(space);
    addEventListener("resize", function () { if (on) size(); });
    function tick() {
      if (!on) return;
      var w = stars.width, h = stars.height, cx = w / 2, cy = h / 2, f = 420 * dpr * (phone ? 0.7 : 1);
      speed = lerp(speed, 1.6 + Math.min(60, Math.abs(vel) * 0.8) + warpBoost, 0.06);
      ctx.fillStyle = "rgba(5,5,6,.6)"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#f3f0ea"; ctx.lineCap = "round";
      for (var j = 0; j < pts.length; j++) {
        var s = pts[j], pz = s.z; s.z -= speed;
        if (s.z < 1) { reset(s, true); continue; }
        var x1 = cx + s.x / pz * f, y1 = cy + s.y / pz * f, x2 = cx + s.x / s.z * f, y2 = cy + s.y / s.z * f;
        if (x2 < 0 || x2 > w || y2 < 0 || y2 > h) { reset(s, true); continue; }
        var a = clamp(1 - s.z / 2000);
        ctx.globalAlpha = a * 0.8; ctx.lineWidth = Math.max(0.6, a * 2.2 * dpr);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }
  })();


  /* ---------- Geräte im All: Feed, Leinwand, Kartenstapel, Bullauge ----------
     Laufen nur, solange ihre Station sichtbar ist; sonst pausieren alle Videos. */
  var play = function (v) { if (!v) return; if (v.preload !== "auto") v.preload = "auto"; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); };
  var devs = $$("[data-dev]").map(function (el) {
    var d = { el: el, kind: el.getAttribute("data-dev"), item: el.closest(".ot-item"), on: false, i: 0, last: 0 };
    if (d.kind === "feed") { d.track = $(".ot-feed-track", el); d.slides = $$(".ot-feed-item", el); d.bar = $(".ot-feed-bar i", el); d.heart = $(".ot-feed-ui span", el); d.period = 2400; }
    if (d.kind === "cinema") { d.slides = $$(".ot-cine-shot", el); d.period = 3200; }
    if (d.kind === "cards") { d.slides = $$(".ot-card", el); d.period = 2200; }
    if (d.kind === "porthole") { d.slides = [el]; d.period = 0; }
    return d;
  });
  var vidOf = function (node) { return node && node.querySelector("video"); };
  function showSlide(d) {
    var n = d.slides.length;
    if (d.kind === "feed") {
      d.track.style.transform = "translateY(" + (-d.i * 100) + "%)";
      d.slides.forEach(function (s, k) { var v = vidOf(s); if (!v) return; if (k === d.i) { v.currentTime = 0; play(v); } else v.pause(); });
      if (d.bar) { d.bar.style.transition = "none"; d.bar.style.width = "0"; void d.bar.offsetWidth; d.bar.style.transition = "width " + d.period + "ms linear"; d.bar.style.width = "100%"; }
      if (d.heart && d.i % 2) { d.heart.classList.add("pop"); setTimeout(function () { d.heart.classList.remove("pop"); }, 700); }
    } else if (d.kind === "cinema") {
      d.slides.forEach(function (s, k) { s.classList.toggle("is-on", k === d.i); var v = vidOf(s); if (!v) return; if (k === d.i) { v.currentTime = 0; play(v); } else v.pause(); });
    } else if (d.kind === "cards") {
      d.slides.forEach(function (s, k) { s.setAttribute("data-pos", String((k - d.i + n) % n)); });
    } else if (d.kind === "porthole") { play(vidOf(d.el)); }
  }
  function devVisible(d) {
    if (document.hidden) return false;
    if (live && space && space.classList.contains("is-live")) return parseFloat(d.item.style.opacity || "0") > 0.5 && d.item.style.visibility !== "hidden";
    var r = d.el.getBoundingClientRect(); return r.bottom > 0 && r.top < H;
  }
  if (devs.length && !reduced) setInterval(function () {
    var now = Date.now();
    devs.forEach(function (d) {
      var vis = devVisible(d);
      if (vis && !d.on) { d.on = true; d.last = now; showSlide(d); }
      else if (!vis && d.on) { d.on = false; $$("video", d.el).forEach(function (v) { v.pause(); }); if (d.bar) { d.bar.style.transition = "none"; d.bar.style.width = "0"; } }
      else if (vis && d.period && now - d.last >= d.period) { d.last = now; d.i = (d.i + 1) % d.slides.length; showSlide(d); }
    });
  }, 150);

  /* 4 · Besetzung: der Ring dreht sich mit */
  var cast = $(".ot-cast"), figs = $$(".ot-ring li"), who = $(".ot-who"), ring = $(".ot-ring"), R = 0, lastWho = 0;
  var names = figs.map(function (f) { return f.querySelector(".ot-ring-name").textContent; });
  var roles = figs.map(function (f) { return f.getAttribute("data-role") || ""; });
  function castLayout() {
    if (!ring) return;
    var cw = phone ? Math.min(W * 0.46, 230) : Math.min(W * 0.19, 300);
    ring.style.setProperty("--cw", cw + "px");
    R = cw * (phone ? 1.5 : 1.75);
  }
  function castRender(p) {
    var step = 360 / figs.length, f = p * (figs.length - 1), k = Math.min(Math.floor(f), figs.length - 2), t = f - k;
    var pos = k + ease(clamp((t - 0.15) / 0.7));
    ring.style.transform = "rotateX(-4deg)";
    figs.forEach(function (fg, i) {
      var a = (i - pos) * step; a = ((a + 540) % 360) - 180;
      var rad = a * Math.PI / 180, c = Math.cos(rad);
      fg.style.transform = "translate3d(" + Math.sin(rad) * R + "px,0," + (c - 1) * R + "px) rotateY(" + a * 0.55 + "deg)";
      fg.style.opacity = c > 0 ? 0.18 + 0.82 * Math.pow(c, 2.2) : 0.06;
      fg.style.zIndex = Math.round(c * 100) + 100;
      fg.style.pointerEvents = c > 0.9 ? "auto" : "none";
    });
    var w = Math.round(f);
    if (w !== lastWho) {
      lastWho = w;
      who.textContent = names[w]; var sm = document.createElement("small"); sm.textContent = roles[w]; who.appendChild(sm);
      if (who.animate) who.animate([{ transform: "translateY(28px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 600, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
  }
  if (cast && figs.length > 1) scene(cast, castRender, null);

  /* 7 · Ausstieg: aus der Pupille hinaus zum UFO */
  var exit = $(".ot-exit"), ec = $('[data-ot-canvas="exit"]'), front = $(".ot-exit .ot-front"), cta = $(".ot-cta"), egrain = $(".ot-exit .ot-grain");
  var exitFilm = null;
  function exitRender(p) {
    var img = exitFilm && frameAt(exitFilm, seg(p, 0.02, 0.8));
    if (img) {
      var sc = cover(img, W, H) * lerp(2.4, 1, ease(seg(p, 0, 0.14)));
      var sf = Math.min(W, H * (phone ? 0.5 : 0.42)) / dimW(img) * (phone ? 0.9 : 1);
      var k = ease(seg(p, 0.5, 0.86)), s = lerp(sc, sf, k), cy = lerp(H / 2, H * (phone ? 0.46 : 0.5), k);
      var ctx = draw(ec, img, s, 0.5, 0.52, W / 2, cy);
      if (k > 0) {
        var dpr = ec.width / (ec.clientWidth || 1), size = dimW(img) * s * dpr;
        var g = ctx.createRadialGradient(W / 2 * dpr, cy * dpr, size * 0.36, W / 2 * dpr, cy * dpr, size * 0.52);
        g.addColorStop(0, "rgba(5,5,6,0)"); g.addColorStop(1, "rgba(5,5,6," + k + ")");
        ctx.fillStyle = g; ctx.fillRect(0, 0, ec.width, ec.height);
      }
    }
    front.style.opacity = 1 - seg(p, 0, 0.06);
    var c = seg(p, 0.8, 0.93);
    cta.style.opacity = c; cta.style.transform = "translateY(" + (1 - c) * 30 + "px)";
    cta.style.pointerEvents = c > 0.5 ? "" : "none";
    if (egrain) egrain.style.opacity = 0.055 * (1 - c);
  }
  if (exit && ec) scene(exit, exitRender, function () { exitRender(1); });

  /* Iris-Blende am Studio-Foto */
  var iris = $("[data-ot-iris]");
  function irisRender() {
    if (!iris) return;
    var r = iris.getBoundingClientRect(), p = clamp((H - r.top) / (H * 0.85));
    iris.style.clipPath = "circle(" + lerp(6, 75, ease(p)) + "% at 50% 45%)";
    if (iris.firstElementChild) iris.firstElementChild.style.transform = "scale(" + lerp(1.3, 1.02, ease(p)) + ")";
  }

  /* Wortmarke exakt auf Breite */
  function fit() {
    $$(".ot-wordmark, .ot-fwm").forEach(function (el) {
      var host = el.classList.contains("ot-wordmark") ? el.closest(".ot-stage") : document.body;
      var m = parseFloat(getComputedStyle(el.classList.contains("ot-wordmark") ? el : el).marginLeft) || parseFloat(getComputedStyle(el).left) || 0;
      if (el.classList.contains("ot-wordmark")) m = parseFloat(getComputedStyle(el).left) || 0;
      el.style.fontSize = "100px";
      el.style.fontSize = (100 * (host.clientWidth - 2 * m) / el.getBoundingClientRect().width) + "px";
    });
  }
  function layout() {
    W = innerWidth; H = svh(); phone = W < 768;
    [hc, ec].forEach(function (c) { if (c) sizeCanvas(c); });
    castLayout(); fit(); dirty();
  }

  if (live) scenes.forEach(function (s) { s.el.classList.add("is-live"); });
  layout();
  if (hc) heroFilm = film(hc);
  if (ec) {
    if (!live || !("IntersectionObserver" in window)) exitFilm = film(ec);
    else new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { exitFilm = film(ec); ob.disconnect(); } }, { rootMargin: "200% 0px" }).observe(exit);
  }

  var lenis = null;
  if (live && fine && window.Lenis) lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  function go(y, dur) { if (lenis) lenis.scrollTo(y, { duration: dur || 1.6 }); else scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" }); }

  /* Kopfleiste: beim Runterscrollen weg, beim Hochscrollen da */
  var header = $("[data-header]");
  var lastY = scrollY, navY = scrollY;
  var pending = $$("[data-ot-reveal]");
  function frame(t) {
    if (lenis) lenis.raf(t);
    var y = scrollY; vel = lerp(vel, y - lastY, 0.3); lastY = y;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i], r = s.el.getBoundingClientRect();
      if (!live) { if (s.last < 0 && s.rest) { s.last = 1; s.rest(); } continue; }
      if ((r.bottom < -50 || r.top > H + 50) && s.last >= 0) continue;
      var p = clamp(-r.top / (r.height - H));
      if (Math.abs(p - s.last) > 0.0003 || s.last < 0) { s.last = p; s.render(p); }
    }
    if (live) irisRender();
    html.classList.toggle("ot-past", y > H * 0.9);
    if (header) {
      header.classList.toggle("solid", y > H * 0.6);
      if (Math.abs(y - navY) > 24) { header.classList.toggle("ot-away", y > navY && y > H && !document.querySelector("[data-menu]:not([hidden])")); navY = y; }
    }
    for (var j = pending.length - 1; j >= 0; j--) if (pending[j].getBoundingClientRect().top < H * 0.9) { pending[j].classList.add("in"); pending.splice(j, 1); }
    hud(y);
    if (hero) sound.update(vel, seg(-hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight - H), 0, 1));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  /* iOS meldet beim Ein-/Ausklappen der Adressleiste ständig eine neue Größe: nur bei echter Änderung neu aufbauen */
  var lastW = innerWidth, lastH = svh();
  addEventListener("resize", function () {
    if (innerWidth === lastW && Math.abs(svh() - lastH) < 2) return;
    lastW = innerWidth; lastH = svh(); layout(); buildTimeline();
  });
  addEventListener("load", function () { fit(); buildTimeline(); });
  if (document.fonts) document.fonts.ready.then(function () { fit(); buildTimeline(); });

  /* ---------- Zeitleiste: Timecode, Kapitel, Springen ---------- */
  var tc = $(".ot-tl-tc"), chEl = $(".ot-tl-ch"), track = $("[data-ot-track]"), fill = $(".ot-tl-fill"), headEl = $(".ot-tl-head");
  var chapters = $$("[data-chapter]"), lastCh = "";
  function chapterY(c) {
    if (c.classList.contains("ot-space")) return c.offsetTop + (c.offsetHeight - H) * 0.02;
    if (c.classList.contains("ot-exit")) return c.offsetTop + (c.offsetHeight - H) * 0.25;
    return c.offsetTop;
  }
  function buildTimeline() {
    if (!track) return;
    $$("button", track).forEach(function (b) { b.remove(); });
    var max = html.scrollHeight - H;
    chapters.forEach(function (c) {
      var y = chapterY(c), b = document.createElement("button");
      b.type = "button"; b.style.left = (clamp(y / max) * 100) + "%";
      var i = document.createElement("i"), sp = document.createElement("span"); sp.textContent = c.getAttribute("data-chapter");
      b.appendChild(i); b.appendChild(sp);
      b.setAttribute("aria-label", (L.jumpTo || "") + " " + c.getAttribute("data-chapter"));
      b.addEventListener("click", function (e) { e.stopPropagation(); go(chapterY(c)); });
      track.appendChild(b);
    });
  }
  if (track) track.addEventListener("click", function (e) { var r = track.getBoundingClientRect(); go(clamp((e.clientX - r.left) / r.width) * (html.scrollHeight - H)); });
  function hud(y) {
    if (!tc) return;
    var max = html.scrollHeight - H, f = max > 0 ? clamp(y / max) : 0;
    var fr = Math.floor(f * 96 * 25), pad = function (v) { return String(v).padStart(2, "0"); };
    tc.textContent = pad(Math.floor(fr / 90000)) + ":" + pad(Math.floor(fr / 1500) % 60) + ":" + pad(Math.floor(fr / 25) % 60) + ":" + pad(fr % 25);
    fill.style.width = headEl.style.left = (f * 100) + "%";
    var cur = chapters[0];
    for (var i = 0; i < chapters.length; i++) if (chapters[i].getBoundingClientRect().top < H * 0.5) cur = chapters[i];
    var name = cur ? cur.getAttribute("data-chapter") : "";
    if (name !== lastCh) { if (lastCh) sound.blip(880); lastCh = name; chEl.textContent = name; }
  }

  /* Anker auf der Startseite: weiche Fahrt (Leistungen aus dem Menü springen in den Monitor) */
  $$('a[href*="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var u = new URL(a.href, location.href);
      if (u.pathname !== location.pathname || !u.hash || u.hash.length < 2) return;
      var el = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (!el) return;
      e.preventDefault();
      var y = el.getBoundingClientRect().top + scrollY;
      if (el.classList.contains("ot-exit")) y = el.offsetTop + el.offsetHeight - H;
      if (el.classList.contains("ot-space")) y = el.offsetTop + (el.offsetHeight - H) * 0.02;
      go(y, 1.8);
    });
  });

  /* ---------- Zeiger mit Beschriftung, Karten neigen sich ---------- */
  if (fine) {
    var dot = $(".ot-cur"), rg = $(".ot-cur-ring"), lab = rg && $("span", rg);
    var mx = W / 2, my = H / 2, rx = mx, ry = my, pics = $$(".ot-space .ot-pic");
    addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY; html.classList.add("ot-moved");
      if (dot) dot.style.transform = "translate(" + mx + "px," + my + "px)";
      if (live) { var ryy = (mx / W - 0.5) * 16, rxx = -(my / H - 0.5) * 12; pics.forEach(function (pc) { pc.style.setProperty("--rx", rxx + "deg"); pc.style.setProperty("--ry", ryy + "deg"); }); }
    });
    (function loop() { rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18); if (rg) rg.style.transform = "translate(" + rx + "px," + ry + "px)"; requestAnimationFrame(loop); })();
    document.addEventListener("pointerover", function (e) { var t = e.target.closest("[data-cursor]"); if (t && rg) { lab.textContent = t.getAttribute("data-cursor"); rg.classList.add("big"); } });
    document.addEventListener("pointerout", function (e) { var t = e.target.closest("[data-cursor]"); if (t && rg && !t.contains(e.relatedTarget)) rg.classList.remove("big"); });
  }

  /* ---------- Showreel ---------- */
  var reel = $("[data-ot-reel-box]"), reelVid = $("[data-ot-reel-video]"), reelFrom = null;
  function openReel(e) {
    if (!reel) return;
    reelFrom = e && e.currentTarget;
    reel.hidden = false; if (lenis) lenis.stop(); sound.duck(true);
    reelVid.currentTime = 0; var pr = reelVid.play(); if (pr && pr.catch) pr.catch(function () {});
    $("[data-ot-reel-close]").focus();
  }
  function closeReel() { reelVid.pause(); reel.hidden = true; if (lenis) lenis.start(); sound.duck(false); if (reelFrom) reelFrom.focus(); }
  $$("[data-ot-reel]").forEach(function (b) { b.addEventListener("click", openReel); });
  if (reel) {
    $("[data-ot-reel-close]").addEventListener("click", closeReel);
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !reel.hidden) closeReel(); });
  }

  /* ---------- Startsequenz: Flugplan rechnet live, Nachricht wird vorgeschrieben ---------- */
  var builder = $("[data-ot-builder]");
  if (builder) {
    var loc = L.locale || "de-DE";
    var fmtD = function (d) { return d.toLocaleDateString(loc, { weekday: "short", day: "numeric", month: "short" }); };
    var fmtT = function (d) { return d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" }); };
    var nextWorkday = function (d) { var x = new Date(d); x.setDate(x.getDate() + 1); while (x.getDay() === 0 || x.getDay() === 6) x.setDate(x.getDate() + 1); x.setHours(10, 0, 0, 0); return x; };
    var whens = $$("[data-ot-when]"), nowEl = $("[data-ot-now]"), mission = $("[data-ot-mission]"), preview = $("[data-ot-preview]");
    var wa = $("[data-ot-wa]"), mail = $("[data-ot-mail]");
    var plan = function () {
      var now = new Date();
      nowEl.textContent = fmtD(now) + ", " + now.toLocaleTimeString(loc);
      var call = nextWorkday(now), offer = new Date(call.getTime() + 48 * 3600e3);
      var labels = [(L.today || "{t}").replace("{t}", fmtT(now)), fmtD(call), fmtD(offer)];
      whens.forEach(function (el, i) { if (labels[i]) el.textContent = labels[i]; });
      var what = $$('input[type="checkbox"]:checked', builder).map(function (i) { return i.value; });
      var whenIn = $('input[name="ot-when"]:checked', builder), when = whenIn ? whenIn.value : "";
      var budIn = $('input[name="ot-budget"]:checked', builder), budget = budIn ? budIn.value : "";
      var note = $("#ot-note").value.trim(), list = what.length ? what.join(", ") : (L.open || "");
      mission.textContent = "";
      [[L.mission, list], [L.start, when]].forEach(function (pair, i) {
        if (i) mission.appendChild(document.createTextNode(" · "));
        mission.appendChild(document.createTextNode(pair[0] + ": "));
        var b = document.createElement("b"); b.textContent = pair[1]; mission.appendChild(b);
      });
      var msg = (L.msg || "").replace("{list}", list).replace("{when}", when) + (budget ? " " + (L.budgetMsg || "{b}").replace("{b}", budget) : "") + (note ? " " + note : "");
      if (preview) preview.textContent = msg;
      if (wa && L.wa) wa.href = L.wa + "?text=" + encodeURIComponent(msg);
      if (mail && L.email) mail.href = "mailto:" + L.email + "?subject=" + encodeURIComponent((L.subject || "").replace("{list}", list)) + "&body=" + encodeURIComponent(msg);
    };
    plan(); setInterval(plan, 1000);
    builder.addEventListener("input", plan); builder.addEventListener("change", plan);

    var consoleEl = $("[data-ot-console]"), lr = $(".ot-lr");
    $$("[data-ot-send-link]").forEach(function (a) {
      a.addEventListener("click", function () {
        if (!consoleEl || reduced) return;
        consoleEl.classList.remove("lift"); void consoleEl.offsetWidth; consoleEl.classList.add("lift");
        if (lr && lr.animate) lr.animate([{ strokeDashoffset: 339.3 }, { strokeDashoffset: 0 }], { duration: 900, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" });
      });
    });
    var copy = $("[data-ot-copy]");
    if (copy) copy.addEventListener("click", function () {
      var done = function () { copy.textContent = L.copied; setTimeout(function () { copy.textContent = L.copy; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(L.email).then(done, function () {});
    });
  }
})();
