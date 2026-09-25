/*
 * Hero: Scrollposition steuert die Filmposition.
 * - Kein Abfangen von Mausrad/Touch: liest nur die Scrollposition.
 * - Kein Autoplay, kein Ton. Ohne Scrollen bleibt das Bild stehen.
 * - Wirkt nur innerhalb des Einstiegsbereichs.
 * - Telefone/Tablets: Einzelbilder auf einer Zeichenfläche statt Video. Safari braucht pro Sprung
 *   im Video ≈ 100 ms (nur ~10 neue Bilder pro Sekunde beim Scrollen); Einzelbilder erscheinen sofort.
 * - Desktop: Video (Sprünge sind dort schnell genug).
 * - Fallback: Standbild bei reduzierter Bewegung, Datensparmodus, fehlender Unterstützung oder Ladefehler.
 * - Film endet bei VIDEO_END der Strecke; danach wird der Übergangssatz über dem Schwarz eingeblendet.
 */
(function () {
  "use strict";
  var hero = document.querySelector("[data-hero]");
  var track = document.querySelector("[data-hero-scrub]");
  var media = document.querySelector("[data-hero-media]");
  var copy = document.querySelector("[data-hero-copy]");
  var outro = document.querySelector("[data-hero-outro]");
  var VIDEO_END = 0.85;       // Anteil der Scrollstrecke, auf dem der Film läuft
  var OUTRO_IN = [0.78, 0.90]; // Einblendung des Satzes (Film ist ab ≈ 6,7 s schwarz)
  if (!hero || !track || !media) return;

  var video = media.querySelector("video");
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqDesktop = window.matchMedia("(min-width: 900px)");
  var mqCoarse = window.matchMedia("(pointer: coarse)");

  var frames = null;
  try { frames = JSON.parse(media.getAttribute("data-frames") || "null"); } catch (e) {}
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext && canvas.getContext("2d");
  var useFrames = !!(frames && frames.count > 1 && ctx && (!mqDesktop.matches || mqCoarse.matches));

  function setStatic(reason) {
    hero.classList.add("hero--static");
    hero.classList.remove("hero--ready");
    hero.setAttribute("data-hero-mode", "static:" + reason);
    if (copy) { copy.style.opacity = ""; copy.style.visibility = ""; }
    if (outro) { outro.style.opacity = ""; outro.style.visibility = ""; }
    try { video.removeAttribute("src"); video.load(); } catch (e) {}
  }

  if (!useFrames) {
    var canPlay = !!(video && video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.640028"'));
    if (!canPlay) { setStatic("no-support"); return; }
  }
  if (mqReduce.matches) { setStatic("reduced-motion"); watchReduce(); return; }
  // Datensparmodus: keinen Film laden, Standbild zeigen
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var mqData = window.matchMedia("(prefers-reduced-data: reduce)");
  if ((conn && conn.saveData === true) || mqData.matches) { setStatic("save-data"); return; }
  hero.setAttribute("data-hero-mode", useFrames ? "frames" : "scrub");

  function watchReduce() {
    var h = function (e) { if (e.matches) { stop(); setStatic("reduced-motion"); } else { window.location.reload(); } };
    mqReduce.addEventListener ? mqReduce.addEventListener("change", h) : mqReduce.addListener(h);
  }
  watchReduce();

  // Fortschritt im Film, 0 … 1 (Video: × Dauer, Einzelbilder: × letzte Bildnummer)
  var ready = false, current = 0, target = 0, raf = 0, active = false;

  /* ---------- Einzelbilder ---------- */
  var imgs = [], have = [], haveCount = 0, failed = 0, drawn = -1;

  function frameUrl(i) { return frames.base + "f-" + ("00" + (i + 1)).slice(-3) + ".webp"; }

  // Nächstes bereits geladenes Bild zu i (während des Ladens entstehen Lücken)
  function nearest(i) {
    for (var d = 0; d < frames.count; d++) {
      if (have[i - d]) return i - d;
      if (have[i + d]) return i + d;
    }
    return -1;
  }

  function render() {
    var i = nearest(Math.round(current * (frames.count - 1)));
    if (i < 0 || i === drawn) return;
    ctx.drawImage(imgs[i], 0, 0, canvas.width, canvas.height);
    drawn = i;
  }

  // Grob → fein laden (jedes 8., 4., 2., dann alle Bilder): Die ganze Strecke ist früh scrollbar.
  function loadFrames() {
    var order = [], seen = {}, firstPass = 0;
    [8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < frames.count; i += step) if (!seen[i]) { seen[i] = true; order.push(i); }
      if (step === 8) {
        if (!seen[frames.count - 1]) { seen[frames.count - 1] = true; order.push(frames.count - 1); }
        firstPass = order.length;
      }
    });
    var next = 0, inflight = 0;

    function pump() { while (inflight < 6 && next < order.length) start(order[next++]); }
    function start(i) {
      inflight++;
      var im = new Image();
      im.onload = function () {
        inflight--;
        if (!haveCount) { canvas.width = im.naturalWidth; canvas.height = im.naturalHeight; }
        imgs[i] = im; have[i] = true; haveCount++;
        if (!ready && have[0] && haveCount + failed >= firstPass) {
          ready = true;
          hero.classList.add("hero--ready");
          update();
          current = target;
        }
        if (ready) { drawn = -1; render(); }
        pump();
      };
      im.onerror = function () {
        inflight--; failed++;
        if (i === 0) { stop(); setStatic("load-error"); return; }
        pump();
      };
      im.src = frameUrl(i);
    }
    pump();
  }

  /* ---------- Video ---------- */
  var duration = 0, seeking = false, chosen = null;

  function setupVideo() {
    var sources = [];
    try { sources = JSON.parse(media.getAttribute("data-sources")); } catch (e) {}
    if (!sources.length) { setStatic("no-source"); return false; }
    // Benötigte Pixel = tatsächliche Anzeigebreite × Pixeldichte
    var need = (media.getBoundingClientRect().width || Math.min(window.innerWidth, 720)) * Math.min(2, window.devicePixelRatio || 1);
    if (!mqDesktop.matches) sources = sources.filter(function (s) { return !s.desktopOnly; });
    // Mobil höchstens 540 px Breite: Jeder Suchschritt dekodiert ein ganzes Bild.
    if (!mqDesktop.matches) need = Math.min(need, 540);
    sources.sort(function (a, b) { return a.width - b.width; });
    chosen = sources[sources.length - 1];
    for (var i = 0; i < sources.length; i++) { if (sources[i].width >= need * 0.9) { chosen = sources[i]; break; } }

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.addEventListener("error", function () { stop(); setStatic("load-error"); });
    video.addEventListener("seeking", function () { seeking = true; });
    video.addEventListener("seeked", function () { seeking = false; if (active) tick(); });
    video.addEventListener("loadedmetadata", function () { duration = video.duration || 0; });
    video.addEventListener("loadeddata", function () {
      duration = video.duration || duration;
      if (!duration) { setStatic("no-duration"); return; }
      ready = true;
      primeForWebKit().then(function () {
        hero.classList.add("hero--ready");
        update();
        requestTick();
      });
    });
    return true;
  }

  // Blob-URL erzwingt vollständige Suchbarkeit, auch bei Servern ohne Range-Requests.
  // Bei file:// schlägt fetch fehl → direkte Quelle.
  function loadVideo() {
    if (window.fetch && location.protocol !== "file:") {
      fetch(chosen.src).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.blob();
      }).then(function (blob) {
        video.src = URL.createObjectURL(blob);
        video.load();
      }).catch(function () {
        video.src = chosen.src; video.load();
      });
    } else {
      video.src = chosen.src; video.load();
    }
  }

  // iOS/iPadOS-WebKit zeigt gesuchte Frames teils erst nach einem Wiedergabeimpuls.
  // Stummer Start und sofortiger Stopp bei Position 0 – keine sichtbare Wiedergabe.
  function primeForWebKit() {
    var isAppleTouch = /iP(hone|ad|od)/.test(navigator.platform) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isAppleTouch) return Promise.resolve();
    try {
      var p = video.play();
      if (p && p.then) {
        return p.then(function () { video.pause(); video.currentTime = 0; })
                .catch(function () { /* weiter ohne Priming */ });
      }
      video.pause();
    } catch (e) {}
    return Promise.resolve();
  }

  if (useFrames) {
    // Zeichenfläche ersetzt das Video-Element (gleiche Klasse: Lage, Einblendung, Maske)
    canvas.className = "hero-video";
    canvas.setAttribute("aria-hidden", "true");
    if (video) video.parentNode.replaceChild(canvas, video); else media.appendChild(canvas);
  } else if (!setupVideo()) {
    return;
  }

  /* ---------- Scroll → Fortschritt ---------- */
  function progress() {
    var rect = track.getBoundingClientRect();
    var vh = window.innerHeight;
    var distance = rect.height - vh;
    if (distance <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / distance));
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function update() {
    var p = progress();
    var v = Math.min(1, p / VIDEO_END);
    if (ready) target = v;
    // Text blendet erst während der Annäherung aus (nur Desktop, Text liegt neben dem Film).
    if (copy) {
      if (mqDesktop.matches && !copy.contains(document.activeElement)) {
        var o = 1 - smooth(0.42, 0.78, v);
        copy.style.opacity = o.toFixed(3);
        copy.style.visibility = o < 0.02 ? "hidden" : "";
      } else {
        copy.style.opacity = "";
        copy.style.visibility = "";
      }
    }
    // Übergangssatz nur über dem tatsächlich laufenden Film (nicht über dem Standbild beim Laden)
    if (outro) {
      var q = ready ? smooth(OUTRO_IN[0], OUTRO_IN[1], p) : 0;
      outro.style.opacity = q.toFixed(3);
      outro.style.visibility = q < 0.02 ? "hidden" : "visible";
    }
  }

  function tick() {
    raf = 0;
    if (!ready) return;
    var diff = target - current;
    current = Math.abs(diff) < 0.0006 ? target : current + diff * 0.28;
    if (useFrames) {
      render();
    } else {
      var t = current * Math.max(0, duration - 0.05);
      if (!seeking && Math.abs(video.currentTime - t) > 1 / 60) video.currentTime = t;
    }
    if (current !== target) requestTick();
  }
  function requestTick() { if (!raf) raf = requestAnimationFrame(tick); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; active = false; }

  function onScroll() { if (!active) return; update(); requestTick(); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { update(); requestTick(); }, { passive: true });
  if (copy) copy.addEventListener("focusin", function () { copy.style.opacity = ""; copy.style.visibility = ""; });

  // Nur arbeiten, solange der Einstieg sichtbar ist; Film erst dann laden.
  var started = false;
  function activate(on) {
    active = on;
    if (on) {
      if (!started) { started = true; if (useFrames) loadFrames(); else loadVideo(); }
      update(); requestTick();
    }
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      activate(entries[0].isIntersecting);
    }, { rootMargin: "200px 0px" }).observe(hero);
  } else {
    activate(true);
  }
  update();
})();
