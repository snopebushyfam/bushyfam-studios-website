/*
 * PixelCard – Pixel-Effekt hinter den Paket-Karten.
 * Portierung der React-Bits-Komponente „PixelCard“ (JS + CSS) ohne React:
 * Jede Karte mit [data-pixel-card] bekommt ein <canvas> als Hintergrund. Beim Überfahren
 * oder Fokussieren (auch Tastatur-Fokus auf dem Link in der Karte) läuft eine Pixelwelle
 * von der Mitte aus über die Karte, ein weiches Licht folgt dem Zeiger.
 * Optionen kommen aus data-Attributen der Karte (data-pc-*), sonst die Standardwerte unten.
 * Respektiert „Bewegung reduzieren“: dann erscheinen die Pixel ohne Animation.
 */
(function () {
  "use strict";
  var cards = document.querySelectorAll("[data-pixel-card]");
  if (!cards.length || !window.requestAnimationFrame) return;

  var SHAPES = { square: 0, circle: 1, diamond: 2 };
  var APPEAR = 0.26;
  var EXIT = 0.22;
  var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };
  var smoothstep = function (e0, e1, v) { var t = clamp((v - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  var easeOutBack = function (t) { var c = 1.9, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
  var toRgb = (function () {
    var ctx = null;
    return function (color) {
      if (!ctx) { var c = document.createElement("canvas"); c.width = c.height = 1; ctx = c.getContext("2d", { willReadFrequently: true }); }
      if (!ctx) return [255, 255, 255];
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#fff"; ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
      var d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
    };
  })();

  function num(el, name, def) { var v = el.getAttribute("data-pc-" + name); return v === null || v === "" ? def : Number(v); }
  function str(el, name, def) { var v = el.getAttribute("data-pc-" + name); return v === null || v === "" ? def : v; }

  function PixelCard(container, index) {
    var s = {
      colors: str(container, "colors", "#f8fafc,#f1f5f9,#cbd5e1").split(",").map(function (c) { return c.trim(); }).filter(Boolean),
      gap: Math.max(2, num(container, "gap", 5)),
      speed: clamp(num(container, "speed", 35), 0, 100),
      pixelSize: Math.max(0.5, num(container, "pixel-size", 2)),
      shape: SHAPES[str(container, "shape", "square")] || 0,
      origin: str(container, "origin", "center"),
      revealDuration: Math.max(50, num(container, "reveal", 600)),
      spotlight: clamp(num(container, "spotlight", 0.5), 0, 1),
      glow: clamp(num(container, "glow", 0.5), 0, 1),
      glowColor: toRgb(str(container, "glow-color", "#cbd5e1")),
      opacity: clamp(num(container, "opacity", 0.35), 0, 1),
      fade: clamp(num(container, "fade", 0.7), 0, 1),
      clickPulse: str(container, "click-pulse", "true") !== "false",
      intro: str(container, "intro", "true") !== "false",
      introDelay: Math.max(0, num(container, "intro-delay", index * 140))
    };
    var canvas = document.createElement("canvas");
    canvas.className = "pixel-card-canvas";
    canvas.setAttribute("aria-hidden", "true");
    container.insertBefore(canvas, container.firstChild);
    container.classList.add("pixel-card");
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

    var st = {
      raf: 0, last: 0, time: 0, visible: true, width: 0, height: 0, ratio: 1, key: "", count: 0,
      x: new Float32Array(0), y: new Float32Array(0), tint: new Uint8Array(0), size: new Float32Array(0),
      phase: new Float32Array(0), rate: new Float32Array(0), jitter: new Float32Array(0),
      presence: new Float32Array(0), delay: new Float32Array(0), mask: new Float32Array(0), maskKey: "",
      active: false, changedAt: 0, originX: 0, originY: 0, maxDistance: 1,
      pointerX: 0, pointerY: 0, spotX: 0, spotY: 0, spotVX: 0, spotVY: 0, spotPower: 0,
      hovering: false, pulses: [], dt: 1 / 60, releaseAt: -1, introAt: -1
    };

    function schedule() {
      var span = s.revealDuration / 1000, far = 1, i;
      for (i = 0; i < st.count; i++) far = Math.max(far, Math.hypot(st.x[i] - st.originX, st.y[i] - st.originY));
      st.maxDistance = far;
      for (i = 0; i < st.count; i++) {
        var d = Math.hypot(st.x[i] - st.originX, st.y[i] - st.originY) / far;
        st.delay[i] = st.active ? d * span * 0.82 + st.jitter[i] * span * 0.18 : (1 - d) * span * 0.45 + st.jitter[i] * span * 0.1;
      }
    }

    function build() {
      var rect = container.getBoundingClientRect();
      var width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var key = [width, height, ratio].join("|");
      if (key === st.key) return;
      st.key = key; st.width = width; st.height = height; st.ratio = ratio;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      var columns = Math.floor((width - 1) / s.gap) + 1, rows = Math.floor((height - 1) / s.gap) + 1;
      var offX = (width - (columns - 1) * s.gap) / 2, offY = (height - (rows - 1) * s.gap) / 2;
      var count = columns * rows, prev = st.presence;
      st.count = count;
      st.x = new Float32Array(count); st.y = new Float32Array(count); st.tint = new Uint8Array(count);
      st.size = new Float32Array(count); st.phase = new Float32Array(count); st.rate = new Float32Array(count);
      st.jitter = new Float32Array(count); st.presence = new Float32Array(count); st.delay = new Float32Array(count);
      var i = 0;
      for (var c = 0; c < columns; c++) for (var r = 0; r < rows; r++) {
        st.x[i] = offX + c * s.gap; st.y[i] = offY + r * s.gap;
        st.tint[i] = Math.floor(Math.random() * s.colors.length);
        st.size[i] = s.pixelSize * (0.25 + Math.random() * 0.75);
        st.phase[i] = Math.random() * Math.PI * 2; st.rate[i] = 0.55 + Math.random() * 0.9; st.jitter[i] = Math.random();
        if (prev.length) st.presence[i] = prev[Math.min(i, prev.length - 1)];
        i++;
      }
      st.maskKey = "";
      if (!st.originX && !st.originY) { st.originX = width / 2; st.originY = height / 2; }
      schedule();
    }

    function setActive(value, x, y) {
      if (st.active === value) return;
      st.active = value; st.changedAt = st.time;
      if (value) {
        var usePointer = s.origin === "pointer" && x !== undefined;
        st.originX = usePointer ? x : st.width / 2; st.originY = usePointer ? y : st.height / 2;
      }
      schedule();
      if (value) container.setAttribute("data-active", ""); else container.removeAttribute("data-active");
      wake();
    }

    function draw() {
      var width = st.width, height = st.height, i;
      ctx.setTransform(st.ratio, 0, 0, st.ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      var maskKey = st.count + "|" + width + "|" + height;
      if (st.maskKey !== maskKey) {
        st.maskKey = maskKey; st.mask = new Float32Array(st.count);
        var near = Math.min(width, height) * 0.05, farM = Math.min(width, height) * 0.42;
        for (i = 0; i < st.count; i++) {
          var edge = Math.min(st.x[i], width - st.x[i], st.y[i], height - st.y[i]);
          var t = clamp((edge - near) / (farM - near), 0, 1);
          st.mask[i] = 1 - s.fade * t * t * t * (t * (t * 6 - 15) + 10);
        }
      }
      var sum = 0, elapsed = st.time - st.changedAt, up = st.dt / APPEAR, down = st.dt / EXIT;
      for (i = 0; i < st.count; i++) {
        var cur = st.presence[i], ready = elapsed >= st.delay[i] || reduce;
        var target = st.active ? (ready ? 1 : 0) : ready ? 0 : cur;
        if (reduce) st.presence[i] = target;
        else if (target > cur) st.presence[i] = Math.min(1, cur + up);
        else if (target < cur) st.presence[i] = Math.max(0, cur - down);
        sum += st.presence[i];
      }
      var avg = st.count ? sum / st.count : 0;
      if (s.glow > 0 && avg > 0.001) {
        var g = s.glowColor;
        var cx = st.spotPower > 0.01 ? st.spotX : st.originX, cy = st.spotPower > 0.01 ? st.spotY : st.originY;
        var reach = Math.max(width, height) * 0.85;
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach);
        var strength = s.glow * s.opacity * 0.32 * Math.min(1, avg * 1.4);
        grad.addColorStop(0, "rgba(" + g[0] + "," + g[1] + "," + g[2] + "," + strength + ")");
        grad.addColorStop(0.45, "rgba(" + g[0] + "," + g[1] + "," + g[2] + "," + strength * 0.35 + ")");
        grad.addColorStop(1, "rgba(" + g[0] + "," + g[1] + "," + g[2] + ",0)");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
      }
      var spotRadius = Math.min(width, height) * 0.38 + 30, spotStrength = s.spotlight * st.spotPower;
      var twinkle = !reduce && s.speed > 0, freq = (s.speed / 35) * 1.35, pulses = st.pulses;
      for (var color = 0; color < s.colors.length; color++) {
        ctx.fillStyle = s.colors[color];
        for (i = 0; i < st.count; i++) {
          if (st.tint[i] !== color) continue;
          var pr = st.presence[i];
          if (pr <= 0.002) continue;
          var x = st.x[i], y = st.y[i], size = st.size[i], alpha = 0.5 + pr * 0.38;
          if (twinkle) {
            var wave = Math.sin(st.phase[i] + st.time * freq * st.rate[i]);
            size *= 0.62 + 0.38 * wave;
            alpha += 0.12 * wave + (st.jitter[i] > 0.92 ? 0.35 * Math.max(0, wave) : 0);
          }
          size *= easeOutBack(pr);
          var flash = pr < 1 && st.active ? Math.sin(pr * Math.PI) : 0;
          size *= 1 + flash * 0.9; alpha += flash * 0.6;
          if (spotStrength > 0.001) {
            var nearS = smoothstep(spotRadius, 0, Math.hypot(x - st.spotX, y - st.spotY));
            size *= 1 + spotStrength * nearS * nearS * 2.4; alpha += spotStrength * nearS * 0.45;
          }
          alpha = Math.min(1, alpha) * st.mask[i] * s.opacity;
          if (alpha <= 0.004) continue;
          for (var p = 0; p < pulses.length; p++) {
            var band = (Math.hypot(x - pulses[p].x, y - pulses[p].y) - pulses[p].radius) / 26;
            var pw = Math.exp(-band * band) * pulses[p].power;
            size *= 1 + pw * 1.4; alpha = Math.min(1, alpha + pw * 0.5);
          }
          if (size <= 0.05) continue;
          ctx.globalAlpha = alpha;
          if (s.shape === 1) { ctx.beginPath(); ctx.arc(x, y, size * 0.5, 0, Math.PI * 2); ctx.fill(); }
          else if (s.shape === 2) { var h = size * 0.62; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + h, y); ctx.lineTo(x, y + h); ctx.lineTo(x - h, y); ctx.closePath(); ctx.fill(); }
          else ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
        }
      }
      ctx.globalAlpha = 1;
      return sum;
    }

    function frame(now) {
      st.raf = 0;
      var dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 1 / 60;
      st.last = now; st.dt = dt; st.time += dt;
      build();
      if (st.introAt >= 0 && st.time >= st.introAt) {
        st.introAt = -1;
        if (!st.active) { setActive(true); st.releaseAt = st.time + s.revealDuration / 1000 + 0.7; }
      }
      if (st.releaseAt >= 0 && st.time >= st.releaseAt && !st.hovering && !st.focused) { st.releaseAt = -1; setActive(false); }
      var want = st.hovering && !reduce ? 1 : 0;
      st.spotPower += (want - st.spotPower) * (1 - Math.exp(-(want ? 6 : 3) * dt));
      var k = 120, damp = 2 * Math.sqrt(k) * 0.9;
      st.spotVX += (k * (st.pointerX - st.spotX) - damp * st.spotVX) * dt;
      st.spotVY += (k * (st.pointerY - st.spotY) - damp * st.spotVY) * dt;
      st.spotX += st.spotVX * dt; st.spotY += st.spotVY * dt;
      var pulseSpeed = st.maxDistance / Math.max(0.35, (s.revealDuration / 1000) * 0.9);
      st.pulses = st.pulses.filter(function (pl) { pl.radius += pulseSpeed * dt; pl.power = Math.max(0, 1 - pl.radius / (st.maxDistance + 40)); return pl.power > 0; });
      var presence = draw();
      var settling = st.active || st.introAt >= 0 || presence > 0 || st.pulses.length > 0 || st.spotPower > 0.002 || Math.abs(st.spotVX) + Math.abs(st.spotVY) > 0.5;
      if (settling && st.visible) st.raf = requestAnimationFrame(frame); else st.last = 0;
    }
    function wake() { if (!st.raf && st.visible) st.raf = requestAnimationFrame(frame); }
    function local(e) { var r = container.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

    container.addEventListener("pointerenter", function (e) {
      var p = local(e);
      st.hovering = e.pointerType !== "touch"; st.pointerX = p[0]; st.pointerY = p[1];
      if (st.spotPower < 0.01) { st.spotX = p[0]; st.spotY = p[1]; st.spotVX = st.spotVY = 0; }
      st.releaseAt = -1; st.introAt = -1; setActive(true, p[0], p[1]); wake();
    });
    container.addEventListener("pointermove", function (e) { var p = local(e); st.pointerX = p[0]; st.pointerY = p[1]; wake(); });
    container.addEventListener("pointerleave", function (e) {
      st.hovering = false;
      if (e.pointerType === "touch") st.releaseAt = st.time + 1.2; else if (!st.focused) setActive(false);
      wake();
    });
    container.addEventListener("pointerdown", function (e) {
      var p = local(e);
      if (!st.active) setActive(true, p[0], p[1]);
      if (s.clickPulse && !reduce && st.active) st.pulses.push({ x: p[0], y: p[1], radius: 0, power: 1 });
      wake();
    });
    // Tastatur: Fokus auf dem Link in der Karte startet den Effekt wie Überfahren
    container.addEventListener("focusin", function () { st.focused = true; setActive(true); });
    container.addEventListener("focusout", function (e) { if (container.contains(e.relatedTarget)) return; st.focused = false; if (!st.hovering) setActive(false); });

    if (window.ResizeObserver) new ResizeObserver(function () { build(); wake(); }).observe(container);
    var introStarted = false;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        st.visible = entries.some(function (en) { return en.isIntersecting; });
        if (st.visible && !introStarted && s.intro && !reduce) { introStarted = true; build(); st.introAt = st.time + s.introDelay / 1000; }
        if (st.visible) wake();
      }).observe(container);
    }
    build();
    st.pointerX = st.spotX = st.width / 2; st.pointerY = st.spotY = st.height / 2;
  }

  [].forEach.call(cards, function (card, i) { PixelCard(card, i); });
})();
