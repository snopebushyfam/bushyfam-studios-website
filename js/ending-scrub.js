/*
 * Abschlussfilm vor dem Footer: Scrollposition steuert die Videoposition.
 * - Startet, sobald der Bereich etwa zur Hälfte im Bild ist, und endet,
 *   wenn er vollständig durchgescrollt ist. Vor- und rückwärts.
 * - Kein Autoplay, kein Ton, kein Abfangen von Mausrad/Touch.
 * - Video wird erst geladen, wenn der Bereich in die Nähe kommt.
 * - Ersatz (Standbild = letztes Bild): reduzierte Bewegung, Datensparmodus,
 *   fehlende Unterstützung, Ladefehler.
 */
(function () {
  "use strict";
  var section = document.querySelector("[data-ending]");
  var track = document.querySelector("[data-ending-track]");
  var media = document.querySelector("[data-ending-media]");
  if (!section || !track || !media) return;

  var video = media.querySelector("video");
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqDesktop = window.matchMedia("(min-width: 900px)");
  var LEAD = 0.55; // Anteil der Bildschirmhöhe, ab dem der Film beginnt

  function setStatic(reason) {
    section.classList.add("ending--static");
    section.classList.remove("ending--ready");
    section.setAttribute("data-ending-mode", "static:" + reason);
    stop();
    try { video.removeAttribute("src"); video.load(); } catch (e) {}
  }

  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = (conn && conn.saveData === true) || window.matchMedia("(prefers-reduced-data: reduce)").matches;
  var canPlay = !!(video && video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.640028"'));

  var raf = 0, active = false, ready = false, seeking = false, duration = 0, current = 0, target = 0, loaded = false;
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; active = false; }

  if (!canPlay) { setStatic("no-support"); return; }
  if (mqReduce.matches) { setStatic("reduced-motion"); return; }
  if (saveData) { setStatic("save-data"); return; }
  section.setAttribute("data-ending-mode", "scrub");

  var onReduce = function (e) { if (e.matches) setStatic("reduced-motion"); };
  mqReduce.addEventListener ? mqReduce.addEventListener("change", onReduce) : mqReduce.addListener(onReduce);

  /* ---------- Quelle wählen (wie im Einstieg) ---------- */
  var sources = [];
  try { sources = JSON.parse(media.getAttribute("data-sources")); } catch (e) {}
  if (!mqDesktop.matches) sources = sources.filter(function (s) { return !s.desktopOnly; });
  if (!sources.length) { setStatic("no-source"); return; }
  sources.sort(function (a, b) { return a.width - b.width; });
  var need = (media.getBoundingClientRect().width || Math.min(window.innerWidth, 760)) * Math.min(2, window.devicePixelRatio || 1);
  var chosen = sources[sources.length - 1];
  for (var i = 0; i < sources.length; i++) { if (sources[i].width >= need * 0.9) { chosen = sources[i]; break; } }

  video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = "auto";
  video.addEventListener("error", function () { setStatic("load-error"); });
  video.addEventListener("seeking", function () { seeking = true; });
  video.addEventListener("seeked", function () { seeking = false; if (active) requestTick(); });
  video.addEventListener("loadeddata", function () {
    duration = video.duration || 0;
    if (!duration) { setStatic("no-duration"); return; }
    ready = true;
    primeForWebKit().then(function () { section.classList.add("ending--ready"); update(); requestTick(); });
  });

  function loadSource() {
    if (window.fetch && location.protocol !== "file:") {
      fetch(chosen.src).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); })
        .then(function (b) { video.src = URL.createObjectURL(b); video.load(); })
        .catch(function () { video.src = chosen.src; video.load(); });
    } else { video.src = chosen.src; video.load(); }
  }

  // iOS/iPadOS: stummer Start und sofortiger Stopp bei 0 s, damit gesuchte Bilder erscheinen
  function primeForWebKit() {
    var apple = /iP(hone|ad|od)/.test(navigator.platform) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!apple) return Promise.resolve();
    try {
      var p = video.play();
      if (p && p.then) return p.then(function () { video.pause(); video.currentTime = 0; }).catch(function () {});
      video.pause();
    } catch (e) {}
    return Promise.resolve();
  }

  function progress() {
    var r = track.getBoundingClientRect(), vh = window.innerHeight, lead = vh * LEAD;
    var dist = r.height - vh + lead;
    if (dist <= 0) return 0;
    return Math.min(1, Math.max(0, (lead - r.top) / dist));
  }
  function update() { if (ready) target = progress() * Math.max(0, duration - 0.05); }
  function tick() {
    raf = 0;
    if (!ready) return;
    var diff = target - current;
    current = Math.abs(diff) < 0.004 ? target : current + diff * 0.28;
    if (!seeking && Math.abs(video.currentTime - current) > 1 / 60) video.currentTime = current;
    if (current !== target) requestTick();
  }
  function requestTick() { if (!raf) raf = requestAnimationFrame(tick); }

  window.addEventListener("scroll", function () { if (active) { update(); requestTick(); } }, { passive: true });
  window.addEventListener("resize", function () { if (active) { update(); requestTick(); } }, { passive: true });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      active = entries[0].isIntersecting;
      if (active) { if (!loaded) { loaded = true; loadSource(); } update(); requestTick(); }
    }, { rootMargin: "1200px 0px" }).observe(track);
  } else { active = true; loaded = true; loadSource(); }
})();
