/*
 * Kontaktformular.
 * - Prüft Eingaben und zeigt verständliche Fehler (mit Sprunglinks).
 * - Spam-Schutz ohne Drittanbieter: unsichtbares Feld + Mindestzeit.
 * - Versand erst, wenn im Admin „Formular freigeschaltet“ aktiv ist (data-live).
 *   Vorher wird nichts übertragen und das auch klar gesagt.
 */
(function () {
  "use strict";
  var form = document.querySelector("[data-form]");
  if (!form) return;
  var t = {};
  try { t = JSON.parse(document.getElementById("form-i18n").textContent); } catch (e) { return; }

  var live = form.getAttribute("data-live") === "true";
  var summary = form.querySelector("[data-summary]");
  var result = form.querySelector("[data-result]");
  var honeypot = form.querySelector('[name="bot-field"]');
  var MIN_FILL_MS = 3000, firstInteraction = 0, sending = false;
  form.addEventListener("focusin", function () { if (!firstInteraction) firstInteraction = Date.now(); });

  // Kommt man von einer Person aus der Besetzung, steht sie gleich in der Nachricht
  try {
    var who = new URLSearchParams(location.search).get("person");
    var msg = document.getElementById("f-nachricht");
    if (who && msg && !msg.value) msg.value = (t.aboutPerson || "Anfrage zu") + ": " + who + "\n\n";
  } catch (e) {}

  var rules = [
    { id: "f-name", check: function (v) { return v.trim() ? "" : t.errName; } },
    { id: "f-email", check: function (v) {
        v = v.trim();
        if (!v) return t.errEmail;
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : t.errEmailFormat;
      } },
    { id: "f-nachricht", check: function (v) { return v.trim() ? "" : t.errMessage; } }
  ];

  function setError(input, msg) {
    var err = document.getElementById(input.id.replace(/^f-/, "e-"));
    if (msg) { input.setAttribute("aria-invalid", "true"); err.textContent = msg; err.hidden = false; }
    else { input.removeAttribute("aria-invalid"); err.textContent = ""; err.hidden = true; }
  }
  rules.forEach(function (r) {
    var input = document.getElementById(r.id);
    if (!input) return;
    input.addEventListener("blur", function () { if (input.getAttribute("aria-invalid") === "true" || input.value) setError(input, r.check(input.value)); });
    input.addEventListener("input", function () { if (input.getAttribute("aria-invalid") === "true") setError(input, r.check(input.value)); });
  });

  function looksLikeSpam() {
    if (honeypot && honeypot.value.trim() !== "") return "honeypot";
    if (!firstInteraction || Date.now() - firstInteraction < MIN_FILL_MS) return "too-fast";
    return "";
  }
  function show(msg, cls) { result.textContent = msg; result.className = "result" + (cls ? " " + cls : ""); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    show("", "");
    var errors = [];
    rules.forEach(function (r) {
      var input = document.getElementById(r.id);
      var msg = r.check(input.value);
      setError(input, msg);
      if (msg) errors.push({ id: r.id, msg: msg });
    });
    if (errors.length) {
      summary.hidden = false;
      summary.innerHTML = "<p><strong>" + (errors.length === 1 ? t.summaryOne : t.summaryMany.replace("{n}", errors.length)) +
        "</strong></p><ul>" + errors.map(function (er) {
          return '<li><a href="#' + er.id + '">' + er.msg + "</a></li>";
        }).join("") + "</ul>";
      summary.focus();
      return;
    }
    summary.hidden = true; summary.innerHTML = "";

    var spam = looksLikeSpam();
    form.setAttribute("data-spam-check", spam || "ok");
    if (spam) return; // still verwerfen, kein Hinweis für Bots

    if (!live) { show(t.previewResult, "ok"); return; }

    // Versand an Netlify Forms
    sending = true; show(t.sending, "");
    var data = new URLSearchParams();
    new FormData(form).forEach(function (v, k) { if (k !== "bot-field") data.append(k, v); });
    fetch(form.getAttribute("action") || location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: data.toString()
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      form.reset();
      show(t.success, "ok");
    }).catch(function () {
      show(t.failure, "fail");
    }).then(function () { sending = false; });
  });

  summary.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (target) { target.focus(); target.scrollIntoView({ block: "center" }); }
  });
})();
