/*
 * Kontaktformular → Netlify Forms.
 * - Prüft Eingaben und zeigt verständliche Fehler (mit Sprunglinks).
 * - Spam-Schutz: unsichtbares Feld (netlify-honeypot) + Netlifys eigener Spamfilter.
 * - Erfolg wird nur gemeldet, wenn Netlify die Anfrage angenommen hat (HTTP 2xx).
 * - Ohne JavaScript schickt der Browser das Formular normal ab und landet auf der Danke-Seite.
 */
(function () {
  "use strict";
  var form = document.querySelector("[data-form]");
  if (!form) return;
  var t = {};
  try { t = JSON.parse(document.getElementById("form-i18n").textContent); } catch (e) { return; }

  var summary = form.querySelector("[data-summary]");
  var result = form.querySelector("[data-result]");
  var submit = form.querySelector("[data-submit]");
  var done = document.querySelector("[data-done]");
  var honeypot = form.querySelector('[name="bot-field"]');
  var waUrl = form.getAttribute("data-wa");
  var submitLabel = submit ? submit.textContent : "";
  var sending = false;

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

  function show(text, cls, withWa) {
    result.className = "result" + (cls ? " " + cls : "");
    result.textContent = text;
    if (withWa && waUrl) {
      var a = document.createElement("a");
      a.href = waUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "WhatsApp ↗";
      result.appendChild(document.createTextNode(" "));
      result.appendChild(a);
    }
  }
  function setBusy(on) {
    sending = on;
    if (!submit) return;
    submit.disabled = on;
    submit.setAttribute("aria-busy", on ? "true" : "false");
    submit.textContent = on ? t.sending : submitLabel;
  }

  // Feldwerte für Netlify: Mehrfachauswahl („leistungen“) als ein Feld, sonst käme nur ein Wert an
  function payload() {
    var data = new URLSearchParams(), services = [];
    new FormData(form).forEach(function (v, k) {
      if (k === "leistungen") services.push(v); else data.append(k, v);
    });
    data.append("leistungen", services.join(", "));
    return data.toString();
  }

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

    // Bot hat das unsichtbare Feld ausgefüllt: nichts senden, nichts verraten
    if (honeypot && honeypot.value.trim() !== "") return;

    setBusy(true);
    show(t.sending, "");
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: payload()
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      form.reset();
      show("", "");
      if (done) {
        form.hidden = true;
        done.hidden = false;
        done.focus();
      } else {
        show(t.successTitle + " " + t.success, "ok");
      }
    }).catch(function () {
      show(waUrl ? t.failure : t.failureNoWa, "fail", true);
    }).then(function () { setBusy(false); });
  });

  if (done) {
    var again = done.querySelector("[data-again]");
    if (again) again.addEventListener("click", function () {
      done.hidden = true;
      form.hidden = false;
      var first = document.getElementById("f-name");
      if (first) first.focus();
    });
  }

  summary.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    var target = document.getElementById(a.getAttribute("href").slice(1));
    if (target) { target.focus(); target.scrollIntoView({ block: "center" }); }
  });
})();
