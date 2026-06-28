# Contributing

Thanks for your interest in Career Tracker! This is a small, single-user tool, but
contributions and bug reports are welcome.

## Prerequisites

- **Node.js ≥ 22** (the app uses the built-in `node:sqlite` module). Check with `node --version`.
- **npm 10+**

## Setup

```bash
git clone https://github.com/0xmmhh/career-tracker.git
cd career-tracker
npm install
```

Optional, only if you'll work on the portal scrapers (`harvest`):

```bash
npx playwright install chromium
```

## Development workflow

```bash
npm start          # run the terminal UI
npm run typecheck  # tsc --noEmit — must pass before opening a PR
npm test           # node:test suite (database layer)
```

Please make sure both `npm run typecheck` and `npm test` pass before submitting a pull
request. CI runs the same two checks on every push and PR.

## Code style

- TypeScript (ESM), run via `tsx` — there is no build step.
- Match the existing style; keep changes surgical and focused (see `CLAUDE.md`).
- Prefer the smallest change that solves the problem. No speculative abstractions.

## Reporting bugs

Open an issue describing what you did, what you expected, and what happened. Include your
Node version and OS. Never paste secrets (your `.env`) or personal data (`data/`).
