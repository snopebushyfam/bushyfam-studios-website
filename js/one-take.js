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
  var W = innerWidth, H = innerHeight, phone = W < 768;
  html.classList.add("ot-js");
  var live = !reduced;

  /* ---------- Die beiden Filme ----------
     Quelle ist das Video (jedes Bild ein Keyframe, daher flüssig zu spulen). Handys laden zusätzlich alle
     Einzelbilder und wechseln erst darauf, wenn alle da sind: Safari braucht pro Sprung im Video ≈ 100 ms. */
  function film(canvas) {
    var f = { poster: new Image(), video: null, vReady: false, imgs: [], count: 0, got: 0, framesReady: false };
    f.poster.onload = dirty; f.poster.src = canvas.getAttribute("data-poster");
    var srcs = []; try { srcs = JSON.parse(canvas.getAttribute("data-sources") || "[]"); } catch (e) {}
    var px = W * Math.min(devicePixelRatio || 1, 2);
    var usable = srcs.filter(function (s) { return !s.desktopOnly || (!phone && px > 1100); }).sort(function (a, b) { return a.width - b.width; });
    var pickSrc = usable.filter(function (s) { return s.width >= (phone ? 540 : Math.min(px * 0.75, 1080)); })[0] || usable[usable.length - 1];
    if (pickSrc && live) {
      var v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("muted", ""); v.preload = "auto";
      v.addEventListener("loadeddata", function () { f.vReady = true; dirty(); });
      v.addEventListener("seeked", dirty);
      v.src = pickSrc.src;
      /* iOS gibt Bilder eines Videos erst nach einem kurzen Abspielen frei */
      var pr = v.play(); if (pr && pr.then) pr.then(function () { v.pause(); }).catch(function () {});
      f.video = v;
    }
    var F = null; try { F = JSON.parse(canvas.getAttribute("data-frames-m") || '""'); } catch (e) {}
    if (F && live && (phone || matchMedia("(pointer: coarse)").matches)) {
      f.count = F.count;
      for (var i = 0; i < F.count; i++) (function (k) {
        var im = new Image(); im.decoding = "async";
        im.onload = function () { f.got++; if (f.got === f.count) { f.framesReady = true; dirty(); } };
        im.src = F.base + "f-" + String(k + 1).padStart(3, "0") + ".webp"; f.imgs[k] = im;
      })(i);
    }
    return f;
  }
  /* Bild zur Stelle frac (0 … 1) des Films */
  function frameAt(f, frac) {
    if (f.framesReady) return f.imgs[Math.round(frac * (f.count - 1))];
    if (f.vReady && f.video.duration) {
      var t = frac * Math.max(0, f.video.duration - 0.05);
      if (!f.video.seeking && Math.abs(f.video.currentTime - t) > 0.02) f.video.currentTime = t;
      return f.video;
    }
    return f.poster.complete && f.poster.naturalWidth ? f.poster : null;
  }
  var dimW = function (m) { return m.videoWidth || m.naturalWidth; }, dimH = function (m) { return m.videoHeight || m.naturalHeight; };
  function sizeCanvas(c) { var dpr = Math.min(devicePixelRatio || 1, 2); c.width = Math.round(c.clientWidth * dpr); c.height = Math.round(c.clientHeight * dpr); }
  function draw(c, img, s, fx, fy, tx, ty) {
    var ctx = c.getContext("2d"), dpr = c.width / (c.clientWidth || 1);
    var w = dimW(img) * s, h = dimH(img) * s;
    ctx.fillStyle = "#050506"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (tx - fx * w) * dpr, (ty - fy * h) * dpr, w * dpr, h * dpr);
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

  /* ---------- Ton: erst nach Klick, im Browser erzeugt ---------- */
  var sound = (function () {
    var ac = null, master, hum1, wn, bp, on = false, ducked = false;
    function init() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      var lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 320; lp.connect(master);
      hum1 = ac.createOscillator(); hum1.type = "sine"; hum1.frequency.value = 55;
      var hum2 = ac.createOscillator(); hum2.type = "triangle"; hum2.frequency.value = 82.4;
      var g1 = ac.createGain(); g1.gain.value = 0.16; var g2 = ac.createGain(); g2.gain.value = 0.05;
      hum1.connect(g1).connect(lp); hum2.connect(g2).connect(lp); hum1.start(); hum2.start();
      var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.2; lg.gain.value = 40; lfo.connect(lg).connect(lp.frequency); lfo.start();
      var buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = 0.8;
      wn = ac.createGain(); wn.gain.value = 0;
      src.connect(bp).connect(wn).connect(master); src.start();
    }
    var level = function () { return on && !ducked ? 0.7 : 0; };
    return {
      toggle: function () { if (!ac) init(); on = !on; if (on) ac.resume(); master.gain.setTargetAtTime(level(), ac.currentTime, 0.3); return on; },
      duck: function (v) { ducked = v; if (ac) master.gain.setTargetAtTime(level(), ac.currentTime, 0.2); },
      update: function (v, heroP) {
        if (!on || ducked) return;
        var a = Math.min(Math.abs(v), 120);
        wn.gain.setTargetAtTime(Math.min(0.32, a * 0.006), ac.currentTime, 0.08);
        bp.frequency.setTargetAtTime(300 + a * 30, ac.currentTime, 0.1);
        hum1.frequency.setTargetAtTime(55 + heroP * 18, ac.currentTime, 0.2);
      },
      blip: function (f) {
        if (!on || ducked) return;
        f = f || 880; var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
        o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f / 2, t + 0.18);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g).connect(master); o.start(t); o.stop(t + 0.25);
      },
      whoosh: function () {
        if (!on || ducked) return;
        var t = ac.currentTime;
        wn.gain.cancelScheduledValues(t); wn.gain.setValueAtTime(0.05, t); wn.gain.linearRampToValueAtTime(0.4, t + 0.5); wn.gain.linearRampToValueAtTime(0, t + 1.4);
        bp.frequency.cancelScheduledValues(t); bp.frequency.setValueAtTime(200, t); bp.frequency.exponentialRampToValueAtTime(3000, t + 1.2);
      }
    };
  })();
  var sndBtn = $("[data-ot-snd]");
  if (sndBtn) sndBtn.addEventListener("click", function () {
    var v = sound.toggle(); sndBtn.setAttribute("aria-pressed", v);
    var l = $(".ot-snd-l", sndBtn); if (l) l.textContent = v ? L.soundOff : L.soundOn;
  });

  /* ---------- Szenen ---------- */
  var scenes = [];
  var scene = function (el, render, rest) { if (el) scenes.push({ el: el, render: render, rest: rest, last: -1 }); };
  function dirty() { scenes.forEach(function (s) { s.last = -1; }); }

  /* 1 · Einstieg: Bullauge öffnet sich, die Kamera fährt in die Pupille */
  var hero = $(".ot-hero"), hc = $('[data-ot-canvas="hero"]'), port = $(".ot-porthole"), rim = $(".ot-rim");
  var heroFilm = null;
  var wm = $(".ot-wordmark"), lede = $(".ot-lede"), cue = $(".ot-cue"), tag = $(".ot-tagline"), black = $(".ot-hero .ot-blackout");
  var dots = [];
  if (rim) for (var di = 0; di < 20; di++) dots.push(rim.appendChild(document.createElement("i")));
  function heroRender(p) {
    var cx = W / 2, cy = phone ? H * 0.4 : H * 0.42;
    var r0 = phone ? Math.min(W * 0.37, H * 0.21) : Math.min(W * 0.19, H * 0.27);
    var rMax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 4;
    var e = ease(seg(p, 0, 0.3)), r = lerp(r0, rMax, e);
    port.style.clipPath = "circle(" + r + "px at " + cx + "px " + cy + "px)";
    rim.style.transform = "translate(" + cx + "px," + cy + "px)";
    rim.style.setProperty("--d", 2 * r + "px");
    rim.style.opacity = 1 - seg(p, 0.04, 0.16);
    var spin = p * 120;
    dots.forEach(function (d, i) { var a = (i / dots.length * 360 + spin) * Math.PI / 180; d.style.transform = "translate(" + Math.cos(a) * (r + 9.5) + "px," + Math.sin(a) * (r + 9.5) + "px)"; });
    var img = heroFilm && frameAt(heroFilm, seg(p, 0.04, 0.92));
    if (img) {
      var z = 1 + 2.4 * easeIn(seg(p, 0.8, 0.97));
      var ctx = draw(hc, img, cover(img, W, H) * z, lerp(phone ? 0.55 : 0.6, 0.5, seg(p, 0, 0.35)), 0.5, W / 2, lerp(cy, H / 2, e));
      var tt = seg(p, 0.4, 0.5) - seg(p, 0.68, 0.76);
      if (tt > 0) { ctx.fillStyle = "rgba(5,5,6," + 0.42 * tt + ")"; ctx.fillRect(0, 0, hc.width, hc.height); }
    }
    var out = seg(p, 0.02, 0.2);
    wm.style.transform = "translateY(" + out * 30 + "%) scale(" + (1 - out * 0.06) + ")"; wm.style.opacity = 1 - out;
    var o2 = 1 - seg(p, 0, 0.1);
    lede.style.opacity = o2; if (cue) cue.style.opacity = o2;
    lede.style.transform = "translateY(" + -seg(p, 0, 0.1) * 40 + "px)"; if (cue) cue.style.transform = lede.style.transform;
    lede.style.pointerEvents = o2 < 0.3 ? "none" : "";
    if (tag) { var t = seg(p, 0.42, 0.5) - seg(p, 0.68, 0.76); tag.style.opacity = t; tag.style.transform = "translateY(" + ((1 - seg(p, 0.42, 0.5)) * 30 - seg(p, 0.68, 0.76) * 30) + "px)"; }
    black.style.opacity = seg(p, 0.9, 0.98);
  }
  if (hero && hc) scene(hero, heroRender, function () { heroRender(0); });

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
      var o = clamp(rel > -120 ? 1 - (rel + 120) / 420 : (rel + 2100) / 800);
      it.style.opacity = o;
      it.style.visibility = o < 0.01 ? "hidden" : "visible";
      it.style.pointerEvents = o > 0.6 ? "auto" : "none";
      it.style.transform = "translate(-50%,-50%) translate3d(" + xf * W + "px,0," + rel + "px)";
      var v = it.querySelector("video");
      if (v) { if (o > 0.05 && v.paused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else if (o <= 0.05 && !v.paused) v.pause(); }
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

  /* 3 · Leistungen: der Monitor schaltet beim Scrollen durch die Kanäle */
  var svcs = $(".ot-svcs"), insts = $$("[data-ot-inst]"), feeds = $$(".ot-feed"), screen = $(".ot-screen");
  var osdC = $("[data-ot-osd-ch]"), osdN = $("[data-ot-osd-n]"), svcK = 0;
  function setSvc(k) {
    if (k === svcK) return;
    svcK = k;
    insts.forEach(function (el, i) { el.classList.toggle("is-on", i === k); });
    feeds.forEach(function (el, i) {
      el.classList.toggle("is-on", i === k);
      var v = el.querySelector("video"); if (v) { if (i === k) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }
    });
    if (osdC) osdC.textContent = (L.channel || "{n}/{m}").replace("{n}", k + 1).replace("{m}", insts.length);
    if (osdN) osdN.textContent = (L.labels || [])[k] || "";
    screen.classList.remove("zap"); void screen.offsetWidth; screen.classList.add("zap");
    sound.blip(520 + k * 120);
  }
  function svcRender(p) {
    svcs.style.setProperty("--on", ease(seg(p, 0, 0.1)).toFixed(3));
    setSvc(Math.min(insts.length - 1, Math.floor(seg(p, 0.06, 0.96) * insts.length)));
    var v = feeds[svcK] && feeds[svcK].querySelector("video");
    if (v && v.paused && p > 0 && p < 1) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
  }
  if (svcs && insts.length) {
    scene(svcs, svcRender, null);
    insts.forEach(function (el, i) { el.addEventListener("click", function () {
      if (!svcs.classList.contains("is-live")) return;
      go(svcs.offsetTop + (svcs.offsetHeight - H) * (0.06 + (i + 0.5) / insts.length * 0.9), 1);
    }); });
  }

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
      var sf = Math.min(W, H * (phone ? 0.62 : 0.5)) / dimW(img) * (phone ? 0.9 : 1);
      var k = ease(seg(p, 0.5, 0.86)), s = lerp(sc, sf, k), cy = lerp(H / 2, H * (phone ? 0.5 : 0.55), k);
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
    W = innerWidth; H = innerHeight; phone = W < 768;
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
  addEventListener("resize", function () { layout(); buildTimeline(); });
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
      var whenIn = $('input[type="radio"]:checked', builder), when = whenIn ? whenIn.value : "";
      var note = $("#ot-note").value.trim(), list = what.length ? what.join(", ") : (L.open || "");
      mission.textContent = "";
      [[L.mission, list], [L.start, when]].forEach(function (pair, i) {
        if (i) mission.appendChild(document.createTextNode(" · "));
        mission.appendChild(document.createTextNode(pair[0] + ": "));
        var b = document.createElement("b"); b.textContent = pair[1]; mission.appendChild(b);
      });
      var msg = (L.msg || "").replace("{list}", list).replace("{when}", when) + (note ? " " + note : "");
      if (preview) preview.textContent = msg;
      if (wa && L.wa) wa.href = L.wa + "?text=" + encodeURIComponent(msg);
      if (mail && L.email) mail.href = "mailto:" + L.email + "?subject=" + encodeURIComponent((L.subject || "").replace("{list}", list)) + "&body=" + encodeURIComponent(msg);
    };
    plan(); setInterval(plan, 1000);
    builder.addEventListener("input", plan); builder.addEventListener("change", plan);

    var launch = $("[data-ot-launch]"), lbl = $("[data-ot-lbl]"), lr = $(".ot-lr"), consoleEl = $("[data-ot-console]"), send = $("[data-ot-send]");
    launch.addEventListener("click", function () {
      launch.disabled = true;
      var finish = function () {
        consoleEl.classList.add("lift"); lbl.textContent = L.go || "Go!"; sound.whoosh();
        setTimeout(function () { send.hidden = false; lbl.textContent = L.ready || ""; launch.classList.remove("counting"); var f = $("[data-ot-wa]") || $("[data-ot-mail]"); if (f) f.focus({ preventScroll: true }); }, reduced ? 0 : 900);
      };
      if (reduced) return finish();
      launch.classList.add("counting");
      var c = 3;
      (function tick() {
        if (c === 0) return finish();
        lbl.textContent = c; sound.blip(c === 1 ? 990 : 660);
        if (lr.animate) lr.animate([{ strokeDashoffset: 339.3 }, { strokeDashoffset: 0 }], { duration: 700, easing: "linear", fill: "forwards" });
        c--; setTimeout(tick, 750);
      })();
    });
    var copy = $("[data-ot-copy]");
    if (copy) copy.addEventListener("click", function () {
      var done = function () { copy.textContent = L.copied; setTimeout(function () { copy.textContent = L.copy; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(L.email).then(done, function () {});
    });
  }
})();
