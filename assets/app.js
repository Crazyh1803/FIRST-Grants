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
  var CUSTOM_KEY = "grantTrackerCustom";
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

  /* --------------------- user-added grants (storage) ------------------- */

  /* Grants the team finds themselves live in localStorage and are merged into
     the researched list. Nothing here is trusted: every field is re-validated
     on load, because storage can be edited by hand or carried over from an
     older version of the page. */
  var custom = [];
  var storageOK = true;

  function safeUrl(u) {
    return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null;
  }

  function sanitizeGrant(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (!raw.name || !raw.funder) return null;

    var links = (Array.isArray(raw.links) ? raw.links : [])
      .map(function (l) {
        var u = safeUrl(l && l.url);
        return u ? { label: String(l.label || "Apply").slice(0, 80), url: u } : null;
      })
      .filter(Boolean);
    if (!links.length) return null;

    var progs = (Array.isArray(raw.programs) ? raw.programs : [])
      .filter(function (p) { return p === "FTC" || p === "FRC" || p === "FLL"; });

    return {
      id: String(raw.id || "user-" + Date.now()).slice(0, 60),
      custom: true,
      name: String(raw.name).slice(0, 160),
      funder: String(raw.funder).slice(0, 160),
      category: CATEGORIES[raw.category] ? raw.category : "corporate",
      programs: progs.length ? progs : ["FTC", "FRC"],
      amount: raw.amount ? String(raw.amount).slice(0, 160) : "",
      fit: ["high", "medium", "low"].indexOf(raw.fit) > -1 ? raw.fit : "medium",
      gate: GATES[raw.gate] ? raw.gate : null,
      status: ["open", "soon", "rolling", "watch", "closed"].indexOf(raw.status) > -1
        ? raw.status : "rolling",
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(raw.deadline || "") ? raw.deadline : null,
      window: raw.window ? String(raw.window).slice(0, 400) : "",
      why: raw.why ? String(raw.why).slice(0, 800) : "Added by your team.",
      eligibility: (Array.isArray(raw.eligibility) ? raw.eligibility : [])
        .map(function (e) { return String(e).slice(0, 300); }).slice(0, 20),
      action: raw.action ? String(raw.action).slice(0, 800) : "",
      links: links.slice(0, 5),

      /* Submission tracking, so a submitter can see what has actually gone out. */
      submittedAt: /^\d{4}-\d{2}-\d{2}/.test(raw.submittedAt || "") ? raw.submittedAt : null,
      submittedVia: ["email", "github", "copy"].indexOf(raw.submittedVia) > -1
        ? raw.submittedVia : null,
      submitter: raw.submitter ? String(raw.submitter).slice(0, 80) : "",
    };
  }

  /* The fields the formal dataset carries. Submission bookkeeping and the
     `custom` flag are local-only and must not leak into assets/grants.js. */
  var SOURCE_KEYS = ["id", "name", "funder", "category", "programs", "amount", "fit", "gate",
                     "status", "deadline", "window", "why", "eligibility", "action", "links"];

  /* Serialised in the file's own style — unquoted identifier keys, 2-space
     indent — so an approved entry pastes into GRANTS without reformatting. */
  function toSourceEntry(g, indent) {
    var pad = indent || "  ";
    var inner = pad + "  ";

    function val(v, depth) {
      if (v === null) return "null";
      if (typeof v === "number" || typeof v === "boolean") return String(v);
      if (typeof v === "string") return JSON.stringify(v);
      if (Array.isArray(v)) {
        if (!v.length) return "[]";
        var simple = v.every(function (x) { return typeof x === "string" && x.length < 24; });
        if (simple) return "[" + v.map(function (x) { return JSON.stringify(x); }).join(", ") + "]";
        return "[\n" + v.map(function (x) {
          return depth + "  " + val(x, depth + "  ");
        }).join(",\n") + "\n" + depth + "]";
      }
      return "{ " + Object.keys(v).map(function (k) {
        return k + ": " + JSON.stringify(v[k]);
      }).join(", ") + " }";
    }

    var body = SOURCE_KEYS.filter(function (k) {
      var v = g[k];
      return v !== undefined && v !== "" && !(Array.isArray(v) && !v.length);
    }).map(function (k) {
      return inner + k + ": " + val(g[k], inner);
    }).join(",\n");

    return pad + "{\n" + body + ",\n" + pad + "},";
  }

  function loadCustom() {
    try {
      var parsed = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]");
      custom = (Array.isArray(parsed) ? parsed : []).map(sanitizeGrant).filter(Boolean);
    } catch (e) {
      custom = [];
    }
  }

  function saveCustom() {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
      storageOK = true;
    } catch (e) {
      storageOK = false;
    }
  }

  /* Everything downstream reads this, never GRANTS directly. */
  function allGrants() {
    return GRANTS.concat(custom);
  }

  /* ----------------------- forwarding a submission --------------------- */

  var PASTE_MARKER = "--- paste into assets/grants.js ---";

  function adminEmail() {
    return ADMIN.emailUser + "@" + ADMIN.emailHost;
  }

  function submissionText(g) {
    var lines = [
      "New grant for the FIRST Grant Tracker.",
      "",
      "Grant:    " + g.name,
      "Funder:   " + g.funder,
      "Link:     " + (g.links[0] ? g.links[0].url : ""),
      "Deadline: " + (g.deadline ? formatDate(g.deadline) : g.window || "no fixed date"),
      "Amount:   " + (g.amount || "not stated"),
    ];
    if (g.submitter) lines.push("Found by: " + g.submitter);
    if (g.why) lines.push("", "Why it fits:", g.why);
    lines.push("", PASTE_MARKER, toSourceEntry(g), "");
    return lines.join("\n");
  }

  function mailtoUrl(g) {
    var subject = "[Grant Tracker] New grant: " + g.name;
    var body = submissionText(g);
    var url = "mailto:" + adminEmail() +
      "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

    /* Mail clients silently truncate very long mailto URLs, which would ship a
       half-written entry. Past the limit, send the summary and say where the
       full entry is rather than losing part of it. */
    if (url.length > 1900) {
      var short = submissionText(g).split(PASTE_MARKER)[0] +
        "(The full entry was too long for an email link — it is on my clipboard, " +
        "pasted below or in a follow-up.)\n";
      url = "mailto:" + adminEmail() +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(short);
    }
    return url;
  }

  function issueUrl(g) {
    var body = [
      "**Submitted through the Grant Tracker.**",
      "",
      "| | |",
      "| --- | --- |",
      "| Funder | " + g.funder + " |",
      "| Link | " + (g.links[0] ? g.links[0].url : "") + " |",
      "| Deadline | " + (g.deadline ? formatDate(g.deadline) : g.window || "no fixed date") + " |",
      "| Amount | " + (g.amount || "not stated") + " |",
      g.submitter ? "| Found by | " + g.submitter + " |" : "",
      "",
      g.why ? "> " + g.why : "",
      "",
      "Approve by pasting this into the `GRANTS` array in `assets/grants.js`:",
      "",
      "```js",
      toSourceEntry(g),
      "```",
    ].filter(function (l) { return l !== ""; }).join("\n");

    return "https://github.com/" + ADMIN.repo + "/issues/new" +
      "?labels=" + encodeURIComponent(ADMIN.issueLabel) +
      "&title=" + encodeURIComponent("New grant: " + g.name) +
      "&body=" + encodeURIComponent(body);
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

  function yoursMark(g) {
    if (!g.custom) return "";
    if (g.submittedAt) {
      return ' <span class="badge yours sent" title="Sent to the admin for approval on ' +
        esc(formatDate(g.submittedAt.slice(0, 10))) + '">Sent</span>';
    }
    return ' <span class="badge yours" title="Added by your team, stored in this browser. Not sent to the admin yet.">Draft</span>';
  }

  function editBtn(g) {
    if (!g.custom) return "";
    var sent = g.submittedAt
      ? "Sent " + formatDate(g.submittedAt.slice(0, 10)) + " · resend"
      : "Send to admin";
    return '<button type="button" class="editbtn" data-edit="' + esc(g.id) +
      '">Edit<span class="sr-only"> ' + esc(g.name) + "</span></button>" +
      '<button type="button" class="editbtn sendbtn" data-send="' + esc(g.id) + '">' +
      esc(sent) + '<span class="sr-only"> ' + esc(g.name) + "</span></button>";
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

  /* `pfx` namespaces the element ids so the admin panel can render preview rows
     with the same markup without colliding with the live table. */
  function renderRow(g, pfx) {
    var p = pfx || "";
    var dl = deadlineCell(g);
    var detailId = p + "d-" + g.id;

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
      '<tr class="grow" id="' + p + "r-" + esc(g.id) + '" data-fit="' + esc(g.fit) + '">' +
        '<td class="col-fit" data-label="Fit">' +
          '<span class="fitdots" aria-hidden="true">' + FIT_DOTS[g.fit] + "</span>" +
          '<span class="sr-only">' + esc(FIT_LABEL[g.fit]) + "</span>" +
        "</td>" +
        '<td class="col-name" data-label="Grant">' +
          '<button type="button" class="rowtoggle" aria-expanded="false" aria-controls="' +
            detailId + '">' +
            '<span class="rowname">' + esc(g.name) + yoursMark(g) + confirmMark(g) + "</span>" +
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
            '<div class="links">' + linkList(g) + editBtn(g) + "</div>" +
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
        "<div><h3>" + esc(g.name) + yoursMark(g) + '</h3><p class="funder">' + esc(g.funder) + "</p></div>" +
        '<div class="statusline">' + badges + "</div>" +
        '<div class="tags">' + tags + "</div>" +
        '<dl class="meta">' + meta + "</dl>" +
        '<p class="why">' + esc(g.why) + "</p>" +
        '<details class="more">' +
          "<summary>Eligibility &amp; next step</summary>" +
          eligList(g) +
          actionBlock(g) +
        "</details>" +
        '<div class="links">' + linkList(g) + editBtn(g) + "</div>" +
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
    var all = allGrants();
    var list = all.filter(matches).sort(sortFn);
    var isTable = state.view === "table";

    if (isTable) {
      /* Wrapped, not passed bare: map() would hand renderRow the array index as
         its id-prefix argument and mangle every row id after the first. */
      tbody.innerHTML = list.map(function (g) { return renderRow(g); }).join("");
    } else {
      grid.innerHTML = list.map(function (g) { return renderCard(g); }).join("");
    }
    tablewrap.hidden = !isTable;
    grid.hidden = isTable;

    empty.hidden = list.length > 0;
    resultcount.textContent =
      list.length + " of " + all.length + " opportunit" + (all.length === 1 ? "y" : "ies") + " shown";

    syncSortHeaders();
    syncFilterCount();
    renderStats();
  }

  /* Recomputed on every render, not once at init — the totals move whenever the
     team adds or removes a grant of their own. */
  function renderStats() {
    document.getElementById("stat-total").textContent = allGrants().length;
    document.getElementById("stat-open").textContent = countBy(function (g) {
      var s = effectiveStatus(g);
      return s === "open" || s === "soon" || s === "rolling";
    });
    document.getElementById("stat-fit").textContent = countBy(function (g) { return g.fit === "high"; });
    document.getElementById("stat-ready").textContent = countBy(function (g) {
      var s = effectiveStatus(g);
      return g.gate === "ready" && s !== "closed" && s !== "watch";
    });
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
    var soon = allGrants().filter(function (g) {
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
    return allGrants().filter(pred).length;
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

  /* ------------------------ add / edit your grants --------------------- */

  var dlg = document.getElementById("grantdialog");
  var mng = document.getElementById("managedialog");

  function $(id) { return document.getElementById(id); }

  function fillSelects() {
    $("f-category").innerHTML = Object.keys(CATEGORIES)
      .map(function (k) { return '<option value="' + k + '">' + esc(CATEGORIES[k].label) + "</option>"; })
      .join("");
    $("f-gate").innerHTML = '<option value="">Not sure yet</option>' + Object.keys(GATES)
      .map(function (k) { return '<option value="' + k + '">' + esc(GATES[k].label) + "</option>"; })
      .join("");
  }

  function openForm(g) {
    $("f-err").hidden = true;
    $("f-id").value = g ? g.id : "";
    $("f-name").value = g ? g.name : "";
    $("f-funder").value = g ? g.funder : "";
    $("f-url").value = g && g.links[0] ? g.links[0].url : "";
    $("f-category").value = g ? g.category : "corporate";
    $("f-fit").value = g ? g.fit : "medium";
    $("f-ftc").checked = g ? g.programs.indexOf("FTC") > -1 : true;
    $("f-frc").checked = g ? g.programs.indexOf("FRC") > -1 : true;
    $("f-fll").checked = g ? g.programs.indexOf("FLL") > -1 : false;
    $("f-amount").value = g ? g.amount : "";
    $("f-deadline").value = g && g.deadline ? g.deadline : "";
    $("f-status").value = g && g.status !== "soon" ? g.status : "rolling";
    $("f-gate").value = g && g.gate ? g.gate : "";
    $("f-window").value = g ? g.window : "";
    $("f-why").value = g && g.why !== "Added by your team." ? g.why : "";
    $("f-elig").value = g ? (g.eligibility || []).join("\n") : "";
    $("f-action").value = g ? g.action : "";
    $("dlg-title").textContent = g ? "Edit grant" : "Add a grant";
    $("f-delete").hidden = !g;
    dlg.showModal();
    $("f-name").focus();
  }

  function readForm() {
    var url = $("f-url").value.trim();
    if (!safeUrl(url)) return { error: "The application link must start with http:// or https://" };

    var name = $("f-name").value.trim();
    var funder = $("f-funder").value.trim();
    if (!name || !funder) return { error: "Grant name and funder are both required." };

    var deadline = $("f-deadline").value || null;
    var progs = ["f-ftc", "f-frc", "f-fll"].filter(function (i) { return $(i).checked; })
      .map(function (i) { return $(i).value; });

    return {
      grant: sanitizeGrant({
        id: $("f-id").value || undefined,
        name: name,
        funder: funder,
        category: $("f-category").value,
        programs: progs,
        amount: $("f-amount").value.trim(),
        fit: $("f-fit").value,
        gate: $("f-gate").value || undefined,
        /* A date makes the status moot — effectiveStatus() derives it from there. */
        status: deadline ? "soon" : $("f-status").value,
        deadline: deadline,
        window: $("f-window").value.trim(),
        why: $("f-why").value.trim(),
        eligibility: $("f-elig").value.split("\n")
          .map(function (l) { return l.trim(); }).filter(Boolean),
        action: $("f-action").value.trim(),
        links: [{ label: "Apply", url: url }],
      }),
    };
  }

  function afterCustomChange() {
    saveCustom();
    $("manage-grants").hidden = custom.length === 0;
    renderRadar();
    render();
    if (!storageOK) {
      $("f-err").hidden = false;
      $("f-err").textContent =
        "Saved for this visit, but the browser refused to store it — it will be gone on reload. Use Export to keep a copy.";
    }
  }

  /* --------------------------- submit dialog --------------------------- */

  var subDlg = document.getElementById("submitdialog");
  var pendingSubmit = null;

  function openSubmit(g) {
    pendingSubmit = g;
    $("s-name").value = g.submitter || "";
    $("s-packet").value = submissionText(g);
    subDlg.showModal();
  }

  /* The name field feeds back into the stored grant so the packet, and any
     later resend, carry it too. */
  function syncSubmitter() {
    if (!pendingSubmit) return;
    pendingSubmit.submitter = $("s-name").value.trim().slice(0, 80);
    $("s-packet").value = submissionText(pendingSubmit);
  }

  function markSent(via) {
    if (!pendingSubmit) return;
    pendingSubmit.submittedAt = new Date().toISOString();
    pendingSubmit.submittedVia = via;
    saveCustom();
    render();
  }

  function wireSubmit() {
    $("s-name").addEventListener("input", syncSubmitter);

    $("s-email").addEventListener("click", function () {
      syncSubmitter();
      window.open(mailtoUrl(pendingSubmit), "_blank");
      markSent("email");
    });

    $("s-github").addEventListener("click", function () {
      syncSubmitter();
      window.open(issueUrl(pendingSubmit), "_blank", "noopener");
      markSent("github");
    });

    $("s-copy").addEventListener("click", function () {
      syncSubmitter();
      copyText($("s-packet"), $("s-copy"));
      markSent("copy");
    });

    $("s-done").addEventListener("click", function () { subDlg.close(); });
  }

  /* Shared by every copy button: the clipboard API is unavailable over file://
     and in some embedded viewers, so selection plus execCommand is the floor. */
  function copyText(sourceEl, btn) {
    var label = btn.textContent;
    sourceEl.select();
    var done = function () {
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = label; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(sourceEl.value).then(done, function () { done(); });
    } else {
      try { document.execCommand("copy"); } catch (e) { /* the selection is the fallback */ }
      done();
    }
  }

  function wireDialogs() {
    fillSelects();

    $("add-grant").addEventListener("click", function () { openForm(null); });
    $("f-cancel").addEventListener("click", function () { dlg.close(); });

    /* Which submit button was pressed decides whether we chain into sending. */
    var sendAfterSave = false;
    $("f-save").addEventListener("click", function () { sendAfterSave = false; });
    $("f-save-send").addEventListener("click", function () { sendAfterSave = true; });

    $("grantform").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var res = readForm();
      if (res.error || !res.grant) {
        $("f-err").hidden = false;
        $("f-err").textContent = res.error || "Something in that entry could not be saved.";
        return;
      }
      var i = custom.findIndex(function (c) { return c.id === res.grant.id; });
      if (i > -1) {
        /* Editing must not silently clear an existing sent stamp. */
        res.grant.submittedAt = custom[i].submittedAt;
        res.grant.submittedVia = custom[i].submittedVia;
        res.grant.submitter = custom[i].submitter || res.grant.submitter;
        custom[i] = res.grant;
      } else {
        custom.push(res.grant);
      }
      afterCustomChange();
      if (storageOK) {
        dlg.close();
        if (sendAfterSave) {
          openSubmit(custom.filter(function (c) { return c.id === res.grant.id; })[0]);
        }
      }
    });

    $("f-delete").addEventListener("click", function () {
      var id = $("f-id").value;
      custom = custom.filter(function (c) { return c.id !== id; });
      afterCustomChange();
      dlg.close();
    });

    /* Edit and send buttons live inside re-rendered rows and cards, so delegate. */
    document.addEventListener("click", function (ev) {
      var ed = ev.target.closest("[data-edit]");
      if (ed) {
        var g = custom.filter(function (c) { return c.id === ed.dataset.edit; })[0];
        if (g) openForm(g);
        return;
      }
      var sd = ev.target.closest("[data-send]");
      if (sd) {
        var s = custom.filter(function (c) { return c.id === sd.dataset.send; })[0];
        if (s) openSubmit(s);
      }
    });

    $("manage-grants").addEventListener("click", function () {
      $("m-err").hidden = true;
      $("m-json").value = JSON.stringify(custom, null, 2);
      mng.showModal();
    });
    $("m-close").addEventListener("click", function () { mng.close(); });

    $("m-copy").addEventListener("click", function () {
      copyText($("m-json"), $("m-copy"));
    });

    $("m-import").addEventListener("click", function () {
      try {
        var parsed = JSON.parse($("m-json").value);
        if (!Array.isArray(parsed)) throw new Error("not an array");
        var cleaned = parsed.map(sanitizeGrant).filter(Boolean);
        if (!cleaned.length) throw new Error("nothing usable");
        custom = cleaned;
        afterCustomChange();
        mng.close();
      } catch (e) {
        $("m-err").hidden = false;
        $("m-err").textContent =
          "That is not a usable grant list. It must be a JSON array, and each entry needs a name, a funder, and an http(s) link.";
      }
    });

    $("m-clear").addEventListener("click", function () {
      if (!custom.length) return mng.close();
      $("m-err").hidden = false;
      $("m-err").textContent = "Click Delete all once more to remove every grant you have added.";
      $("m-clear").textContent = "Confirm delete all";
      $("m-clear").onclick = function () {
        custom = [];
        afterCustomChange();
        mng.close();
        $("m-clear").textContent = "Delete all";
        $("m-clear").onclick = null;
      };
    });
  }

  /* ------------------------- admin review queue ------------------------ */

  /* Not an access control. This panel only formats text and grants no
     privilege — anyone can open it. Approval means a commit to grants.js. */

  var QUEUE_KEY = "grantTrackerQueue";
  var admDlg = document.getElementById("admindialog");
  var queue = [];

  function loadQueue() {
    try {
      var p = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      queue = (Array.isArray(p) ? p : []).map(function (q) {
        var g = sanitizeGrant(q);
        return g ? { grant: g, approved: q.approved === true } : null;
      }).filter(Boolean);
    } catch (e) { queue = []; }
  }

  function saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.map(function (q) {
        var o = JSON.parse(JSON.stringify(q.grant));
        o.approved = q.approved;
        return o;
      })));
    } catch (e) { /* review still works for this session */ }
  }

  /* Submissions arrive wrapped in prose — an email body, a GitHub issue with a
     fenced code block. Scan for balanced brackets rather than asking the admin
     to trim by hand. */
  function extractObjects(text) {
    var out = [];
    var depth = 0, start = -1, inStr = false, quote = "", esc2 = false;

    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inStr) {
        if (esc2) { esc2 = false; }
        else if (c === "\\") { esc2 = true; }
        else if (c === quote) { inStr = false; }
        continue;
      }
      if (c === '"' || c === "'") { inStr = true; quote = c; continue; }
      if (c === "{" || c === "[") { if (depth === 0) start = i; depth++; continue; }
      if (c === "}" || c === "]") {
        depth--;
        if (depth === 0 && start > -1) { out.push(text.slice(start, i + 1)); start = -1; }
        if (depth < 0) depth = 0;
        continue;
      }
    }
    return out;
  }

  function parseSubmissions(text) {
    var found = [];
    extractObjects(text).forEach(function (chunk) {
      var obj = null;
      try {
        obj = JSON.parse(chunk);
      } catch (e) {
        /* toSourceEntry() emits unquoted keys and a trailing comma, which is
           valid JS but not JSON. Function-wrap rather than eval globally. */
        try {
          obj = Function("return (" + chunk.replace(/,\s*([}\]])/g, "$1") + ");")();
        } catch (e2) { obj = null; }
      }
      if (!obj) return;
      (Array.isArray(obj) ? obj : [obj]).forEach(function (o) {
        var g = sanitizeGrant(o);
        if (g) found.push(g);
      });
    });
    return found;
  }

  function renderQueue() {
    var el = $("a-queue");
    if (!queue.length) {
      el.innerHTML = '<p class="queue-empty">Nothing in the queue yet.</p>';
      $("a-copy").disabled = true;
      return;
    }
    var approved = queue.filter(function (q) { return q.approved; }).length;
    $("a-copy").disabled = approved === 0;
    $("a-copy").textContent = approved
      ? "Copy " + approved + " approved " + (approved === 1 ? "entry" : "entries")
      : "Copy approved entries";

    el.innerHTML =
      '<p class="queue-count">' + queue.length + " in queue &middot; " + approved + " approved</p>" +
      '<table class="gtable queue-table"><tbody>' +
      queue.map(function (q, i) {
        /* Rendered as a plain grant: a queued submission is not the reviewer's
           own draft, so it gets no Draft badge and no Edit/Send buttons. */
        var preview = {};
        Object.keys(q.grant).forEach(function (k) { preview[k] = q.grant[k]; });
        preview.custom = false;
        return renderRow(preview, "q") +
          '<tr class="queue-actions"><td colspan="7">' +
          '<button type="button" class="editbtn ' + (q.approved ? "on" : "") +
            '" data-approve="' + i + '">' + (q.approved ? "✓ Approved" : "Approve") + "</button>" +
          '<button type="button" class="editbtn" data-reject="' + i + '">Remove</button>' +
          "</td></tr>";
      }).join("") +
      "</tbody></table>";
  }

  function openAdmin() {
    $("a-err").hidden = true;
    $("a-paste").value = "";
    renderQueue();
    admDlg.showModal();
  }

  function wireAdmin() {
    loadQueue();

    $("open-admin").addEventListener("click", openAdmin);
    if (location.hash === "#admin") openAdmin();
    window.addEventListener("hashchange", function () {
      if (location.hash === "#admin") openAdmin();
    });

    $("a-add").addEventListener("click", function () {
      var found = parseSubmissions($("a-paste").value);
      if (!found.length) {
        $("a-err").hidden = false;
        $("a-err").textContent =
          "Could not find a grant in that. It needs a name, a funder, and an http(s) link — " +
          "paste the whole email or issue body and it will find the entry inside.";
        return;
      }
      found.forEach(function (g) {
        var dup = queue.some(function (q) { return q.grant.name === g.name && q.grant.funder === g.funder; });
        if (!dup) queue.push({ grant: g, approved: false });
      });
      $("a-err").hidden = true;
      $("a-paste").value = "";
      saveQueue();
      renderQueue();
    });

    $("a-queue").addEventListener("click", function (ev) {
      var ap = ev.target.closest("[data-approve]");
      if (ap) {
        var i = +ap.dataset.approve;
        queue[i].approved = !queue[i].approved;
        saveQueue();
        renderQueue();
        return;
      }
      var rj = ev.target.closest("[data-reject]");
      if (rj) {
        queue.splice(+rj.dataset.reject, 1);
        saveQueue();
        renderQueue();
        return;
      }
      /* Preview rows expand like real ones. */
      var tg = ev.target.closest(".rowtoggle");
      if (tg) {
        var d = document.getElementById(tg.getAttribute("aria-controls"));
        if (d) {
          var open = tg.getAttribute("aria-expanded") === "true";
          tg.setAttribute("aria-expanded", String(!open));
          d.hidden = open;
        }
      }
    });

    $("a-clear").addEventListener("click", function () {
      queue = [];
      saveQueue();
      renderQueue();
    });

    $("a-copy").addEventListener("click", function () {
      var text = queue.filter(function (q) { return q.approved; })
        .map(function (q) { return toSourceEntry(q.grant); })
        .join("\n");
      var ta = $("a-paste");
      ta.value = text;
      copyText(ta, $("a-copy"));
    });

    $("a-close").addEventListener("click", function () { admDlg.close(); });
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
    loadCustom();

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

    var vd = formatDate(VERIFIED);
    var sv = document.getElementById("stat-verified");
    sv.textContent = vd;
    sv.classList.add("small");
    document.getElementById("footer-verified").textContent = vd;

    wireInteractions();
    wireDialogs();
    wireSubmit();
    wireAdmin();
    document.getElementById("manage-grants").hidden = custom.length === 0;
    renderRadar();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
