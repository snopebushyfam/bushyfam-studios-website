/*
 * BushyFam Studios – seitenweites Verhalten:
 * Kopfleiste, mobiles Menü, Leistungen zum Aufklappen, Filter auf „Arbeiten“.
 * Alles funktioniert auch ohne dieses Skript (Inhalte sind im HTML vorhanden).
 */
(function () {
  "use strict";

  /* ---------- Kopfleiste: auf der Startseite erst nach dem Scrollen hinterlegt ---------- */
  var header = document.querySelector("[data-header]");
  if (header && document.body.classList.contains("page-home")) {
    var onScroll = function () { header.classList.toggle("solid", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobiles Menü ---------- */
  var btn = document.querySelector("[data-menu-btn]");
  var menu = document.querySelector("[data-menu]");
  if (btn && menu) {
    var mq = window.matchMedia("(min-width: 900px)");
    var setOpen = function (open, returnFocus) {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.style.overflow = open ? "hidden" : "";
      if (open) { var a = menu.querySelector("a"); if (a) a.focus(); }
      else if (returnFocus) btn.focus();
    };
    btn.addEventListener("click", function () { setOpen(menu.hidden, true); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false, false); });
    document.addEventListener("keydown", function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") { setOpen(false, true); return; }
      if (e.key === "Tab") { // Fokus bleibt im Menü
        var f = [btn].concat([].slice.call(menu.querySelectorAll("a"))), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var onMq = function (e) { if (e.matches) setOpen(false, false); };
    mq.addEventListener ? mq.addEventListener("change", onMq) : mq.addListener(onMq);
  }

  /* ---------- Leistungen: große Begriffe zum Aufklappen ---------- */
  [].forEach.call(document.querySelectorAll("[data-acc]"), function (acc) {
    acc.addEventListener("click", function (e) {
      var b = e.target.closest("button[aria-controls]");
      if (!b) return;
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      document.getElementById(b.getAttribute("aria-controls")).hidden = !open;
    });
  });

  /* ---------- Objects in Motion: langsames Schweben (CSS), jederzeit anhaltbar ---------- */
  var marquee = document.querySelector("[data-marquee]");
  if (marquee) {
    var toggle = document.querySelector("[data-marquee-toggle]");
    var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reasons = { user: false, offscreen: true, hidden: false, focus: false, reduced: mqReduce.matches };

    function refresh() {
      var paused = false;
      for (var k in reasons) if (reasons[k]) paused = true;
      marquee.setAttribute("data-paused", paused ? "true" : "false");
      if (toggle) {
        toggle.hidden = reasons.reduced;
        toggle.setAttribute("data-state", reasons.user ? "paused" : "running");
        var label = toggle.querySelector("[data-marquee-toggle-label]");
        if (label) label.textContent = reasons.user ? toggle.dataset.resumeLabel : toggle.dataset.pauseLabel;
      }
    }
    if (toggle) toggle.addEventListener("click", function () { reasons.user = !reasons.user; refresh(); });
    marquee.addEventListener("focusin", function () { reasons.focus = true; refresh(); });
    marquee.addEventListener("focusout", function () { reasons.focus = false; refresh(); });
    document.addEventListener("visibilitychange", function () { reasons.hidden = document.hidden; refresh(); });
    var onReduce = function (e) { reasons.reduced = e.matches; refresh(); };
    mqReduce.addEventListener ? mqReduce.addEventListener("change", onReduce) : mqReduce.addListener(onReduce);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { reasons.offscreen = !entries[0].isIntersecting; refresh(); }, { threshold: 0.01 }).observe(marquee);
    } else { reasons.offscreen = false; }
    refresh();
  }

  /* ---------- Arbeiten: Filter nach Kategorie (Adresse merkt sich die Wahl: #film) ---------- */
  var filters = document.querySelector("[data-filters]");
  var grid = document.querySelector("[data-grid]");
  if (filters && grid) {
    var status = document.querySelector("[data-filter-status]");
    var apply = function (cat, announce) {
      var buttons = filters.querySelectorAll("button[data-cat]"), label = "", n = 0;
      if (![].some.call(buttons, function (b) { return b.dataset.cat === cat; })) cat = "all";
      [].forEach.call(buttons, function (b) {
        var on = b.dataset.cat === cat;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        if (on) label = b.firstChild.textContent;
      });
      [].forEach.call(grid.children, function (li) {
        var show = cat === "all" || li.dataset.cat === cat;
        li.hidden = !show; if (show) n++;
      });
      if (announce && status) {
        var tpl = n === 1 ? (status.dataset.tplOne || status.dataset.tpl) : status.dataset.tpl;
        status.textContent = tpl.replace("{n}", n).replace("{cat}", label);
      }
    };
    filters.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cat]");
      if (!b) return;
      history.replaceState(null, "", b.dataset.cat === "all" ? location.pathname : "#" + b.dataset.cat);
      apply(b.dataset.cat, true);
    });
    apply((location.hash || "").slice(1) || "all", false);
  }
})();
