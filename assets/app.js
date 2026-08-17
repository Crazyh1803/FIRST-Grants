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

  var VIEW_KEY = "grantTrackerView";
  var RADAR_DAYS = 90;   /* how far ahead the "closing soonest" strip looks */
  var URGENT_DAYS = 14;
  var DUE_DAYS = 45;     /* matches the promotion boundary in effectiveStatus() */

  /* Default sort is "fit", not "deadline": the strongest-fit opportunities for this
     team are mostly rolling or awaiting a reopening, so a date-first sort buries
     exactly the entries the team should act on. The radar strip above the table is
     what keeps approaching deadlines visible regardless of sort order. */
  var state = {
    q: "", category: null, status: null, fit: null, program: null, gate: null,
    sort: "fit",
    view: "table",
  };

  try {
    var savedView = localStorage.getItem(VIEW_KEY);
    if (savedView === "table" || savedView === "cards") state.view = savedView;
  } catch (e) { /* private mode / storage disabled — the default stands */ }

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

  /* ------------------------ shared cell fragments ---------------------- */

  function metaRow(term, html) {
    return '<div class="meta-row"><dt>' + esc(term) + "</dt><dd>" + html + "</dd></div>";
  }

  function eligList(g) {
    var items = (g.eligibility || [])
      .map(function (e) { return "<li>" + esc(e) + "</li>"; })
      .join("");
    return items ? '<p class="detail-h">Eligibility</p><ul class="elig">' + items + "</ul>" : "";
  }

  function actionBlock(g) {
    return g.action ? '<p class="detail-h">Do this</p><p class="action">' + esc(g.action) + "</p>" : "";
  }

  function linkList(g) {
    return (g.links || [])
      .map(function (l, i) {
        return '<a class="link' + (i === 0 ? " primary" : "") + '" href="' + esc(l.url) +
          '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + "</a>";
      })
      .join("");
  }

  function confirmMark(g) {
    return g.confirm
      ? ' <span class="inline-warn" title="At least one detail could not be confirmed on the funder’s own page">&#9888; confirm</span>'
      : "";
  }

  /* The deadline cell carries the whole "what is closing soon" signal, so it
     renders a date, a remaining-days count, and an urgency class in one place.
     Undated grants show their operational state instead of a blank. */
  function deadlineCell(g) {
    var st = effectiveStatus(g);

    if (g.deadline) {
      var days = daysUntil(g.deadline);
      if (days < 0) {
        return { cls: "dl-past", html: '<span class="dl-state">Closed</span>' };
      }
      var cls = days <= URGENT_DAYS ? "dl-urgent" : days <= DUE_DAYS ? "dl-due" : "dl-ok";
      var left = days === 0 ? "today" : days === 1 ? "1 day left" : days + " days left";
      return {
        cls: cls,
        html: '<span class="dl-date">' + esc(formatDate(g.deadline)) + "</span>" +
              '<span class="dl-left">' + esc(left) + "</span>",
      };
    }

    if (st === "rolling") return { cls: "dl-rolling", html: '<span class="dl-state">Rolling</span>' };
    if (st === "open")    return { cls: "dl-open",    html: '<span class="dl-state">Open now</span>' };
    if (st === "closed")  return { cls: "dl-past",    html: '<span class="dl-state">Closed</span>' };
    return { cls: "dl-watch", html: '<span class="dl-state">Watch</span>' };
  }

  /* --------------------------- table rendering ------------------------- */

  var FIT_DOTS = { high: "●●●", medium: "●●○", low: "●○○" };

  function renderRow(g) {
    var dl = deadlineCell(g);
    var detailId = "d-" + g.id;

    var progs = (g.programs || [])
      .map(function (p) { return '<span class="tag">' + esc(p) + "</span>"; })
      .join("");

    var gate = g.gate
      ? '<span class="badge gate gate-' + esc(g.gate) + '" title="' + esc(GATES[g.gate].blurb) +
        '">' + esc(GATES[g.gate].label) + "</span>"
      : "";

    var first = (g.links || [])[0];
    var go = first
      ? '<a class="link primary rowgo" href="' + esc(first.url) +
        '" target="_blank" rel="noopener noreferrer">Apply<span class="sr-only"> for ' +
        esc(g.name) + "</span></a>"
      : "";

    return (
      '<tr class="grow" id="r-' + esc(g.id) + '" data-fit="' + esc(g.fit) + '">' +
        '<td class="col-fit" data-label="Fit">' +
          '<span class="fitdots" aria-hidden="true">' + FIT_DOTS[g.fit] + "</span>" +
          '<span class="sr-only">' + esc(FIT_LABEL[g.fit]) + "</span>" +
        "</td>" +
        '<td class="col-name" data-label="Grant">' +
          '<button type="button" class="rowtoggle" aria-expanded="false" aria-controls="' +
            detailId + '">' +
            '<span class="rowname">' + esc(g.name) + confirmMark(g) + "</span>" +
            '<span class="rowfunder">' + esc(g.funder) + "</span>" +
          "</button>" +
        "</td>" +
        '<td class="col-prog" data-label="Programme"><span class="tags">' + progs + "</span></td>" +
        '<td class="col-amt" data-label="Amount"' +
          (g.amount ? ' title="' + esc(g.amount) + '"' : "") + '>' +
          '<span class="amt">' + esc(g.amount || "—") + "</span></td>" +
        '<td class="col-due ' + dl.cls + '" data-label="Deadline"' +
          (g.window ? ' title="' + esc(g.window) + '"' : "") + ">" + dl.html + "</td>" +
        '<td class="col-gate" data-label="Blocker">' + gate + "</td>" +
        '<td class="col-go" data-label="">' + go + "</td>" +
      "</tr>" +
      '<tr class="detailrow" id="' + detailId + '" hidden>' +
        '<td colspan="7">' +
          '<div class="detailbox">' +
            '<p class="why">' + esc(g.why) + "</p>" +
            (g.window ? '<p class="detail-h">' + (g.deadline ? "Window" : "Timing") +
              '</p><p class="action">' + esc(g.window) + "</p>" : "") +
            eligList(g) +
            actionBlock(g) +
            '<div class="links">' + linkList(g) + "</div>" +
          "</div>" +
        "</td>" +
      "</tr>"
    );
  }

  /* --------------------------- card rendering -------------------------- */

  function renderCard(g) {
    var st = effectiveStatus(g);
    var days = g.deadline ? daysUntil(g.deadline) : null;

    var badges = '<span class="badge ' + st + '">' + esc(STATUS_LABEL[st]) + "</span>";
    if (g.gate) {
      badges += '<span class="badge gate gate-' + esc(g.gate) + '" title="' +
        esc(GATES[g.gate].blurb) + '">' + esc(GATES[g.gate].label) + "</span>";
    }
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

    return (
      '<article class="card fit-' + g.fit + '" id="g-' + esc(g.id) + '">' +
        "<div><h3>" + esc(g.name) + '</h3><p class="funder">' + esc(g.funder) + "</p></div>" +
        '<div class="statusline">' + badges + "</div>" +
        '<div class="tags">' + tags + "</div>" +
        '<dl class="meta">' + meta + "</dl>" +
        '<p class="why">' + esc(g.why) + "</p>" +
        '<details class="more">' +
          "<summary>Eligibility &amp; next step</summary>" +
          eligList(g) +
          actionBlock(g) +
        "</details>" +
        '<div class="links">' + linkList(g) + "</div>" +
      "</article>"
    );
  }

  /* ------------------------------ filtering ---------------------------- */

  function matches(g) {
    if (state.category && g.category !== state.category) return false;
    if (state.fit && g.fit !== state.fit) return false;
    if (state.gate && g.gate !== state.gate) return false;
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
                 g.gate ? GATES[g.gate].label : "",
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
  var tablewrap = document.getElementById("tablewrap");
  var tbody = document.getElementById("gtbody");
  var empty = document.getElementById("empty");
  var resultcount = document.getElementById("resultcount");
  var radar = document.getElementById("radar");
  var radarwrap = document.querySelector(".radarwrap");

  function render() {
    var list = GRANTS.filter(matches).sort(sortFn);
    var isTable = state.view === "table";

    if (isTable) {
      tbody.innerHTML = list.map(renderRow).join("");
    } else {
      grid.innerHTML = list.map(renderCard).join("");
    }
    tablewrap.hidden = !isTable;
    grid.hidden = isTable;

    empty.hidden = list.length > 0;
    resultcount.textContent =
      list.length + " of " + GRANTS.length + " opportunit" + (GRANTS.length === 1 ? "y" : "ies") + " shown";

    syncSortHeaders();
    syncFilterCount();
  }

  /* The filter panel is collapsed by default so the table sits near the top;
     the badge keeps hidden active filters from being invisible. */
  function syncFilterCount() {
    var active = ["category", "status", "fit", "program", "gate"].filter(function (k) {
      return state[k];
    }).length + (state.q ? 1 : 0);
    var el = document.getElementById("fp-count");
    el.textContent = active;
    el.hidden = active === 0;
    if (active) document.getElementById("filterpanel").open = true;
  }

  /* The radar answers "what is closing soonest" independently of the active sort,
     which is the whole reason a fit-sorted table is still usable for deadlines. */
  function renderRadar() {
    var soon = GRANTS.filter(function (g) {
      if (!g.deadline) return false;
      var d = daysUntil(g.deadline);
      return d >= 0 && d <= RADAR_DAYS;
    }).sort(function (a, b) {
      return daysUntil(a.deadline) - daysUntil(b.deadline);
    });

    if (!soon.length) {
      radarwrap.hidden = true;
      return;
    }
    radarwrap.hidden = false;

    radar.innerHTML = soon
      .map(function (g) {
        var d = daysUntil(g.deadline);
        var cls = d <= URGENT_DAYS ? "urgent" : d <= DUE_DAYS ? "due" : "ok";
        var short = parseDate(g.deadline)
          .toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        return '<a class="radaritem ' + cls + '" href="#r-' + esc(g.id) + '" data-id="' + esc(g.id) + '">' +
          '<span class="radardate">' + esc(short) + "</span>" +
          '<span class="radarname">' + esc(g.funder) + "</span>" +
          '<span class="radardays">' + (d === 0 ? "today" : d === 1 ? "1 day" : d + " days") + "</span>" +
          "</a>";
      })
      .join("");
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

  /* ---------------------------- interactions --------------------------- */

  var sortHeaders = Array.prototype.slice.call(
    document.querySelectorAll("#gtable th[data-sort]")
  );

  function syncSortHeaders() {
    sortHeaders.forEach(function (th) {
      if (th.dataset.sort === state.sort) th.setAttribute("aria-sort", "ascending");
      else th.removeAttribute("aria-sort");
    });
  }

  function setSort(value) {
    state.sort = value;
    document.getElementById("sort").value = value;
    render();
  }

  function wireInteractions() {
    /* Expand a row's detail. Delegated, so it survives every re-render. */
    tbody.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".rowtoggle");
      if (!btn) return;
      var detail = document.getElementById(btn.getAttribute("aria-controls"));
      if (!detail) return;
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      detail.hidden = open;
    });

    sortHeaders.forEach(function (th) {
      th.addEventListener("click", function () { setSort(th.dataset.sort); });
      th.tabIndex = 0;
      th.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          setSort(th.dataset.sort);
        }
      });
    });

    /* Radar jump: a filtered-out row cannot be scrolled to, so clear filters first. */
    radar.addEventListener("click", function (ev) {
      var item = ev.target.closest(".radaritem");
      if (!item) return;
      ev.preventDefault();
      var id = item.dataset.id;

      if (state.view !== "table") setView("table");
      if (!document.getElementById("r-" + id)) {
        clearFilters();
        render();
      }
      var row = document.getElementById("r-" + id);
      if (!row) return;
      row.scrollIntoView({ block: "center", behavior: "smooth" });
      row.classList.remove("rowflash");
      void row.offsetWidth;          /* restart the animation on repeat clicks */
      row.classList.add("rowflash");
      var toggle = row.querySelector(".rowtoggle");
      if (toggle) toggle.focus({ preventScroll: true });
    });
  }

  function clearFilters() {
    state.q = "";
    state.category = state.status = state.fit = state.program = state.gate = null;
    document.getElementById("search").value = "";
    /* The view toggle lives in a .chips container too, but it is not a filter. */
    Array.prototype.forEach.call(
      document.querySelectorAll(".chips:not(#chips-view) .chip"),
      function (c) { c.setAttribute("aria-pressed", "false"); }
    );
  }

  function setView(view) {
    state.view = view;
    try { localStorage.setItem(VIEW_KEY, view); } catch (e) { /* storage disabled */ }
    Array.prototype.forEach.call(
      document.querySelectorAll("#chips-view .chip"),
      function (c) { c.setAttribute("aria-pressed", String(c.dataset.value === view)); }
    );
    render();
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

    buildChips("chips-gate", "gate",
      Object.keys(GATES).map(function (k) {
        return { value: k, label: GATES[k].label };
      }));

    buildChips("chips-program", "program", [
      { value: "FTC", label: "FTC" },
      { value: "FRC", label: "FRC" },
      { value: "FLL", label: "FLL" },
    ]);

    /* The view toggle is exclusive — unlike the filter chips it has no "off" state,
       so it gets its own builder rather than buildChips(). */
    document.getElementById("chips-view").innerHTML = [
      { value: "table", label: "Table" },
      { value: "cards", label: "Cards" },
    ].map(function (o) {
      return '<button type="button" class="chip" aria-pressed="' +
        String(o.value === state.view) + '" data-value="' + o.value + '">' + o.label + "</button>";
    }).join("");

    document.getElementById("chips-view").addEventListener("click", function (ev) {
      var btn = ev.target.closest(".chip");
      if (btn) setView(btn.dataset.value);
    });

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
    document.getElementById("stat-ready").textContent = countBy(function (g) {
      var s = effectiveStatus(g);
      return g.gate === "ready" && s !== "closed" && s !== "watch";
    });

    var vd = formatDate(VERIFIED);
    var sv = document.getElementById("stat-verified");
    sv.textContent = vd;
    sv.classList.add("small");
    document.getElementById("footer-verified").textContent = vd;

    wireInteractions();
    renderRadar();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
