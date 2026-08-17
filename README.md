# FIRST Grants Tracker

A single-page website listing grant opportunities, deadlines, and direct application links for an
**all-girls FIRST Robotics team (FTC and FRC)** — a community team of military kids competing in the
**DoDEA European Region**.

No build step, no dependencies, no external network requests. Open `index.html` and it works.

## How the page is laid out

**Closing soonest** — a strip above the list showing every grant with a dated deadline in the next
90 days, soonest first. This exists because the list defaults to sorting by *fit*, which scatters
the dated deadlines: the best-matched grants for this team are mostly rolling or waiting to reopen,
so a deadline column alone would leave the nearest deadline sitting at row 20. Clicking an entry
clears any active filters and jumps to that row.

**Table** (default) or **cards**, switched with the View toggle; the choice is remembered. Both
views share the same filtering and sorting. Click any grant name to expand eligibility, the next
step, and every link. Click the Fit, Grant or Deadline column headers to re-sort.

The deadline column encodes urgency, so an approaching date reads at a glance wherever it lands:

| Shown | Meaning |
| --- | --- |
| date + days left, rust | 14 days or fewer |
| date + days left, amber | 45 days or fewer |
| date + days left, grey | further out |
| `Open now` / `Rolling` | no fixed date, currently accepting |
| `Watch` | closed for now, expected to reopen |
| `Closed` | the stored deadline has passed |

Filters are collapsed behind the **Filters** toggle; a badge shows how many are active, and the
panel opens itself whenever a filter is set.

## Adding grants you find yourself

**+ Add a grant** opens a form. Saved entries are stored in your browser's `localStorage` and merged
into the list — they sort, filter, search, and appear in the Closing soonest strip exactly like the
researched ones, marked with a **Yours** badge. Expand one and there's an **Edit** button.

Only three fields are required: grant name, funder, and an application link. Everything else has a
sensible default. If you enter a deadline, the status is derived from it; if you don't, you pick
Rolling / Open / Watch yourself.

**Export / import** appears once you've added something. It shows your entries as JSON:

- **Copy** puts it on the clipboard. Browser storage is not a backup — one cleared cache and it's
  gone, so copy it somewhere real.
- **Replace from box** imports a pasted array, replacing what's stored.
- Pasting that JSON into the `GRANTS` array in `assets/grants.js` makes the entries **permanent and
  shared** with anyone using the site. That's the path from "one person found this" to "the team
  has this."

Anything loaded from storage or pasted into the import box is re-validated before it renders:
unknown categories, blockers and statuses fall back to defaults, fields are length-capped, and every
link must be `http(s)` — a `javascript:` URL is dropped, and an entry with no usable link is
rejected outright.

Storage can be unavailable (private windows, some embedded viewers). If a save fails you'll get a
warning saying the entry will not survive a reload; the GitHub Pages version does not have this
problem.

## Submitting a grant to the admin

A saved entry is a **Draft** until it's sent. **Save & send** in the add form, or **Send to admin**
in any expanded entry, opens a dialog offering two channels:

- **Open email** — a prefilled message to the address in `ADMIN` (`assets/grants.js`), with a
  summary and a ready-to-paste `grants.js` entry. Very long entries would be truncated by mail
  clients, so past ~1900 characters the link carries the summary and points at the clipboard.
- **Open GitHub issue** — a prefilled issue on the repo, labelled `grant-submission`, with the
  entry in a fenced code block. Needs a GitHub account; the repo is public and issues are enabled.

Both are *navigations*, not background requests — that's deliberate, since the Artifact viewer's CSP
blocks outbound `fetch`. Neither sends anything on its own: the submitter still presses send. The
packet is always shown in a textarea with a **Copy packet** button, so if a viewer blocks the
buttons there's still a way out. Once sent, the badge flips to **Sent** with the date, and editing
the entry afterwards keeps that stamp.

There is no backend. Only the `downloads` and `mcp` Artifact capabilities are available to this
account — there's no shared storage — so submissions travel through the submitter's own email or
GitHub account, not a server.

### Approving into the dataset

The footer has an **Admin: review queue** button (or add `#admin` to the URL). Paste in a whole
email body, a GitHub issue body, or raw JSON — a bracket-matching scan pulls the entry out of the
surrounding prose, and it accepts both strict JSON and the unquoted-key style this project writes.

Each submission renders **through the same `renderRow()` the live table uses**, so you preview the
real row before accepting it. Approve the ones you want, press **Copy approved entries**, and paste
the result into the `GRANTS` array in `assets/grants.js`. The queue persists in `localStorage`, so
review can span sessions.

> The admin panel is **not** authentication. It only formats text and grants no privilege — anyone
> can open it. The gate that matters is commit access to this repo: nothing is in the formal dataset
> until it's in `assets/grants.js`.

Pasted submissions go through `sanitizeGrant()` exactly like everything else, so a `javascript:`
link is rejected before it can render.

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
  gate: "ready",                 // what blocks a submission — see GATES
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

Deadlines that have passed are automatically re-labelled **Closed**, anything inside 45 days is
promoted to **Deadline ahead**, and anything inside 90 days appears in the Closing soonest strip —
so the page degrades gracefully if nobody updates it for a while.
Bump `VERIFIED` at the top of the file whenever you do a check-over — it drives the "last verified"
date shown in the header and footer.

## About the data

Entries were checked against public sources in August 2026. Grant windows shift every season and
third-party grant aggregators routinely republish stale dates, so **the funder's own page is the only
authority**. Cards flagged `confirm: true` had at least one detail (usually a date or an amount) that
could not be pinned to the funder's own site.

## Team status these ratings assume

Registered Private Organization, all-girls roster, FTC + FRC, community-based, DoDEA European Region.
The `gate` field on each grant is scored against that profile, so it needs revisiting if any of it
changes.

**PO registration is done**, which is why it no longer appears as a blocker — it is the eligibility
bar for the local spouses' club grants, and the team clears it.

**PO status is not 501(c)(3).** A private organization operating on a DoD installation under DoDI
1000.15 and an IRS determination under section 501(c)(3) are separate frameworks; a PO may or may not
hold both. Gene Haas, AAUW and Lockheed Martin ask for the IRS side specifically, so the open question
is whether this PO also carries its own determination, or needs a fiscal sponsor that does.

The remaining questions worth resolving in writing before drafting anything:

1. Does the funder's "U.S.-based" clause include a team on a U.S. installation overseas?
2. Does the PO hold its own 501(c)(3), and if not, who is the fiscal sponsor?
3. Is there a mentor with a `.mil` or `.dodea` affiliation available to submit? (Required by the
   best-fit programme on the list.)
