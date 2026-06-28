# Deploying Career Tracker to a Server

This is a **terminal app (TUI)**. On a server you run it inside an SSH session — there is
no web interface. It is a single-user personal tool. See `README.md` for what the app does
and the full key reference; this file covers server setup only.

---

## 1. Requirements on the server

| Requirement | Why | Check |
|---|---|---|
| **Node.js ≥ 22** | Uses the built-in `node:sqlite` module (not available before v22) | `node --version` |
| **Playwright + Chromium** | Only needed for `npm run harvest` (scraping job portals) | installed in step 3 |
| A real terminal over SSH | It's a full-screen TUI (ink/React) | — |

If the server has an older Node, install Node 22+ first (e.g. via
[nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`).

---

## 2. Copy the project over

You will receive a file like `career-tracker.tar.gz`. It contains the source, your
`data/` folder (companies, applications, CVs), but **not** `node_modules` or `.env`.

From your local machine:

```bash
scp career-tracker.tar.gz user@your-server:~/
```

Then on the server:

```bash
ssh user@your-server
tar -xzf career-tracker.tar.gz
cd job-searching-platform
```

---

## 3. Install dependencies

```bash
npm install
npx playwright install chromium      # only if you'll use `npm run harvest`
```

On a bare Linux server Playwright may need system libraries. If `harvest` fails with a
missing-library error, run:

```bash
npx playwright install-deps chromium  # needs sudo; Debian/Ubuntu
```

You can skip both Playwright steps entirely if you don't plan to use `[g]ather` —
everything else (manual companies, applications, AI features) works without it.

---

## 4. Create the `.env` file (secrets — not included in the tarball)

The API key was intentionally left out of the package. Create `.env` on the server:

```bash
cp .env.example .env
nano .env        # paste your DeepSeek key into DEEPSEEK_API_KEY=
```

Minimum needed for the AI fit/tailor features:

```
DEEPSEEK_API_KEY=sk-...your key...
```

`GOOGLE_API_KEY` / `GOOGLE_CSE_ID` are optional (only for `[d]iscover`) — leave blank.

---

## 5. Run it

```bash
npm start
```

That launches the TUI. Press `[h]` inside the app for the full key reference.

CLI-only commands (no UI):

```bash
npm run harvest    # scrape portals → candidates (needs Playwright)
npm run discover   # Google-search discovery → candidates (needs Google keys)
npm run typecheck  # tsc --noEmit, sanity check after edits
```

---

## 6. Notes & gotchas

- **Data location:** everything lives in `data/` — `tracker.db` (SQLite) and the
  `base-cv-en.txt` / `base-cv-pl.txt` profiles. Back this folder up to keep your data.
- **Editing CV profiles:** edit `data/base-cv-en.txt` and `data/base-cv-pl.txt` in any
  editor, then press `[r]` in the CV view (`[v]`) to reload.
- **SQLite WAL files:** `tracker.db-wal` and `tracker.db-shm` may appear next to the DB —
  that's normal, don't delete them while the app runs.
- **Keeping a session alive:** if you want the TUI to survive disconnects, run it inside
  `tmux` or `screen` (`tmux new -s tracker`, then `npm start`; reattach with `tmux a -t tracker`).
