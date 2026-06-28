# Career Tracker

[![CI](https://github.com/0xmmhh/career-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/0xmmhh/career-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen.svg)](https://nodejs.org/)

A local terminal app (TUI) for organizing a job search — building a list of target companies,
saving the job postings you find, getting AI feedback on fit, tailoring your CV per role, and
tracking each application through to an offer. Focused on Wrocław and remote/hybrid roles in
Poland, but works anywhere.

<img width="657" height="191" alt="image" src="https://github.com/user-attachments/assets/9a78f6c9-a99b-4bf2-92ee-f7fd4da1ceba" />


Everything runs locally. Data is stored in a SQLite file. The only things sent over the network
are the portal scrapes (harvest), the optional Google searches (discover), and the AI calls to
DeepSeek when you ask for fit analysis or CV tailoring.

---

## What it does

1. **Sourcing** — build a list of companies, either manually (`[n]`), by scraping job portals
   (`[g]ather`), or via optional Google discovery (`[d]iscover`). Auto-found companies land in a
   **Candidates** staging area for you to approve or reject.

2. **Applications** — for each company you track, save the specific job postings you want to
   apply to. Each application carries its own work mode, salary, deadline, contact, notes, and
   full job description, and moves through a pipeline:
   `bookmarked → applied → phone screen → interview → offer → rejected`.

3. **AI assistance** (DeepSeek) — for any application, run a **fit analysis** (scores your CV
   against the job, lists matching skills, gaps, and tips) or **tailor your CV** (rewrites your
   base profile for that specific role). Choose English or Polish each time. The fit analysis is
   saved with the application and shown again next time; both actions ask before re-running so
   you don't spend API tokens by accident.

4. **CV profiles** — keep two base profiles (English and Polish). Tailored CVs are generated
   from whichever you pick and saved per application.

---

## Tech stack

| Component | Technology |
|---|---|
| Language | TypeScript (ESM), run via `tsx` — no build step |
| Terminal UI | ink (React for the terminal) |
| Database | SQLite via the built-in `node:sqlite` module |
| Browser automation | Playwright + Chromium (only for `harvest`) |
| AI | DeepSeek API (OpenAI-compatible) |
| Discovery search | Google Custom Search JSON API (optional) |

---

## Requirements

- **Node.js 22+** — required, because the app uses the built-in `node:sqlite` module
  (not available before v22). Check with `node --version`.
- **npm 10+**
- macOS, Linux, WSL, or Windows
- **Playwright + Chromium** — only if you'll use `[g]ather`

---

## Installation

```bash
cd job-searching-platform
npm install

# Only if you'll use harvest (scraping portals):
npx playwright install chromium
```

Then create your `.env` for the AI features:

```bash
cp .env.example .env
# edit .env and set DEEPSEEK_API_KEY=sk-...
```

The AI fit/tailor features need an API, I am currently using DeepSeek - `DEEPSEEK_API_KEY`. Everything else works without any keys.

> Deploying to a server? See **[DEPLOY.md](DEPLOY.md)**.

---

## Running

```bash
npm start          # open the terminal UI (this is the main interface)

npm run harvest    # scrape job portals → candidates (needs Playwright)
npm run discover   # Google-search discovery → candidates (needs Google keys, optional)
npm run typecheck  # tsc --noEmit, sanity check after editing code
npm test           # run the database unit tests (node:test via tsx)
```

Inside the TUI, press `[h]` at any time for the full key reference.

---

## Typical workflow

1. **Add companies.** Press `[n]` to add one manually, or `[g]` to harvest from portals. Harvested
   companies appear under Candidates `[c]` — approve (`a`) the ones you want, reject (`r`) the rest.
2. **Mark interest** with `[i]` (high → medium → low → none).
3. **Open a company** (`⏎`) and press `[a]` to save a job posting you found — enter the position,
   company, URL, salary, deadline, contact, and notes. Then open the application and press `⏎` to
   add the full job description in its own view.
4. **Get AI help.** Open the application (`⏎`), press `[f]` for a fit analysis or `[c]` to tailor
   your CV. Pick English or Polish when prompted.
5. **Track progress.** Press `[s]` on an application to advance its status, and `[w]` to set its
   work mode. Use the **Board** `[b]` to see every application across all companies at a glance.

---

## TUI keyboard reference

### Company list (main screen)

| Key | Action |
|---|---|
| `↑`/`↓` or `j`/`k` | Move between companies |
| `⏎` | Open company detail |
| `o` | Open career page URL in browser |
| `i` | Cycle interest: ★ high • medium · low / none |
| `f` | Toggle high-interest-only filter |
| `n` | Add a company manually |
| `b` | Open the Board (all applications) |
| `v` | Open the CV manager |
| `c` | Open Candidates (awaiting approval) |
| `g` | Gather companies from job portals |
| `d` | Discover companies via Google (optional) |
| `/` | Search by name / URL |
| `h` | Help |
| `q` | Quit |

Companies with applications show their postings as sub-rows, each with its own colored work-mode
and status column.

### Company detail (`⏎` on a company)

| Key | Action |
|---|---|
| `↑`/`↓` | Move between this company's applications |
| `⏎` | Open the selected application |
| `a` | Add a new application for this company (company field is pre-filled) |
| `o` | Open career page URL |
| `i` | Cycle interest |
| `d` | Delete company (confirmation required; two-step if it has applications) |
| `Esc` | Back |

### Application detail (`⏎` on an application)

| Key | Action |
|---|---|
| `⏎` | Open the job description (view & edit) |
| `f` | AI fit analysis (choose EN/PL profile); saved and reused, asks before re-running |
| `c` | Tailor CV for this role (choose EN/PL, saved to CV manager); asks before re-running |
| `e` | Edit the application: position, company, URL, salary, deadline, contact, notes |
| `d` | Delete this application (confirmation required) |
| `w` | Cycle work mode: office → remote → hybrid → unknown |
| `s` | Cycle status: bookmarked → applied → phone screen → interview → offer → rejected |
| `o` | Open job URL |
| `Esc` | Back |

### Job description (`⏎` on an application)

| Key | Action |
|---|---|
| `↑`/`↓` or `j`/`k` | Scroll the description |
| `e` | Edit — type or paste, `⏎` saves, `Esc` cancels |
| `Esc` | Back to the application |

### Board (`[b]`) — all applications grouped by company

| Key | Action |
|---|---|
| `↑`/`↓` | Move between applications |
| `⏎` | Open application detail |
| `Esc` | Back |

### CV manager (`[v]`)

| Key | Action |
|---|---|
| `↑`/`↓` | Move (English profile, Polish profile, then tailored CVs) |
| `⏎` | View full text (scrollable with `↑`/`↓`) |
| `r` | Reload base profiles from disk |
| `d` | Delete the selected tailored CV |
| `Esc` | Back |

Base profiles are plain-text files you edit directly:
`data/base-cv-en.txt` and `data/base-cv-pl.txt`. After editing, press `[r]` to reload.

### Candidates (`[c]`) — found by harvest/discover, pending review

| Key | Action |
|---|---|
| `↑`/`↓` | Move |
| `a` | Approve → moves to tracked company list |
| `r` | Reject |
| `u` | Un-reject (restore to pending) |
| `e` | Edit career page URL |
| `o` | Open URL |
| `Tab` | Toggle showing rejected candidates |
| `d` | Run discovery to find more |
| `Esc` | Back |

---

## AI features (DeepSeek)

Both require `DEEPSEEK_API_KEY` in `.env`. Get a key at https://platform.deepseek.com/.

- **Fit analysis `[f]`** — rates your CV against the job, lists matching skills, gaps, and tips.
  The result is saved with the application and shown again when you reopen it. Re-running asks
  for confirmation first (it spends API tokens).
- **Tailor CV `[c]`** — rewrites your chosen base profile for the role; the result is saved as a
  tailored CV (labelled with the company, role, and EN/PL) in the CV manager. Re-running asks for
  confirmation first.

Optional overrides in `.env`:

```
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

---

## Optional: Google Discovery setup

Only needed for `[d]iscover` (finding companies that aren't on the big portals). Harvest `[g]`
covers the major portals without any keys.

```bash
# in .env
GOOGLE_API_KEY=your_key_here
GOOGLE_CSE_ID=your_engine_id_here
```

1. API key: https://developers.google.com/custom-search/v1/introduction → "Get a Key", enable the API.
2. Search engine ID: https://programmablesearchengine.google.com/ → Add → set "Search the entire
   web" → copy the Search engine ID.

Free tier: 100 queries/day.

---

## How harvest finds career pages

1. **Scrape portals** — pulls company names from justjoin.it, pracuj.pl, and nofluffjobs filtered
   to Wrocław and remote/hybrid roles. Uses a real browser (Playwright) because the portals block
   plain HTTP requests.
2. **Find each company's career page** — guesses the company's domain from its name and probes
   ~26 common career-page paths (`/kariera`, `/praca`, `/careers`, `/jobs`, `/oferty-pracy`,
   `/rekrutacja`, `/join-us`, …).

Companies with a found career page become **candidates** for your review. Companies with complex
legal names that can't be guessed are skipped — add those manually with `[n]`.

---

## Project structure

```
job-searching-platform/
├── src/
│   ├── cli.ts                  entry point — routes tui/harvest/discover
│   ├── config.ts               env loading, paths, career URL patterns
│   ├── db.ts                   SQLite schema + all query helpers
│   ├── types.ts                shared TypeScript types
│   ├── base-cv.ts              read/ensure the EN/PL base profile files
│   ├── enrich/
│   │   └── llm.ts              DeepSeek fit analysis + CV tailoring
│   ├── harvest/
│   │   ├── index.ts            orchestrates portal scrapers + career probing
│   │   ├── justjoin.ts         justjoin.it scraper (Playwright)
│   │   ├── pracuj.ts           pracuj.pl scraper (Playwright)
│   │   ├── nofluffjobs.ts      nofluffjobs scraper
│   │   ├── ddg-search.ts       DuckDuckGo fallback search
│   │   ├── guess-domain.ts     company name → candidate domains
│   │   ├── find-career.ts      probes domains for a career page
│   │   └── filter.ts           Wrocław / remote / hybrid filter
│   ├── discover/
│   │   ├── index.ts            Google search + URL probing
│   │   ├── search.ts           Google Custom Search queries
│   │   └── probe.ts            tries career URL patterns on a domain
│   ├── scrape/
│   │   └── browser.ts          shared Playwright instance + concurrency helper
│   └── tui/
│       ├── app.tsx             main ink app — state, keys, view routing
│       ├── index.tsx           renders the ink app
│       ├── ListView.tsx        company list with work-mode + application sub-rows
│       ├── DetailView.tsx      company info + its applications
│       ├── BoardView.tsx       all applications grouped by company
│       ├── ApplicationDetailView.tsx  one application + AI results
│       ├── JobDescriptionView.tsx     scrollable / editable job description
│       ├── AddView.tsx         add-company form
│       ├── AddApplicationView.tsx     add-application form
│       ├── CandidatesView.tsx  candidate review list
│       ├── CVView.tsx          base profiles + tailored CVs
│       └── HelpView.tsx        in-app help screen
├── data/                       (gitignored)
│   ├── tracker.db              SQLite database (created automatically)
│   ├── base-cv-en.txt          English base profile (you edit this)
│   └── base-cv-pl.txt          Polish base profile (you edit this)
├── .env.example                template for API keys
├── .env                        your keys (gitignored)
├── DEPLOY.md                   server deployment guide
├── package.json
└── tsconfig.json
```

---

## Database tables

The SQLite database at `data/tracker.db`:

**companies** — companies you track
`id, name, url, source, city, notes, created_at, interest_level, …`
(A `work_mode` column still exists here from when work mode was company-level; it is no longer
used — work mode now lives on each application.)

**applications** — job postings, linked to a company
`id, company_id, position_name, job_url, job_description, status, work_mode, salary, deadline,
contact, fit_analysis, applied_at, notes, created_at`

**candidates** — companies found by harvest/discover, pending review
`id, name, url, source, found_at, decision`

**cvs** — tailored CVs generated by the AI
`id, application_id, is_base, label, content, created_at`

> A legacy `snapshots` table still exists in the schema from the earlier page-monitoring feature
> but is no longer written to or read. It's harmless and can be ignored.

---

## Known limitations

- **Portal scrapers break when a site changes its markup.** The relevant file in `src/harvest/`
  needs a selector update when that happens — the nature of web scraping.
- **Domain guessing misses companies with complex legal names** (e.g. "… KOGENERACJA S.A.").
  Add those manually with `[n]`, or use discovery with a Google key.
- **Harvest uses real browser memory** — it runs up to 4 concurrent Chromium instances, ~500 MB
  RAM during the scrape. Normal and temporary.
- **AI quality depends on your base profiles.** Keep `data/base-cv-en.txt` and
  `data/base-cv-pl.txt` complete and current for good fit analysis and tailoring.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: Node 22+, `npm install`, and make sure
`npm run typecheck` and `npm test` pass before opening a pull request.

## License

[MIT](LICENSE) © Career Tracker contributors.
