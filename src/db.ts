import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { DATA_DIR, DB_PATH } from "./config.js";
import type {
  Application,
  ApplicationStatus,
  Candidate,
  CandidateDecision,
  Company,
  CompanyStatus,
  CV,
  FoundCompany,
  InterestLevel,
  Snapshot,
} from "./types.js";

mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'manual',
    city TEXT NOT NULL DEFAULT '',
    work_mode TEXT NOT NULL DEFAULT 'unknown',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_checked_at TEXT,
    status TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    checked_at TEXT NOT NULL DEFAULT (datetime('now')),
    content_hash TEXT NOT NULL,
    content_text TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'ok',
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'discover',
    found_at TEXT NOT NULL DEFAULT (datetime('now')),
    decision TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    position_name TEXT NOT NULL DEFAULT '',
    job_url TEXT NOT NULL DEFAULT '',
    job_description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'bookmarked',
    work_mode TEXT NOT NULL DEFAULT 'unknown',
    salary TEXT NOT NULL DEFAULT '',
    deadline TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    fit_analysis TEXT NOT NULL DEFAULT '',
    applied_at TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cvs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
    is_base INTEGER NOT NULL DEFAULT 0,
    label TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Add interest_level to companies if it doesn't exist yet. SQLite has no
// `ADD COLUMN IF NOT EXISTS`, so swallow the "duplicate column" error.
try {
  db.exec(
    "ALTER TABLE companies ADD COLUMN interest_level TEXT NOT NULL DEFAULT 'medium'",
  );
} catch {
  // column already exists — fine
}

// Work mode moved from companies to individual applications.
try {
  db.exec(
    "ALTER TABLE applications ADD COLUMN work_mode TEXT NOT NULL DEFAULT 'unknown'",
  );
} catch {
  // column already exists — fine
}

// Per-application detail fields and persisted AI fit analysis. SQLite has no
// `ADD COLUMN IF NOT EXISTS`, so swallow the "duplicate column" error per column.
for (const col of [
  "salary TEXT NOT NULL DEFAULT ''",
  "deadline TEXT NOT NULL DEFAULT ''",
  "contact TEXT NOT NULL DEFAULT ''",
  "fit_analysis TEXT NOT NULL DEFAULT ''",
]) {
  try {
    db.exec(`ALTER TABLE applications ADD COLUMN ${col}`);
  } catch {
    // column already exists — fine
  }
}

// ── Companies ──────────────────────────────────────────────────────────────

export function listCompanies(): Company[] {
  return db
    .prepare("SELECT * FROM companies ORDER BY name COLLATE NOCASE")
    .all() as unknown as Company[];
}

export function getCompany(id: number): Company | undefined {
  return db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as unknown as
    | Company
    | undefined;
}

/** Insert a found company; ignores if the URL already exists. Returns true if inserted. */
export function addCompany(c: FoundCompany): boolean {
  const res = db
    .prepare(
      `INSERT OR IGNORE INTO companies (name, url, source, city, work_mode, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      c.name,
      c.url,
      c.source,
      c.city ?? "",
      c.work_mode ?? "unknown",
      c.notes ?? "",
    );
  return res.changes > 0;
}

export function updateCompany(
  id: number,
  fields: Partial<Pick<Company, "name" | "url" | "city" | "notes" | "work_mode">>,
): void {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map(
    (k) => (fields as Record<string, string>)[k],
  );
  db.prepare(`UPDATE companies SET ${setClause} WHERE id = ?`).run(...values, id);
}

export function deleteCompany(id: number): void {
  db.prepare("DELETE FROM companies WHERE id = ?").run(id);
}

export function setStatus(id: number, status: CompanyStatus): void {
  db.prepare(
    "UPDATE companies SET status = ?, last_checked_at = datetime('now') WHERE id = ?",
  ).run(status, id);
}

/** Reset a 'changed' company back to seen. */
export function markSeen(id: number): void {
  db.prepare("UPDATE companies SET status = 'ok' WHERE id = ?").run(id);
}

export function setInterestLevel(companyId: number, level: InterestLevel): void {
  db.prepare("UPDATE companies SET interest_level = ? WHERE id = ?").run(
    level,
    companyId,
  );
}

// ── Snapshots ──────────────────────────────────────────────────────────────

export function addSnapshot(
  s: Omit<Snapshot, "id" | "checked_at">,
): void {
  db.prepare(
    `INSERT INTO snapshots (company_id, content_hash, content_text, status, error_message)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    s.company_id,
    s.content_hash,
    s.content_text,
    s.status,
    s.error_message,
  );
}

/** Most recent successful snapshot for a company, if any. */
export function latestOkSnapshot(companyId: number): Snapshot | undefined {
  return db
    .prepare(
      `SELECT * FROM snapshots
       WHERE company_id = ? AND status = 'ok'
       ORDER BY id DESC LIMIT 1`,
    )
    .get(companyId) as unknown as Snapshot | undefined;
}

/** Latest N snapshots (any status), newest first. */
export function latestSnapshots(companyId: number, n: number): Snapshot[] {
  return db
    .prepare(
      "SELECT * FROM snapshots WHERE company_id = ? ORDER BY id DESC LIMIT ?",
    )
    .all(companyId, n) as unknown as Snapshot[];
}

// ── Candidates ─────────────────────────────────────────────────────────────

export function listCandidates(decision?: CandidateDecision): Candidate[] {
  if (decision) {
    return db
      .prepare(
        "SELECT * FROM candidates WHERE decision = ? ORDER BY found_at DESC",
      )
      .all(decision) as unknown as Candidate[];
  }
  return db
    .prepare("SELECT * FROM candidates ORDER BY found_at DESC")
    .all() as unknown as Candidate[];
}

export function updateCandidateUrl(id: number, url: string): void {
  db.prepare("UPDATE candidates SET url = ? WHERE id = ?").run(url, id);
}

/** Add a discovered candidate; ignores duplicates and URLs already tracked. */
export function addCandidate(c: {
  name: string;
  url: string;
  source: string;
}): boolean {
  const tracked = db
    .prepare("SELECT 1 FROM companies WHERE url = ?")
    .get(c.url);
  if (tracked) return false;
  const res = db
    .prepare(
      "INSERT OR IGNORE INTO candidates (name, url, source) VALUES (?, ?, ?)",
    )
    .run(c.name, c.url, c.source);
  return res.changes > 0;
}

export function setCandidateDecision(
  id: number,
  decision: CandidateDecision,
): void {
  db.prepare("UPDATE candidates SET decision = ? WHERE id = ?").run(
    decision,
    id,
  );
}

/** Promote an approved candidate into companies, then mark it approved. */
export function promoteCandidate(id: number): boolean {
  const cand = db
    .prepare("SELECT * FROM candidates WHERE id = ?")
    .get(id) as unknown as Candidate | undefined;
  if (!cand) return false;
  const inserted = addCompany({
    name: cand.name,
    url: cand.url,
    source: cand.source,
    city: "",
    work_mode: "unknown",
  });
  setCandidateDecision(id, "approved");
  return inserted;
}

// ── Applications ────────────────────────────────────────────────────────────

/** An application row joined with its company name (null when not linked). */
export type ApplicationRow = Application & { company_name: string | null };

export function listApplications(status?: ApplicationStatus): ApplicationRow[] {
  const base = `
    SELECT a.*, c.name AS company_name
    FROM applications a
    LEFT JOIN companies c ON c.id = a.company_id`;
  if (status) {
    return db
      .prepare(`${base} WHERE a.status = ? ORDER BY a.created_at DESC`)
      .all(status) as unknown as ApplicationRow[];
  }
  return db
    .prepare(`${base} ORDER BY a.created_at DESC`)
    .all() as unknown as ApplicationRow[];
}

export function getApplication(id: number): ApplicationRow | undefined {
  return db
    .prepare(
      `SELECT a.*, c.name AS company_name
       FROM applications a
       LEFT JOIN companies c ON c.id = a.company_id
       WHERE a.id = ?`,
    )
    .get(id) as unknown as ApplicationRow | undefined;
}

/** Insert a new application. Returns the new row id. */
export function addApplication(
  a: Omit<Application, "id" | "created_at">,
): number {
  const res = db
    .prepare(
      `INSERT INTO applications
         (company_id, position_name, job_url, job_description, status, work_mode,
          salary, deadline, contact, fit_analysis, applied_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      a.company_id,
      a.position_name,
      a.job_url,
      a.job_description,
      a.status,
      a.work_mode,
      a.salary,
      a.deadline,
      a.contact,
      a.fit_analysis,
      a.applied_at,
      a.notes,
    );
  return Number(res.lastInsertRowid);
}

export function updateApplication(
  id: number,
  fields: Partial<
    Pick<
      Application,
      | "company_id"
      | "position_name"
      | "job_url"
      | "job_description"
      | "status"
      | "work_mode"
      | "salary"
      | "deadline"
      | "contact"
      | "fit_analysis"
      | "applied_at"
      | "notes"
    >
  >,
): void {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => (fields as Record<string, unknown>)[k]);
  db.prepare(`UPDATE applications SET ${setClause} WHERE id = ?`).run(
    ...(values as (string | number | null)[]),
    id,
  );
}

export function deleteApplication(id: number): void {
  db.prepare("DELETE FROM applications WHERE id = ?").run(id);
}

export function deleteApplicationsByCompany(companyId: number): void {
  db.prepare("DELETE FROM applications WHERE company_id = ?").run(companyId);
}

/** Find a tracked company by name (case-insensitive). */
export function findCompanyByName(name: string): Company | undefined {
  return db
    .prepare("SELECT * FROM companies WHERE name = ? COLLATE NOCASE")
    .get(name) as unknown as Company | undefined;
}

// ── CVs ─────────────────────────────────────────────────────────────────────

export function listCVs(applicationId?: number): CV[] {
  if (applicationId != null) {
    return db
      .prepare(
        "SELECT * FROM cvs WHERE application_id = ? ORDER BY created_at DESC",
      )
      .all(applicationId) as unknown as CV[];
  }
  return db
    .prepare("SELECT * FROM cvs WHERE is_base = 0 ORDER BY created_at DESC")
    .all() as unknown as CV[];
}

export function getBaseCV(): CV | undefined {
  return db
    .prepare("SELECT * FROM cvs WHERE is_base = 1 ORDER BY id DESC LIMIT 1")
    .get() as unknown as CV | undefined;
}

/** Insert a CV (base or tailored). Returns the new row id. */
export function saveCV(cv: Omit<CV, "id" | "created_at">): number {
  const res = db
    .prepare(
      "INSERT INTO cvs (application_id, is_base, label, content) VALUES (?, ?, ?, ?)",
    )
    .run(cv.application_id, cv.is_base, cv.label, cv.content);
  return Number(res.lastInsertRowid);
}

export function deleteCV(id: number): void {
  db.prepare("DELETE FROM cvs WHERE id = ?").run(id);
}

export default db;
