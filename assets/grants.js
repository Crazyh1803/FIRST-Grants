/* ---------------------------------------------------------------------------
   Grant data for an all-girls FIRST team (FTC + FRC), community-based,
   military-connected, competing in the DoDEA European Region.

   Every entry below was checked against public sources on the VERIFIED date.
   Where a date or amount could not be confirmed from the funder's own page,
   `confirm: true` is set and the card shows a "confirm on the funder's site"
   warning. Deadlines move every year — treat this as a worklist, not gospel.

   fit:   "high" | "medium" | "low"   -> how well this fits THIS team
   status:"open" | "soon" | "rolling" | "watch" | "closed"
   gate:  what stands between this team and a submission (see GATES)

   Team status assumed by the `gate` values: registered Private Organization,
   all-girls roster, FTC + FRC, community-based, USAG Wiesbaden, DoDEA European Region.
   Local entries are scoped to Wiesbaden — clubs serving other garrisons do not
   fund this team, so they are not listed.
   PO registration is done, so it is no longer treated as a blocker. PO status
   is NOT the same as IRS 501(c)(3) determination — separate frameworks, and
   several funders below require the latter specifically.
   ------------------------------------------------------------------------- */

const VERIFIED = "2026-08-17";

const CATEGORIES = {
  military: { label: "Military & Defense" },
  firstorg: { label: "FIRST & Robotics Foundations" },
  girls: { label: "Women & Girls in STEM" },
  local: { label: "Local Military Community (Europe)" },
  corporate: { label: "Corporate & Foundation STEM" },
};

/* What has to be true before this team can actually submit. */
const GATES = {
  ready:      { label: "Ready to submit",    blurb: "Nothing structural in the way — your Private Organization status covers it." },
  irs:        { label: "Needs 501(c)(3)",    blurb: "Requires IRS determination, which Private Organization status does not confer. Needs your own 501(c)(3) or a fiscal sponsor." },
  mentor:     { label: "Needs an applicant", blurb: "Someone other than the team submits — a DoDEA/DoD mentor or a K-12 teacher." },
  sponsor:    { label: "Needs a sponsor",    blurb: "An outside body applies on your behalf: an AFCEA chapter, a SWE section, a school, or your regional FIRST partner." },
  geography:  { label: "Confirm geography",  blurb: "Carries a U.S.-based clause. Get a written answer on overseas eligibility before drafting." },
  invite:     { label: "Invitation only",    blurb: "No cold application route. Needs an employee champion inside the company." },
  unverified: { label: "Status unconfirmed", blurb: "Could not confirm an open funding round exists. Do not budget against it." },
};

const GRANTS = [
  /* ----------------------------- MILITARY ----------------------------- */
  {
    id: "dow-stem-first",
    name: "DoW STEM FIRST Robotics Grants",
    funder: "U.S. Department of War STEM (formerly DoD STEM)",
    category: "military",
    programs: ["FTC", "FRC", "FLL"],
    amount: "Registration + pre-approved season products (FRC: registration only)",
    fit: "high",
    gate: "mentor",
    status: "watch",
    deadline: null,
    window: "Applications for the 2026 season closed 12 Jun 2026. Next window expected spring 2027.",
    confirm: true,
    why:
      "This is the single best-matched program for your team. It exists specifically to fund " +
      "military-connected robotics teams, and DoDEA teams are an explicitly named priority group.",
    eligibility: [
      "Team must have a DoDEA or DoD mentor/coach who submits the application",
      "Priority to DoDEA teams and teams with 10%+ military-connected students",
      "Awards allocated by lottery when demand exceeds funds; rookie teams prioritized in the overflow round",
    ],
    action:
      "Line up your .mil / .dodea coach now and register on the portal so you are notified the moment " +
      "the 2027 window opens. Missing this window is the most expensive mistake available to you.",
    links: [
      { label: "Grant portal (DoW)", url: "https://first.dowstem.us/access" },
      { label: "Program info & guidelines", url: "https://dowstem.us/first/" },
      { label: "Legacy DoD STEM portal", url: "https://first.dodstem.us/access" },
    ],
  },
  {
    id: "afcea-europe",
    name: "AFCEA Europe STEM Grants Program",
    funder: "AFCEA Educational Foundation",
    category: "military",
    programs: ["FTC", "FRC"],
    amount: "Up to $1,000",
    fit: "high",
    gate: "sponsor",
    status: "rolling",
    deadline: null,
    window: "Rolling submissions; judging panel meets twice per year.",
    why:
      "A Europe-specific defense-community fund that names robotics clubs as an eligible use of money. " +
      "Very few U.S. STEM funds are structured to reach a team stationed in Europe — this one is.",
    eligibility: [
      "Applications are made by an AFCEA European Chapter, not by the team directly",
      "Funds may be used for equipment, materials, and sponsoring extracurricular robotics/cyber clubs",
      "Chapters that contribute matching funds are given an advantage",
      "A post-award impact report is required before any renewal",
    ],
    action:
      "There is an AFCEA chapter in Wiesbaden — go straight to it rather than to AFCEA International. " +
      "Ask them to sponsor your application and offer a demo at a chapter event; chapters like having " +
      "something visible to point at, and a chapter that contributes matching funds gets an advantage " +
      "in the judging. This is a relationship, so start it well before you need the money.",
    links: [
      { label: "AFCEA Wiesbaden chapter", url: "https://wiesbaden.afceachapters.org/welcome" },
      { label: "European STEM Grants Program", url: "https://www.afcea.org/european-stem-grants-program" },
      { label: "AFCEA Europe grants detail", url: "https://www.afcea.org/site/foundation/grants/europe" },
    ],
  },
  {
    id: "our-military-kids",
    name: "Our Military Kids Activity Grants",
    funder: "Our Military Kids, Inc.",
    category: "military",
    programs: ["FTC", "FRC"],
    amount: "Up to $300 per child (up to $600 for qualifying 180+ day deployments)",
    fit: "medium",
    gate: "ready",
    status: "rolling",
    deadline: null,
    window: "Rolling — apply per child, any time.",
    why:
      "Pays a child's activity fee directly. Awarded per student, so several eligible girls on one " +
      "roster can stack into meaningful money toward registration and travel.",
    eligibility: [
      "Deployed Program: children of deployed/activated National Guard and Reserve members",
      "Combat Injured Program: children of service members or veterans receiving care for post-9/11 combat-related illness or injury (any branch)",
      "Children ages 1-18 who have not yet graduated high school",
      "STEM programs are explicitly covered; school tuition and daycare are not",
    ],
    action:
      "Survey your roster for families that meet the Guard/Reserve deployment or combat-injured criteria, " +
      "and have each eligible family apply individually. Confirm that an overseas-stationed applicant " +
      "can be paid before you build it into the budget.",
    confirm: true,
    links: [{ label: "Apply", url: "https://www.ourmilitarykids.org/apply/" }],
  },
  {
    id: "afa-educator",
    name: "AFA Educator Grants",
    funder: "Air & Space Forces Association",
    category: "military",
    programs: ["FTC", "FRC"],
    amount: "$600 (40 awards nationwide)",
    fit: "medium",
    gate: "mentor",
    status: "soon",
    deadline: "2026-12-15",
    window: "Applications accepted 1 Sep - 15 Dec each year.",
    why:
      "Small but very winnable, and robotics materials are a named eligible expense. Opens in a couple " +
      "of weeks, which makes it one of the nearest actionable deadlines on this page.",
    eligibility: [
      "K-12 teachers; a DoDEA teacher serving as your coach or mentor can apply",
      "Funds hands-on STEM/aerospace projects, including robotics materials and STEM kits",
      "AFA also runs $500 JROTC unit grants and $250 Civil Air Patrol unit grants",
    ],
    action:
      "Ask a DoDEA teacher on your mentor bench to submit in September. Pair it with an aerospace angle " +
      "in the narrative — that is what this grant is actually funding.",
    links: [{ label: "Education Grants", url: "https://www.afa.org/grants-for-education/" }],
  },
  {
    id: "dodea-smart-money",
    name: "DoDEA Europe Smart Money Grant Program",
    funder: "DoDEA Europe",
    category: "military",
    programs: ["FTC", "FRC"],
    amount: "Varies by cycle",
    fit: "medium",
    gate: "sponsor",
    status: "watch",
    deadline: null,
    window: "Announced by DoDEA Europe district; check with your district office.",
    confirm: true,
    why:
      "Internal DoDEA Europe funding for student activities and equipment. Because it is inside the " +
      "school system, it reaches teams in the European Region that U.S.-domestic funds cannot.",
    eligibility: [
      "Administered through DoDEA Europe districts and schools",
      "Typically requires a school sponsor or partnership — a challenge for a purely community-based team",
    ],
    action:
      "Call your DoDEA Europe district STEM/CTE point of contact and ask what the current cycle looks like " +
      "and whether a community team with a DoDEA-employed mentor can be sponsored through a school.",
    links: [{ label: "Smart Money Grant Program", url: "https://www.dodea.edu/europe/south/grantprogram.cfm" }],
  },

  /* --------------------------- FIRST / ROBOTICS ------------------------ */
  {
    id: "first-clearinghouse",
    name: "FIRST Team Grant Opportunities (clearinghouse)",
    funder: "FIRST",
    category: "firstorg",
    programs: ["FTC", "FRC", "FLL"],
    amount: "Varies by sponsor",
    fit: "high",
    gate: "ready",
    status: "rolling",
    deadline: null,
    window: "Updated year-round as sponsors open and close windows.",
    why:
      "The authoritative index. Sponsor grants appear and disappear here throughout the season, and " +
      "most of the corporate entries on this page are administered through it.",
    eligibility: [
      "Varies entirely by the individual sponsor listed",
      "Most listed grants are for U.S. teams; a few extend to Canada — read each one for geography limits",
    ],
    action:
      "Check this page monthly and email teamgrants@firstinspires.org to ask, in writing, which listed " +
      "grants accept a U.S.-affiliated team stationed overseas. Also ask your DoDEA European Region " +
      "Program Delivery Partner what regional funds they control.",
    links: [
      { label: "Team Grant Opportunities", url: "https://www.firstinspires.org/programs/team-grant-opportunities" },
      { label: "Is there funding available for teams?", url: "https://help.firstinspires.org/s/article/Is-there-funding-available-for-teams" },
      { label: "FIRST Submission Manager", url: "https://usfirst.submittable.com/submit" },
    ],
  },
  {
    id: "gene-haas",
    name: "Gene Haas Foundation Student Competition Teams Grant",
    funder: "Gene Haas Foundation",
    category: "firstorg",
    programs: ["FTC", "FRC"],
    amount: "$3,000 (FRC) / $2,000 (FTC)",
    fit: "high",
    gate: "irs",
    status: "open",
    deadline: null,
    window: "Accepting 2026/2027 season applications since 1 May 2026. Some regional partners report a 1 Sep cutoff.",
    confirm: true,
    why:
      "Open right now, applies to both of your programs, and is one of the largest reliably-repeating " +
      "team grants in FIRST. Worth roughly a third of an FRC registration.",
    eligibility: [
      "Public school, private school with 501(c)(3), or a team holding its own 501(c)(3)",
      "Private Organization registration does not satisfy this — the foundation asks for IRS determination",
      "Priority to teams designing and building parts with CNC machining",
      "Funds may NOT be spent on anything Haas Automation makes or a Haas Factory Outlet sells (including Haas Tooling)",
    ],
    action:
      "Check whether your PO also holds its own 501(c)(3); many do not. If it does, apply now and " +
      "confirm the cutoff, since sources disagree about whether 1 Sep applies. If it does not, apply " +
      "through a fiscal sponsor with IRS determination — a DoDEA school or a booster organization.",
    links: [{ label: "Apply Now", url: "https://www.ghaasfoundation.org/apply-now" }],
  },
  {
    id: "bae-first",
    name: "BAE Systems FIRST Team Grants",
    funder: "BAE Systems, Inc.",
    category: "firstorg",
    programs: ["FTC", "FRC", "FLL"],
    amount: "Varies by program level",
    fit: "medium",
    gate: "geography",
    status: "soon",
    deadline: "2026-09-13",
    window: "FRC window closes 13 Sep for the 2027 season; FLL/FTC windows differ.",
    confirm: true,
    why:
      "A long-running, defense-industry FIRST sponsor — thematically the right story for a military-" +
      "connected team, and a near-term deadline.",
    eligibility: [
      "Priority to teams within ~75 miles of a BAE Systems site, or teams with a BAE Systems mentor",
      "Title I / high-need status is weighted",
      "Program is run by BAE Systems, Inc. (U.S.) — confirm whether an overseas team can be funded",
    ],
    action:
      "If any parent or mentor on your team works for BAE Systems, say so explicitly in the application — " +
      "the mentor link is a stated priority and is your strongest route in from Europe.",
    links: [
      { label: "BAE FIRST Robotics Grants", url: "https://www.baesystems.com/en-us/our-company/about-us/bae-systems-inc/community-investment/first-robotics-grants" },
      { label: "Team Grants Application", url: "https://www.baesystems.com/en-us/partnership/community-investment/community-investment-partners/first/first-team-grants-application" },
    ],
  },
  {
    id: "intuitive",
    name: "Intuitive Foundation FIRST Robotics Grants",
    funder: "Intuitive Foundation",
    category: "firstorg",
    programs: ["FRC", "FTC"],
    amount: "Fixed award by competition type",
    fit: "high",
    gate: "geography",
    status: "watch",
    deadline: null,
    window: "Applications typically open in June; grant reports due in May.",
    confirm: true,
    why:
      "One of the few large FIRST funders with a documented record of funding teams outside the United " +
      "States — Australia, Canada, Israel, Mexico, Taiwan and Turkey among 889 teams funded. That makes " +
      "an overseas DoDEA team a plausible applicant rather than an automatic no.",
    eligibility: [
      "High school FIRST robotics teams",
      "International teams have been funded historically — confirm current-year geography rules",
    ],
    action:
      "Email grants@intuitive-foundation.org now and ask directly whether a DoDEA European Region team " +
      "is eligible, then set a reminder for the June opening.",
    links: [{ label: "FIRST Robotics program page", url: "https://www.intuitive-foundation.org/first-robotics/" }],
  },
  {
    id: "argosy",
    name: "Argosy Foundation Team Grants",
    funder: "The Argosy Foundation",
    category: "firstorg",
    programs: ["FRC", "FTC"],
    amount: "Typically $1,000-$5,600, often covering registration",
    fit: "medium",
    gate: "sponsor",
    status: "watch",
    deadline: null,
    window: "Distributed through FIRST regional partners; timing varies by region.",
    confirm: true,
    why:
      "A major behind-the-scenes underwriter of registration fees. It usually flows to teams through " +
      "regional directors rather than a public application, which means the ask goes to your region.",
    eligibility: [
      "Awards are generally decided by FIRST regional directors, not by direct public application",
      "Heavily weighted toward rookie teams and teams that could not otherwise afford registration",
      "Recent cycles include an FTC SIM rookie team grant and regional rookie grants of ~$3,000",
    ],
    action:
      "Do not wait for a public form. Ask your DoDEA European Region Program Delivery Partner whether " +
      "Argosy funds flow through them and how a team gets on that list.",
    links: [{ label: "Argosy Foundation - FIRST partnership", url: "https://www.argosyfnd.org/partner-stories/first" }],
  },
  {
    id: "nasa-rap",
    name: "NASA Robotics Alliance Project FRC Sponsorship Grants",
    funder: "NASA",
    category: "firstorg",
    programs: ["FRC"],
    amount: "One full Regional or District registration, paid directly to FIRST",
    fit: "low",
    gate: "geography",
    status: "soon",
    deadline: "2026-09-30",
    window: "Rookie-team deadline is 30 Sep, 11:59:59 pm EDT.",
    confirm: true,
    why:
      "The largest single-line-item grant in FRC — an entire registration. Listed here despite the low " +
      "fit rating because the payoff justifies confirming eligibility rather than assuming you are out.",
    eligibility: [
      "U.S.-based Rookie, New Veteran, or Year-Two FRC teams",
      "The U.S.-based requirement is the obstacle for a team stationed in Europe — ask before assuming",
    ],
    action:
      "Email NASA RAP and ask whether a DoDEA-affiliated team on a U.S. installation overseas counts as " +
      "U.S.-based. If yes, this is the highest-value application on the page.",
    links: [
      { label: "NASA grants", url: "https://robotics.nasa.gov/category/nasa-grants/" },
      { label: "Robotics Alliance Project", url: "https://robotics.nasa.gov/" },
    ],
  },
  {
    id: "boston-scientific",
    name: "Boston Scientific FIRST Team Grant",
    funder: "Boston Scientific",
    category: "firstorg",
    programs: ["FRC", "FTC"],
    amount: "Varies",
    fit: "low",
    gate: "geography",
    status: "soon",
    deadline: "2026-09-30",
    window: "Reported to close 30 Sep for the 2027 season.",
    confirm: true,
    why: "Listed through the FIRST clearinghouse with a near-term deadline; low effort to check.",
    eligibility: ["Verify current geography and program restrictions on the FIRST listing"],
    action: "Confirm the listing is live on the FIRST Team Grant Opportunities page before writing anything.",
    links: [{ label: "Via FIRST Team Grant Opportunities", url: "https://www.firstinspires.org/programs/team-grant-opportunities" }],
  },
  {
    id: "john-deere",
    name: "John Deere FIRST Team Grant",
    funder: "John Deere",
    category: "firstorg",
    programs: ["FRC", "FTC"],
    amount: "Varies",
    fit: "low",
    gate: "geography",
    status: "soon",
    deadline: "2026-11-06",
    window: "Portal reported open with a 6 Nov deadline.",
    confirm: true,
    why: "Another clearinghouse listing with a defined near-term deadline.",
    eligibility: [
      "Historically weighted toward communities near John Deere operations (notably Iowa)",
      "Confirm geography rules before investing time",
    ],
    action: "Verify on the FIRST listing; deprioritize unless the geography restriction has been lifted.",
    links: [{ label: "Via FIRST Team Grant Opportunities", url: "https://www.firstinspires.org/programs/team-grant-opportunities" }],
  },

  /* ------------------------- WOMEN & GIRLS IN STEM --------------------- */
  {
    id: "digital-citizen-fund",
    name: "Digital Citizen Fund Rookie Team Grant",
    funder: "Digital Citizen Fund",
    category: "girls",
    programs: ["FRC", "FTC"],
    amount: "$5,000 (up to five awards across two seasons)",
    fit: "high",
    gate: "geography",
    status: "watch",
    deadline: null,
    window: "The 2026-2027 application closed 1 Jun 2026. Watch for the next cycle.",
    confirm: true,
    why:
      "Built for exactly your team: rookie teams with all-female or majority-female membership. DCF is " +
      "the organization behind the Afghan Girls Robotics Team, so an all-girls roster is the point of " +
      "the grant, not a tiebreaker.",
    eligibility: [
      "All-female or majority-female membership",
      "Rookie teams",
      "Stated as U.S.-based — worth asking whether a DoDEA/U.S. military-affiliated team overseas qualifies",
    ],
    action:
      "Email DCF now to ask about the next cycle and about the U.S.-based clause. If you are still within " +
      "your rookie window when it reopens, this is a top-three application.",
    links: [
      { label: "Listed on FIRST Team Grant Opportunities", url: "https://www.firstinspires.org/programs/team-grant-opportunities" },
      { label: "Digital Citizen Fund", url: "https://digitalcitizenfund.org/" },
    ],
  },
  {
    id: "aauw-cag",
    name: "AAUW Community Action Grants",
    funder: "American Association of University Women",
    category: "girls",
    programs: ["FTC", "FRC"],
    amount: "Up to $50,000 (some sources cite up to $75,000)",
    fit: "medium",
    gate: "irs",
    status: "rolling",
    deadline: null,
    window: "Letter of Interest reviewed on a rolling basis; full applications by invitation. Dates reported inconsistently by third parties.",
    confirm: true,
    why:
      "Explicitly aimed at dismantling barriers to girls' participation in STEM in grades K-12 — the " +
      "largest dollar figure on this page that is squarely about girls in STEM.",
    eligibility: [
      "Applicant must be a 501(c)(3); AAUW branches and state orgs with 501(c)(4) may also apply",
      "Supports K-12 girls building skills and confidence in STEM",
      "Private Organization status alone will not clear this — you need IRS determination or a fiscal sponsor",
    ],
    action:
      "Confirm the live LOI deadline on AAUW's own page — third-party aggregators are contradicting each " +
      "other. Settle the fiscal-sponsor question first; at this award size it is worth the setup.",
    links: [
      { label: "Community Action Grants", url: "https://www.aauw.org/resources/programs/fellowships-grants/community-action-grant/" },
      { label: "All AAUW fellowships & grants", url: "https://www.aauw.org/resources/programs/fellowships-grants/" },
      { label: "Branch & affiliate grants", url: "https://www.aauw.org/resources/programs/fellowships-grants/aauw-branch-and-affiliate-grants/" },
    ],
  },
  {
    id: "swe-pdg",
    name: "SWE Program Development Grants",
    funder: "Society of Women Engineers",
    category: "girls",
    programs: ["FTC", "FRC"],
    amount: "$250 - $5,000",
    fit: "medium",
    gate: "sponsor",
    status: "watch",
    deadline: "2027-04-12",
    window: "Three cycles per year. Cycle 3 opens 12 Jan 2027 and closes 12 Apr 2027, 11:59 pm CT.",
    confirm: true,
    why:
      "Micro-grants for outreach run by SWE sections and affiliates. SWE has European sections, which " +
      "gives a Europe-based all-girls team a natural sponsor and a natural partner for outreach events.",
    eligibility: [
      "The event must be SWE or SWE-affiliate led — a local SWE section or member must be leading it",
      "K-12 educator members and Collegiate Interest Groups must obtain sponsorship from a SWE Section, MAL, or Affiliate",
      "Funded activity must occur at least 45 days after the application deadline",
    ],
    action:
      "Join SWENext (free for girls 13-18), then approach a SWE section in Europe about co-running an " +
      "outreach event your team demos at. The grant follows the section, so the relationship is the work.",
    links: [
      { label: "Program Development Grants", url: "https://swe.org/support-swe/program-development-grants/" },
      { label: "SWENext (free membership)", url: "https://swe.org/k-12-outreach/swenext/" },
      { label: "SWENext Awards", url: "https://societyofwomenengineers.swe.org/k-12-outreach/swenext-awards/" },
    ],
  },
  {
    id: "ncwit",
    name: "NCWIT AspireIT / Aspirations in Computing",
    funder: "National Center for Women & Information Technology",
    category: "girls",
    programs: ["FTC", "FRC"],
    amount: "Historically ~$1,000-$3,000 per program; current funding status unclear",
    fit: "low",
    gate: "unverified",
    status: "watch",
    deadline: null,
    window: "AspireIT ran 2013-2021 and invested $1M+ across 400+ programs. Current public materials are largely a free toolkit rather than an open funding call.",
    confirm: true,
    why:
      "Included because you asked about it, with a caveat: the searchable evidence points to AspireIT " +
      "now being a toolkit and an award, not an open grant. Do not build it into a budget without " +
      "confirming an active funding round exists.",
    eligibility: [
      "Aspirations in Computing recognition programs are open to students and are worth entering on their own merits",
      "AspireIT direct programme funding could not be confirmed as currently open",
    ],
    action:
      "Have your students enter the NCWIT Aspirations in Computing award (recognition, scholarships, and " +
      "a network) and treat AspireIT funding as unconfirmed until NCWIT says otherwise.",
    links: [
      { label: "AspireIT program page", url: "https://ncwit.org/ncwit-program/aspireit/" },
      { label: "Aspirations in Computing", url: "https://ncwit.org/program/aspirations-in-computing/" },
    ],
  },

  /* ------------------- LOCAL MILITARY COMMUNITY (EUROPE) ---------------
     Scoped to USAG Wiesbaden. Kaiserslautern-area clubs (Ramstein OSC, RESA)
     were removed — they fund the KMC, not this garrison. */
  {
    id: "wiesbaden-csc",
    name: "Wiesbaden Community Spouses' Club Grants",
    funder: "Wiesbaden Community Spouses' Club (WCSC)",
    category: "local",
    programs: ["FTC", "FRC"],
    amount: "Varies by request; WCSC has returned $260,000+ to the community in a year",
    fit: "high",
    gate: "ready",
    status: "open",
    deadline: "2026-09-15",
    window:
      "Applications are due the 15th of the month for the next Grants Committee meeting. " +
      "The committee meets nine times, August through May.",
    why:
      "Your home-garrison grant, and the fastest realistic money on this page. It names " +
      "\"Garrison-approved organizations\" as eligible, which is precisely what a registered Private " +
      "Organization at USAG Wiesbaden is. Local decision, local money, and a deadline every month.",
    eligibility: [
      "Eligible bodies include school groups, independent teams, units, FRGs, scout troops and Garrison-approved organizations",
      "Must be officially sanctioned or registered through Garrison, a DoDEA school, a church or a unit — your PO registration satisfies this",
      "Must have a verifiable mission or project supporting educational, charitable or social work benefiting the local military community",
      "Applications close on the 15th of the month; larger grants can take up to six weeks after that deadline to decide and pay",
    ],
    action:
      "Submit by the 15th with a specific, costed ask — a season registration fee, a named tool, travel to " +
      "a qualifier — and attach quotes. Committees fund concrete things far more readily than general " +
      "operating support. Because the deadline repeats monthly through May, missing one costs you weeks, " +
      "not a season. Ask separately about their scholarship and dual-enrolment programme for your students.",
    links: [
      { label: "Grant applications", url: "https://wiesbadencommunityspousesclub.wildapricot.org/Grants" },
      { label: "Scholarships & dual enrolment", url: "https://wiesbadencommunityspousesclub.wildapricot.org/Scholarship/Dual-Enrollment" },
      { label: "WCSC community support", url: "https://wiesbadencommunityspousesclub.wildapricot.org/Community" },
    ],
  },

  /* ------------------------ CORPORATE & FOUNDATION --------------------- */
  {
    id: "lockheed",
    name: "Lockheed Martin Community Giving / STEM Education",
    funder: "Lockheed Martin",
    category: "corporate",
    programs: ["FTC", "FRC"],
    amount: "Varies",
    fit: "medium",
    gate: "irs",
    status: "rolling",
    deadline: null,
    window: "Accepted year-round through the online giving system; evaluated roughly quarterly.",
    why:
      "One of the few corporate programs whose published eligibility explicitly accepts an \"equivalent " +
      "international non-profit classification\" — and Lockheed Martin has European business interests, " +
      "which is the other half of their test.",
    eligibility: [
      "501(c)(3), an equivalent international non-profit classification, or a public elementary/secondary school",
      "Organization must be located or operate in a community where Lockheed Martin has employees or business interests",
      "Must align with a strategic focus area — STEM education and military/veteran causes both qualify for you",
    ],
    action:
      "Your application writes itself: girls in STEM plus military families is a double alignment with " +
      "their stated priorities. Identify the nearest Lockheed Martin site or programme office in Europe " +
      "and name it in the request.",
    links: [
      { label: "Communities & community engagement", url: "https://www.lockheedmartin.com/en-us/who-we-are/communities.html" },
      { label: "STEM education", url: "https://www.lockheedmartin.com/en-us/who-we-are/communities/stem-education.html" },
    ],
  },
  {
    id: "boeing",
    name: "Boeing Community Engagement / Global Engagement Grants",
    funder: "The Boeing Company",
    category: "corporate",
    programs: ["FTC", "FRC"],
    amount: "Typically $50,000+ for programme-level grants",
    fit: "low",
    gate: "invite",
    status: "watch",
    deadline: null,
    window: "By region and business unit; most giving flows through established partners.",
    confirm: true,
    why:
      "Boeing funds STEM globally and tailors giving to communities where employees live and work, " +
      "including Europe. Award sizes are aimed at organizations rather than single teams, so the realistic " +
      "route is through a larger partner or a local site relationship.",
    eligibility: [
      "Focused on communities where Boeing has employee presence",
      "Grant sizes are programme-scale, not team-scale",
    ],
    action:
      "Rather than a cold application, approach a Boeing site in Europe about a local sponsorship or an " +
      "employee-mentor relationship. Treat the grant portal as the long game.",
    links: [{ label: "Community engagement", url: "https://www.boeing.com/company/community-engagement" }],
  },
  {
    id: "northrop",
    name: "Northrop Grumman Foundation & Corporate Citizenship",
    funder: "Northrop Grumman",
    category: "corporate",
    programs: ["FTC", "FRC"],
    amount: "Varies",
    fit: "low",
    gate: "invite",
    status: "watch",
    deadline: null,
    window: "Foundation grants are by invitation only; local community outreach funds exist in select locations.",
    why:
      "Honest assessment: the Foundation does not accept unsolicited requests, so the cold application " +
      "route is closed. The open doors are employee matching gifts and site-level community funds.",
    eligibility: [
      "Foundation grants are by invitation only and unsolicited requests are not acknowledged",
      "Stated priorities include STEM access for military-connected families, veterans, and military spouses",
      "Employee matching gifts and select local community outreach funds remain accessible",
    ],
    action:
      "Find a Northrop Grumman employee parent or mentor and go through employee matching gifts and site " +
      "community funds. Do not spend time on an unsolicited Foundation proposal.",
    links: [
      { label: "Corporate citizenship", url: "https://www.northropgrumman.com/corporate-responsibility/corporate-citizenship" },
      { label: "Contributions guidelines", url: "https://www.northropgrumman.com/corporate-responsibility/corporate-citizenship/corporate-contributions-guidelines" },
    ],
  },
  {
    id: "rtx",
    name: "RTX Connect Up / Corporate Social Responsibility Grants",
    funder: "RTX (formerly Raytheon Technologies)",
    category: "corporate",
    programs: ["FTC", "FRC"],
    amount: "Varies",
    fit: "low",
    gate: "invite",
    status: "watch",
    deadline: null,
    window: "The most recent Connect grant application period ran through 31 Jul 2026. Watch for the next opening.",
    confirm: true,
    why:
      "RTX is a named FIRST supporter and its stated priorities include STEM education and military " +
      "veteran support. Standard grants are invite-only and require an employee sponsor.",
    eligibility: [
      "Connect grants open to new nonprofit partners during designated application periods",
      "Standard (larger) grants are invitation-only and require an RTX employee sponsor",
    ],
    action:
      "Recruit an RTX employee parent as a mentor and sponsor. Without an internal champion this one does " +
      "not move.",
    links: [
      { label: "Corporate responsibility", url: "https://www.rtx.com/social-impact/corporate-responsibility" },
      { label: "Corporate citizenship", url: "https://www.rtx.com/our-responsibility/corporate-citizenship" },
    ],
  },
  {
    id: "toshiba",
    name: "Toshiba America Foundation Grants (Grades 6-12)",
    funder: "Toshiba America Foundation",
    category: "corporate",
    programs: ["FTC", "FRC"],
    amount: "Up to $5,000 (larger requests reviewed on a separate track)",
    fit: "medium",
    gate: "mentor",
    status: "soon",
    deadline: "2026-10-01",
    window: "Rolling quarterly deadlines: 1 Mar, 1 Jun, 1 Sep, 1 Dec, with a 1 Oct cycle currently reported.",
    confirm: true,
    why:
      "Repeating quarterly deadlines mean a miss costs you three months, not a year. Funds project-based " +
      "STEM with measurable outcomes — a robot build season describes itself well here.",
    eligibility: [
      "Applicant is a teacher of grades 6-12 with a specific classroom STEM project",
      "Historically oriented to U.S. schools — confirm whether a DoDEA school teacher qualifies",
    ],
    action:
      "Have a DoDEA teacher-mentor apply with a defined project and measurable outcomes. Confirm DoDEA " +
      "eligibility with the foundation first, since it decides whether this is worth writing.",
    links: [{ label: "Grants for grades 6-12", url: "https://toshiba.com/taf/612-2/" }],
  },
  {
    id: "motorola",
    name: "Motorola Solutions Foundation Innovation Generation Grants",
    funder: "Motorola Solutions Foundation",
    category: "corporate",
    programs: ["FTC", "FRC"],
    amount: "Up to $50,000",
    fit: "low",
    gate: "geography",
    status: "watch",
    deadline: "2027-01-22",
    window: "Annual cycle opens with an inquiry form; the 2026 inquiry deadline was 22 Jan. Expect a similar date in 2027.",
    confirm: true,
    why:
      "Names design, coding and robotics as target activities and funds at a scale that could carry a " +
      "team for years. The constraint is that the programme serves students and teachers in the United States.",
    eligibility: [
      "Programmes serving elementary through university students and teachers in the United States",
      "All applicants must first submit an inquiry form before the deadline",
      "Maximum request $50,000; returning recipients may request more",
    ],
    action:
      "Submit the inquiry form in January and ask outright whether DoDEA schools overseas count as U.S. " +
      "programmes. The inquiry form costs you very little to file.",
    links: [{ label: "Annual grant cycle", url: "https://www.motorolasolutions.com/en_us/about/motorola-solutions-foundation/annual-grants.html" }],
  },
  {
    id: "donorschoose",
    name: "FIRST + DonorsChoose Funding",
    funder: "FIRST / DonorsChoose, supported by 3M",
    category: "corporate",
    programs: ["FTC", "FRC", "FLL"],
    amount: "Varies by project",
    fit: "low",
    gate: "geography",
    status: "rolling",
    deadline: null,
    window: "Ongoing while the partnership is funded.",
    confirm: true,
    why:
      "Crowdfunding with a corporate match behind it. Listed for completeness — DonorsChoose is generally " +
      "limited to U.S. public schools, which likely excludes a community team abroad.",
    eligibility: [
      "Normally restricted to eligible U.S. public school teachers",
      "Confirm DoDEA school eligibility before planning around it",
    ],
    action: "Check eligibility once; if DoDEA schools are excluded, cross it off and move on.",
    links: [{ label: "FIRST + DonorsChoose", url: "https://info.firstinspires.org/first-donorschoose-funding" }],
  },
];
