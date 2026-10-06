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

  /* ---------- Sprachauswahl: schließt bei Klick daneben oder mit Escape ---------- */
  var switches = [].slice.call(document.querySelectorAll("[data-lang-switch]"));
  if (switches.length) {
    document.addEventListener("click", function (e) {
      switches.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      switches.forEach(function (d) { if (d.open) { d.open = false; d.querySelector("summary").focus(); } });
    });
  }

  /* ---------- Objects in Motion: automatische Bewegung, jederzeit anhaltbar ---------- */
  var marquee = document.querySelector("[data-marquee]");
  if (marquee) {
    var rows = [].slice.call(marquee.querySelectorAll("[data-marquee-row]"));
    var toggle = document.querySelector("[data-marquee-toggle]");
    var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reasons = { user: false, offscreen: true, hidden: false, focus: false, reduced: mqReduce.matches };

    /* Bewegung per JavaScript statt CSS-Animation: läuft von selbst, lässt sich aber mit
       Finger oder Maus greifen und anschubsen (schneller, langsamer, rückwärts) – danach
       gleitet das Tempo sanft zurück zur Grundgeschwindigkeit. */
    var motions = [];
    function makeMotion(row, track, perSet) {
      var x = 0, v = 0, half = 0, base = 0, last = 0, raf = 0, vw = 0;
      var drag = null;
      /* Tiefe: vordere Objekte ziehen etwas schneller vorbei, hintere langsamer (Muster wie im CSS: 3n+1 vorn, 3n Mitte, 3n+2 hinten) */
      var items = [].slice.call(track.children).map(function (el, i) { return { el: el, k: [0.1, -0.12, 0][i % 3], left: 0, w: 0 }; });
      function measure() {
        half = track.scrollWidth / 2; vw = window.innerWidth;
        var narrow = vw < 900;
        base = half / (perSet * (narrow ? 13 : 16));
        items.forEach(function (it) { it.left = it.el.offsetLeft; it.w = it.el.offsetWidth; it.f = narrow ? 0.5 : 1; });
      }
      measure();
      window.addEventListener("resize", measure, { passive: true });
      v = isPaused() ? 0 : base;
      // Trackpad: seitliches Wischen schiebt mit, senkrechtes scrollt weiter die Seite
      row.addEventListener("wheel", function (e) {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        x += e.deltaX; v = Math.max(-4000, Math.min(4000, e.deltaX * 8)); apply(); wake();
      }, { passive: false });
      function apply() {
        if (half) { x = ((x % half) + half) % half; }
        track.style.transform = "translate3d(" + (-x).toFixed(2) + "px,0,0)";
        if (reasons.reduced) return;
        for (var i = 0; i < items.length; i++) {
          var it = items[i]; if (!it.k) continue;
          var c = it.left + it.w / 2 - x;
          if (c < -it.w * 2 || c > vw + it.w * 2) continue;
          it.el.style.transform = "translate3d(" + ((c - vw / 2) * it.k * it.f).toFixed(1) + "px,0,0)";
        }
      }
      function frame(t) {
        raf = 0;
        var dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
        last = t;
        if (!drag) {
          var target = isPaused() ? 0 : base;
          v += (target - v) * (1 - Math.exp(-dt * 1.2));
          x += v * dt;
          apply();
        }
        if (drag || Math.abs(v) > 0.5 || !isPaused()) raf = requestAnimationFrame(frame);
        else last = 0;
      }
      function wake() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
      row.addEventListener("pointerdown", function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, active: false };
        wake();
      });
      row.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x, now = performance.now();
        if (!drag.active) {
          if (Math.abs(dx) < 6) return;
          if (Math.abs(e.clientY - drag.y) > Math.abs(dx)) { drag = null; return; } // senkrecht = Seite scrollen
          drag.active = true; row.setPointerCapture(e.pointerId); row.classList.add("is-dragging");
        }
        var dt = Math.max(1, now - drag.t) / 1000;
        drag.vx = drag.vx * 0.6 + (dx / dt) * 0.4;
        x -= dx; apply();
        drag.x = e.clientX; drag.t = now;
      });
      function end(e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        if (drag.active) v = Math.max(-4000, Math.min(4000, -drag.vx));
        drag = null; row.classList.remove("is-dragging"); wake();
      }
      row.addEventListener("pointerup", end);
      row.addEventListener("pointercancel", end);
      row.addEventListener("lostpointercapture", end);
      return { wake: wake };
    }
    function isPaused() { for (var k in reasons) if (reasons[k]) return true; return false; }

    rows.forEach(function (row) {
      var track = row.querySelector("[data-marquee-track]");
      var originals = [].slice.call(track.children);
      if (!originals.length) return;
      function appendCopies(items) {
        items.forEach(function (li) {
          var clone = li.cloneNode(true);
          clone.setAttribute("aria-hidden", "true");
          clone.setAttribute("inert", "");
          var img = clone.querySelector("img");
          if (img) img.setAttribute("alt", "");
          track.appendChild(clone);
        });
      }
      // Ein Durchlauf muss breiter als der Bildschirm sein und eine durch 12 teilbare Zahl an
      // Kacheln haben (die leichten Versätze wiederholen sich alle 3 bzw. 4 Kacheln) – sonst
      // entsteht eine Lücke oder ein Sprung am Übergang.
      var guard = 0;
      while ((track.children.length % 12 || track.scrollWidth < window.innerWidth * 1.5) && guard++ < 50) appendCopies(originals);
      var perSet = track.children.length;
      // Zweiter, identischer Durchlauf: Endlosschleife ist dann nahtlos
      appendCopies([].slice.call(track.children));
      [].forEach.call(track.querySelectorAll("img"), function (im) { im.draggable = false; });
      motions.push(makeMotion(row, track, perSet));
    });
    function refresh() {
      var paused = false;
      for (var k in reasons) if (reasons[k]) paused = true;
      marquee.setAttribute("data-paused", paused ? "true" : "false");
      motions.forEach(function (m) { m.wake(); });
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

  /* ---------- Leistungen: Kachel antippen klappt Text auf, Video läuft nur im Bild ---------- */
  var svcList = document.querySelector(".svc-cards");
  if (svcList) {
    svcList.classList.add("js");
    svcList.addEventListener("click", function (e) {
      var b = e.target.closest(".svc-card-toggle");
      if (!b) return;
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.closest("[data-svc-card]").classList.toggle("is-open", open);
    });
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var vids = svcList.querySelectorAll("[data-svc-video]");
    if (!still && vids.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.35 });
      [].forEach.call(vids, function (v) { io.observe(v); });
    }
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
