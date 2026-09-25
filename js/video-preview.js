/*
 * Portfolio-Clips: Es wird nichts vorab geladen.
 * Erst beim Klick auf „abspielen“ entsteht das <video>-Element mit Bedienelementen.
 */
(function () {
  "use strict";
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-clip-play]");
    if (!btn) return;
    var frame = btn.closest("[data-clip]");
    var src = frame && frame.getAttribute("data-src");
    if (!src) return;
    var label = btn.getAttribute("data-title") || "Clip";

    var video = document.createElement("video");
    video.src = src;
    video.controls = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-label", label);
    frame.innerHTML = "";
    frame.appendChild(video);
    video.focus();

    // Wiedergabe startet ausschließlich durch diese Nutzeraktion.
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* Browser verlangt ggf. zweiten Klick auf Play */ });

    video.addEventListener("error", function () {
      frame.innerHTML = '<div class="placeholder"><p>Der Clip konnte nicht geladen werden.</p></div>';
    });

    // Nur ein Clip gleichzeitig
    document.querySelectorAll("[data-clip] video").forEach(function (v) {
      if (v !== video) v.pause();
    });
  });
})();

/* Mobil: fokussierten Clip in der wischbaren Leiste vollständig sichtbar machen */
(function () {
  "use strict";
  document.addEventListener("focusin", function (e) {
    var clip = e.target.closest && e.target.closest(".clip");
    var list = clip && clip.parentElement;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var left = clip.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft || 0);
    var visibleStart = list.scrollLeft, visibleEnd = list.scrollLeft + list.clientWidth;
    if (clip.offsetLeft < visibleStart || clip.offsetLeft + clip.offsetWidth > visibleEnd) {
      list.scrollTo({ left: left, behavior: reduce ? "auto" : "smooth" });
    }
  });
})();
