/*
 * BushyFam Studios – Startseite: „Leistungen im All“.
 * Die Bühne bleibt beim Scrollen stehen, die Kamera fliegt mit der Scrollposition durch die Sterne
 * von Leistung zu Leistung (ohne das Scrollen abzufangen). Die Geräte (Feed, Leinwand, Kartenstapel,
 * Browser, Bullauge) laufen nur, solange ihre Station sichtbar ist.
 * Ohne dieses Skript oder mit reduzierter Bewegung stehen alle Stationen ruhig untereinander.
 */
(function () {
  "use strict";
  var space = document.querySelector(".ot-space");
  if (!space) return;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:1px;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  var svh = function () { return probe.offsetHeight || innerHeight; };
  var W = innerWidth, H = svh(), phone = W < 768;
  var live = !reduced;

  /* ---------- Flug: die Kamera hält an jeder Station kurz an ---------- */
  var stars = $(".ot-stars", space), items = $$(".ot-item", space), warpOut = $(".ot-warp-out", space);
  var zs = items.map(function (i) { return +i.getAttribute("data-z"); }), n = items.length;
  var stops = zs.map(function (z, k) { return k === 0 ? 0 : k === n - 1 ? -z : -z - 260; });
  var vel = 0, warpBoost = 0;
  if (n < 2) live = false;
  function render(p) {
    warpBoost = seg(p, 0.9, 1) * 70;
    if (warpOut) warpOut.style.opacity = seg(p, 0.95, 1);
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

  /* ---------- Sternenfeld: zieht sich beim schnellen Scrollen zu Streifen ---------- */
  if (live && stars && "IntersectionObserver" in window) (function () {
    var ctx = stars.getContext("2d"), on = false, speed = 2, dpr = 1, N = phone ? 220 : 360, pts = [];
    var reset = function (s, far) { s.x = (Math.random() * 2 - 1) * 1600; s.y = (Math.random() * 2 - 1) * 1000; s.z = far ? 2000 : Math.random() * 2000 + 1; };
    for (var i = 0; i < N; i++) { var s = {}; reset(s); pts.push(s); }
    var size = function () {
      var r = Math.min(devicePixelRatio || 1, 2), w = Math.round(stars.clientWidth * r), h = Math.round(stars.clientHeight * r);
      if (stars.width !== w || stars.height !== h) { stars.width = w; stars.height = h; }
      dpr = stars.width / (stars.clientWidth || 1);
    };
    new IntersectionObserver(function (e) { var was = on; on = e[0].isIntersecting; if (on && !was) { size(); tick(); } }).observe(space);
    addEventListener("resize", function () { if (on) size(); });
    function tick() {
      if (!on) return;
      var w = stars.width, h = stars.height, cx = w / 2, cy = h / 2, f = 420 * dpr * (phone ? 0.7 : 1);
      speed = lerp(speed, 1.6 + Math.min(60, Math.abs(vel) * 0.8) + warpBoost, 0.06);
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, w, h);
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

  /* ---------- Geräte: Feed, Leinwand, Kartenstapel, Browser, Bullauge ---------- */
  var play = function (v) { if (!v) return; if (v.preload !== "auto") v.preload = "auto"; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); };
  var devs = $$("[data-dev]", space).map(function (el) {
    var d = { el: el, kind: el.getAttribute("data-dev"), item: el.closest(".ot-item"), on: false, i: 0, last: 0 };
    if (d.kind === "feed") { d.track = $(".ot-feed-track", el); d.slides = $$(".ot-feed-item", el); d.bar = $(".ot-feed-bar i", el); d.heart = $(".ot-feed-ui span", el); d.period = 2400; }
    if (d.kind === "cinema") { d.slides = $$(".ot-cine-shot", el); d.period = 3200; }
    if (d.kind === "cards") { d.slides = $$(".ot-card", el); d.period = 2200; }
    if (d.kind === "porthole") { d.slides = [el]; d.period = 0; }
    if (d.kind === "browser") { d.slides = $$(".ot-br-page", el); d.view = $(".ot-br-view", el); d.url = $(".ot-br-url", el); d.period = 5200; }
    return d;
  });
  var vidOf = function (node) { return node && node.querySelector("video"); };
  function showSlide(d) {
    var count = d.slides.length;
    if (d.kind === "feed") {
      d.track.style.transform = "translateY(" + (-d.i * 100) + "%)";
      d.slides.forEach(function (s, k) { var v = vidOf(s); if (!v) return; if (k === d.i) { v.currentTime = 0; play(v); } else v.pause(); });
      if (d.bar) { d.bar.style.transition = "none"; d.bar.style.width = "0"; void d.bar.offsetWidth; d.bar.style.transition = "width " + d.period + "ms linear"; d.bar.style.width = "100%"; }
      if (d.heart && d.i % 2) { d.heart.classList.add("pop"); setTimeout(function () { d.heart.classList.remove("pop"); }, 700); }
    } else if (d.kind === "cinema") {
      d.slides.forEach(function (s, k) { s.classList.toggle("is-on", k === d.i); var v = vidOf(s); if (!v) return; if (k === d.i) { v.currentTime = 0; play(v); } else v.pause(); });
    } else if (d.kind === "cards") {
      d.slides.forEach(function (s, k) { s.setAttribute("data-pos", String((k - d.i + count) % count)); });
    } else if (d.kind === "browser") {
      d.slides.forEach(function (s, k) {
        s.classList.toggle("is-on", k === d.i);
        var im = s.querySelector("img"); if (!im) return;
        im.style.transition = "none"; im.style.transform = "none";
        if (k === d.i) { void im.offsetWidth; var dist = Math.max(0, im.offsetHeight - d.view.offsetHeight); im.style.transition = "transform " + (d.period - 700) + "ms cubic-bezier(.45,0,.2,1)"; im.style.transform = "translateY(" + (-dist) + "px)"; }
      });
      if (d.url) d.url.textContent = d.slides[d.i].getAttribute("data-url") || "";
    } else if (d.kind === "porthole") {
      /* Läuft einmal und bleibt auf dem Endbild stehen – dort sitzt das UFO mittig im Kreis */
      var pv = vidOf(d.el);
      if (pv) { if (pv.ended) pv.currentTime = 0; play(pv); }
    }
  }
  function devVisible(d) {
    if (document.hidden) return false;
    if (live) return parseFloat(d.item.style.opacity || "0") > 0.5 && d.item.style.visibility !== "hidden";
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

  /* ---------- Scroll-Schleife ---------- */
  if (!live) return;
  space.classList.add("is-live");
  var last = -1, lastY = scrollY;
  function frame() {
    var y = scrollY; vel = lerp(vel, y - lastY, 0.3); lastY = y;
    var r = space.getBoundingClientRect();
    if (!((r.bottom < -50 || r.top > H + 50) && last >= 0)) {
      var p = clamp(-r.top / Math.max(1, r.height - H));
      if (Math.abs(p - last) > 0.0003 || last < 0) { last = p; render(p); }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  /* iOS meldet beim Ein-/Ausklappen der Adressleiste ständig eine neue Größe: nur bei echter Änderung neu aufbauen */
  var lastW = innerWidth, lastH = svh();
  addEventListener("resize", function () {
    if (innerWidth === lastW && Math.abs(svh() - lastH) < 2) return;
    lastW = W = innerWidth; lastH = H = svh(); phone = W < 768; last = -1;
  });
})();
