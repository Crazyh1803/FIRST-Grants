/* ---------------------------------------------------------------------------
   Rendering + filtering for the grant tracker. Vanilla, no dependencies.
   Data lives in assets/grants.js.
   ------------------------------------------------------------------------- */

(function () {
  "use strict";

  var TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  var STATUS_LABEL = {
    open: "Open now",
    soon: "Deadline ahead",
    rolling: "Rolling",
    watch: "Watch for reopening",
    closed: "Closed",
  };

  var FIT_LABEL = { high: "Strong fit", medium: "Possible fit", low: "Long shot" };
  var FIT_RANK = { high: 0, medium: 1, low: 2 };
  var STATUS_RANK = { open: 0, soon: 1, rolling: 2, watch: 3, closed: 4 };

  /* Default sort is "fit", not "deadline": the strongest-fit opportunities for this
     team are mostly rolling or awaiting a reopening, so a date-first sort buries
     exactly the entries the team should act on. */
  var state = { q: "", category: null, status: null, fit: null, program: null, sort: "fit" };

  /* ------------------------------ helpers ------------------------------ */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function parseDate(iso) {
    if (!iso) return null;
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function daysUntil(iso) {
    var d = parseDate(iso);
    if (!d) return null;
    return Math.round((d - TODAY) / 86400000);
  }

  function formatDate(iso) {
    var d = parseDate(iso);
    if (!d) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function countdownText(days) {
    if (days === null) return "";
    if (days < 0) return "passed " + Math.abs(days) + " day" + (Math.abs(days) === 1 ? "" : "s") + " ago";
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    return "in " + days + " days";
  }

  /* Effective status: a stored "soon"/"open" whose deadline has passed is closed. */
  function effectiveStatus(g) {
    if (g.deadline) {
      var d = daysUntil(g.deadline);
      if (d < 0) return "closed";
      if (d <= 45 && (g.status === "soon" || g.status === "open")) return "soon";
    }
    return g.status;
  }

  /* --------------------------- card rendering -------------------------- */

  function metaRow(term, html) {
    return '<div class="meta-row"><dt>' + esc(term) + "</dt><dd>" + html + "</dd></div>";
  }

  function renderCard(g) {
    var st = effectiveStatus(g);
    var days = g.deadline ? daysUntil(g.deadline) : null;

    var badges = '<span class="badge ' + st + '">' + esc(STATUS_LABEL[st]) + "</span>";
    if (g.fit === "high") badges += '<span class="badge priority">Priority</span>';
    if (g.confirm) badges += '<span class="badge warn" title="At least one detail could not be confirmed on the funder’s own page">&#9888; confirm</span>';

    var tags = (g.programs || [])
      .map(function (p) { return '<span class="tag">' + esc(p) + "</span>"; })
      .join("");
    tags += '<span class="tag">' + esc(CATEGORIES[g.category].label) + "</span>";
    if (g.fit !== "high") tags += '<span class="tag">' + esc(FIT_LABEL[g.fit]) + "</span>";

    var meta = "";
    if (g.deadline) {
      var cls = "countdown" + (days < 0 ? " past" : days <= 30 ? " urgent" : "");
      meta += metaRow("Deadline",
        '<span class="datestamp">' + esc(formatDate(g.deadline)) + "</span> " +
        '<span class="' + cls + '">' + esc(countdownText(days)) + "</span>");
    }
    if (g.window) meta += metaRow(g.deadline ? "Window" : "Timing", esc(g.window));
    if (g.amount) meta += metaRow("Amount", esc(g.amount));

    var elig = (g.eligibility || [])
      .map(function (e) { return "<li>" + esc(e) + "</li>"; })
      .join("");

    var links = (g.links || [])
      .map(function (l, i) {
        return '<a class="link' + (i === 0 ? " primary" : "") + '" href="' + esc(l.url) +
          '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + "</a>";
      })
      .join("");

    return (
      '<article class="card fit-' + g.fit + '" id="g-' + esc(g.id) + '">' +
        "<div><h3>" + esc(g.name) + '</h3><p class="funder">' + esc(g.funder) + "</p></div>" +
        '<div class="statusline">' + badges + "</div>" +
        '<div class="tags">' + tags + "</div>" +
        '<dl class="meta">' + meta + "</dl>" +
        '<p class="why">' + esc(g.why) + "</p>" +
        '<details class="more">' +
          "<summary>Eligibility &amp; next step</summary>" +
          (elig ? '<p class="detail-h">Eligibility</p><ul class="elig">' + elig + "</ul>" : "") +
          (g.action ? '<p class="detail-h">Do this</p><p class="action">' + esc(g.action) + "</p>" : "") +
        "</details>" +
        '<div class="links">' + links + "</div>" +
      "</article>"
    );
  }

  /* ------------------------------ filtering ---------------------------- */

  function matches(g) {
    if (state.category && g.category !== state.category) return false;
    if (state.fit && g.fit !== state.fit) return false;
    if (state.program && (g.programs || []).indexOf(state.program) === -1) return false;

    if (state.status) {
      var st = effectiveStatus(g);
      if (state.status === "actionable") {
        if (st !== "open" && st !== "soon" && st !== "rolling") return false;
      } else if (st !== state.status) return false;
    }

    if (state.q) {
      var hay = [g.name, g.funder, g.amount, g.why, g.action, g.window,
                 CATEGORIES[g.category].label, (g.programs || []).join(" "),
                 (g.eligibility || []).join(" ")].join(" ").toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  function sortFn(a, b) {
    if (state.sort === "name") return a.name.localeCompare(b.name);
    if (state.sort === "funder") return a.funder.localeCompare(b.funder);
    if (state.sort === "fit") {
      var f = FIT_RANK[a.fit] - FIT_RANK[b.fit];
      if (f) return f;
      return STATUS_RANK[effectiveStatus(a)] - STATUS_RANK[effectiveStatus(b)];
    }
    /* deadline: dated-and-upcoming first, then by status, then by name */
    var da = a.deadline ? daysUntil(a.deadline) : null;
    var db = b.deadline ? daysUntil(b.deadline) : null;
    var ua = da !== null && da >= 0;
    var ub = db !== null && db >= 0;
    if (ua && ub) return da - db;
    if (ua) return -1;
    if (ub) return 1;
    var s = STATUS_RANK[effectiveStatus(a)] - STATUS_RANK[effectiveStatus(b)];
    if (s) return s;
    return FIT_RANK[a.fit] - FIT_RANK[b.fit];
  }

  /* ------------------------------ rendering ---------------------------- */

  var grid = document.getElementById("grid");
  var empty = document.getElementById("empty");
  var resultcount = document.getElementById("resultcount");

  function render() {
    var list = GRANTS.filter(matches).sort(sortFn);
    grid.innerHTML = list.map(renderCard).join("");
    empty.hidden = list.length > 0;
    resultcount.textContent =
      list.length + " of " + GRANTS.length + " opportunit" + (GRANTS.length === 1 ? "y" : "ies") + " shown";
  }

  /* -------------------------------- chips ------------------------------ */

  function buildChips(containerId, key, options) {
    var el = document.getElementById(containerId);
    el.innerHTML = options
      .map(function (o) {
        return '<button type="button" class="chip" aria-pressed="false" data-value="' +
          esc(o.value) + '">' + esc(o.label) + "</button>";
      })
      .join("");

    el.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".chip");
      if (!btn) return;
      var v = btn.dataset.value;
      var turningOn = state[key] !== v;
      state[key] = turningOn ? v : null;
      Array.prototype.forEach.call(el.querySelectorAll(".chip"), function (c) {
        c.setAttribute("aria-pressed", String(turningOn && c === btn));
      });
      render();
    });
  }

  function countBy(pred) {
    return GRANTS.filter(pred).length;
  }

  function init() {
    buildChips("chips-category", "category",
      Object.keys(CATEGORIES).map(function (k) {
        return { value: k, label: CATEGORIES[k].label };
      }));

    buildChips("chips-status", "status", [
      { value: "actionable", label: "Actionable now" },
      { value: "open", label: "Open" },
      { value: "soon", label: "Deadline ahead" },
      { value: "rolling", label: "Rolling" },
      { value: "watch", label: "Watch" },
      { value: "closed", label: "Closed" },
    ]);

    buildChips("chips-fit", "fit", [
      { value: "high", label: "Strong fit" },
      { value: "medium", label: "Possible" },
      { value: "low", label: "Long shot" },
    ]);

    buildChips("chips-program", "program", [
      { value: "FTC", label: "FTC" },
      { value: "FRC", label: "FRC" },
      { value: "FLL", label: "FLL" },
    ]);

    document.getElementById("search").addEventListener("input", function (e) {
      state.q = e.target.value.trim().toLowerCase();
      render();
    });

    document.getElementById("sort").addEventListener("change", function (e) {
      state.sort = e.target.value;
      render();
    });

    document.getElementById("stat-total").textContent = GRANTS.length;
    document.getElementById("stat-open").textContent = countBy(function (g) {
      var s = effectiveStatus(g);
      return s === "open" || s === "soon" || s === "rolling";
    });
    document.getElementById("stat-fit").textContent = countBy(function (g) { return g.fit === "high"; });

    var vd = formatDate(VERIFIED);
    var sv = document.getElementById("stat-verified");
    sv.textContent = vd;
    sv.classList.add("small");
    document.getElementById("footer-verified").textContent = vd;

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
