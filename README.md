# FIRST Grants Tracker

A single-page website listing grant opportunities, deadlines, and direct application links for an
**all-girls FIRST Robotics team (FTC and FRC)** — a community team of military kids competing in the
**DoDEA European Region**.

No build step, no dependencies, no external network requests. Open `index.html` and it works.

## What's here

```
index.html          the page
assets/grants.js    ← the data. This is the file you edit.
assets/app.js       rendering, filtering, sorting, deadline countdowns
assets/styles.css   styling (light + dark, responsive, print-friendly)
```

## Running it

Open `index.html` directly in a browser, or serve the folder:

```sh
python3 -m http.server 8000   # then visit http://localhost:8000
```

To publish free hosting: **Settings → Pages → Deploy from a branch**, pick this branch and the root
folder. GitHub serves it at `https://<user>.github.io/FIRST-Grants/`.

## Adding or updating a grant

Everything lives in `assets/grants.js` as one object per grant. Copy an existing entry and edit it:

```js
{
  id: "unique-slug",
  name: "Grant name",
  funder: "Who writes the cheque",
  category: "military",          // military | firstorg | girls | local | corporate
  programs: ["FTC", "FRC"],      // FTC | FRC | FLL
  amount: "Up to $5,000",
  fit: "high",                   // high | medium | low — fit for THIS team
  status: "open",                // open | soon | rolling | watch | closed
  deadline: "2026-10-01",        // ISO date, or null if rolling/unknown
  window: "Human-readable timing note",
  confirm: true,                 // optional: shows a "⚠ confirm" badge
  why: "Why this one matters to this team.",
  eligibility: ["Requirement one", "Requirement two"],
  action: "The concrete next step.",
  links: [{ label: "Apply", url: "https://..." }]   // first link renders as the primary button
}
```

Deadlines that have passed are automatically re-labelled **Closed**, and anything inside 45 days is
promoted to **Deadline ahead**, so the page degrades gracefully if nobody updates it for a while.
Bump `VERIFIED` at the top of the file whenever you do a check-over — it drives the "last verified"
date shown in the header and footer.

## About the data

Entries were checked against public sources in August 2026. Grant windows shift every season and
third-party grant aggregators routinely republish stale dates, so **the funder's own page is the only
authority**. Cards flagged `confirm: true` had at least one detail (usually a date or an amount) that
could not be pinned to the funder's own site.

Four eligibility questions decide most outcomes for this team, and they are worth resolving in
writing before drafting anything:

1. Does the funder's "U.S.-based" clause include a team on a U.S. installation overseas?
2. Does the team need 501(c)(3) status, and if so, who is the fiscal sponsor?
3. Is the team registered as a Private Organization with installation FSS/MWR? (This unlocks the
   local spouses' club grants, on-base fundraising, and a bank account.)
4. Is there a mentor with a `.mil` or `.dodea` affiliation available to submit? (Required by the
   best-fit programme on the list.)
