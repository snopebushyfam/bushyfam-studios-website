/*
 * „So läuft’s“ als Szene: Die Bühne bleibt beim Scrollen stehen, die Schritte laufen nacheinander durch.
 * Jeder Schritt bekommt seinen Abstand zur aktuellen Position (--d) und seine Deckkraft (--o) als CSS-Variable;
 * die Bewegung selbst steht im CSS. Die Leiste unten zeigt den Fortschritt und springt per Klick zum Schritt.
 * Ohne JavaScript oder mit reduzierter Bewegung bleibt es bei der einfachen Liste.
 */
(function () {
  "use strict";
  var section = document.querySelector("[data-process]");
  if (!section) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  var track = section.querySelector(".process-track");
  var steps = [].slice.call(section.querySelectorAll("[data-step]"));
  var nav = section.querySelector("[data-process-nav]");
  var dots = nav ? [].slice.call(nav.querySelectorAll("[data-goto]")) : [];
  var n = steps.length;
  if (n < 2 || !track) return;

  section.classList.add("is-pinned");
  if (nav) nav.hidden = false;

  // Etwas Verweilzeit am Anfang und Ende, damit der erste und letzte Schritt nicht sofort weiterrollen
  var HOLD = 0.35;
  var pos = 0, ticking = false, current = -1;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function progress() {
    var r = track.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }

  function render() {
    ticking = false;
    pos = clamp(progress() * (n - 1 + 2 * HOLD) - HOLD, 0, n - 1);
    // Jeder Schritt steht eine Weile still, der Wechsel passiert zügig in der Mitte zwischen zwei Schritten
    var base = Math.min(Math.floor(pos), n - 2), f = clamp((pos - base - 0.3) / 0.4, 0, 1);
    var shown = base + f * f * (3 - 2 * f);
    steps.forEach(function (el, i) {
      var d = clamp(shown - i, -1.2, 1.2);
      var o = clamp(1 - Math.abs(d) * 1.6, 0, 1);
      el.style.setProperty("--d", d.toFixed(4));
      el.style.setProperty("--o", o.toFixed(3));
      el.style.setProperty("--oc", clamp(1 - Math.abs(d) * 2.4, 0, 1).toFixed(3));
      el.style.setProperty("--v", o > 0.01 ? "visible" : "hidden");
      el.toggleAttribute("data-still", Math.abs(d) < 0.001);
    });
    dots.forEach(function (b, i) {
      b.style.setProperty("--f", clamp(pos - i + 1, 0, 1).toFixed(3));
    });
    var active = Math.round(shown);
    if (active !== current) {
      current = active;
      steps.forEach(function (el, i) { el.toggleAttribute("data-active", i === active); el.setAttribute("aria-hidden", i === active ? "false" : "true"); });
      dots.forEach(function (b, i) { if (i === active) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    }
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }

  dots.forEach(function (b) {
    b.addEventListener("click", function () {
      var i = +b.getAttribute("data-goto");
      var span = track.offsetHeight - window.innerHeight;
      var p = (i + HOLD) / (n - 1 + 2 * HOLD);
      var top = window.scrollY + track.getBoundingClientRect().top + p * span;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);

  // Wer währenddessen „Bewegung reduzieren“ einschaltet, bekommt wieder die einfache Liste
  var off = function (e) {
    if (!e.matches) return;
    section.classList.remove("is-pinned");
    if (nav) nav.hidden = true;
    window.removeEventListener("scroll", request);
    window.removeEventListener("resize", request);
    steps.forEach(function (el) { el.removeAttribute("aria-hidden"); el.removeAttribute("style"); });
  };
  if (reduce.addEventListener) reduce.addEventListener("change", off);

  render();
})();
