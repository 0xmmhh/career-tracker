import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point the database at a throwaway file BEFORE importing db.ts (which opens the
// DB at module load). config.ts reads CAREER_TRACKER_DB to override the path.
const tmpDir = mkdtempSync(join(tmpdir(), "career-tracker-test-"));
process.env.CAREER_TRACKER_DB = join(tmpDir, "test.db");

let db: typeof import("../src/db.js");

before(async () => {
  db = await import("../src/db.js");
});

after(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

test("companies: add, list, get, update, delete", () => {
  assert.equal(db.addCompany({ name: "Acme", url: "https://acme.test", source: "manual" }), true);
  // Duplicate URL is ignored.
  assert.equal(db.addCompany({ name: "Acme Dup", url: "https://acme.test", source: "manual" }), false);

  const all = db.listCompanies();
  const acme = all.find((c) => c.url === "https://acme.test");
  assert.ok(acme, "added company is listed");
  assert.equal(acme!.name, "Acme");

  db.updateCompany(acme!.id, { name: "Acme Inc", work_mode: "remote" });
  const updated = db.getCompany(acme!.id);
  assert.equal(updated!.name, "Acme Inc");
  assert.equal(updated!.work_mode, "remote");

  db.deleteCompany(acme!.id);
  assert.equal(db.getCompany(acme!.id), undefined);
});

test("applications: store and round-trip the new fields", () => {
  db.addCompany({ name: "Globex", url: "https://globex.test", source: "manual" });
  const company = db.findCompanyByName("Globex")!;

  const id = db.addApplication({
    company_id: company.id,
    position_name: "Backend Engineer",
    job_url: "https://globex.test/jobs/1",
    job_description: "Build things.",
    status: "bookmarked",
    work_mode: "hybrid",
    salary: "18 000–22 000 PLN",
    deadline: "2026-07-15",
    contact: "jane@globex.test",
    fit_analysis: "",
    applied_at: null,
    notes: "looks promising",
  });

  const app = db.getApplication(id)!;
  assert.equal(app.company_name, "Globex"); // join works
  assert.equal(app.work_mode, "hybrid");
  assert.equal(app.salary, "18 000–22 000 PLN");
  assert.equal(app.deadline, "2026-07-15");
  assert.equal(app.contact, "jane@globex.test");
  assert.equal(app.fit_analysis, "");

  db.updateApplication(id, { status: "applied", fit_analysis: "Fit: 8/10", salary: "25 000 PLN" });
  const after = db.getApplication(id)!;
  assert.equal(after.status, "applied");
  assert.equal(after.fit_analysis, "Fit: 8/10");
  assert.equal(after.salary, "25 000 PLN");

  db.deleteApplication(id);
  assert.equal(db.getApplication(id), undefined);
});

test("candidates: promote moves a candidate into companies", () => {
  db.addCandidate({ name: "Initech", url: "https://initech.test", source: "discover" });
  const pending = db.listCandidates("pending");
  const cand = pending.find((c) => c.url === "https://initech.test");
  assert.ok(cand, "candidate is pending");

  assert.equal(db.promoteCandidate(cand!.id), true);
  assert.ok(db.findCompanyByName("Initech"), "promoted candidate becomes a company");
  assert.equal(db.listCandidates("approved").some((c) => c.id === cand!.id), true);

  // Adding a candidate whose URL is already tracked is rejected.
  assert.equal(
    db.addCandidate({ name: "Initech Again", url: "https://initech.test", source: "discover" }),
    false,
  );
});

test("cvs: save, list by application, and delete", () => {
  db.addApplication({
    company_id: null,
    position_name: "Role",
    job_url: "",
    job_description: "",
    status: "bookmarked",
    work_mode: "unknown",
    salary: "",
    deadline: "",
    contact: "",
    fit_analysis: "",
    applied_at: null,
    notes: "",
  });
  const appId = db.listApplications()[0].id;

  const cvId = db.saveCV({ application_id: appId, is_base: 0, label: "Tailored EN", content: "CV body" });
  const forApp = db.listCVs(appId);
  assert.equal(forApp.length, 1);
  assert.equal(forApp[0].label, "Tailored EN");

  db.deleteCV(cvId);
  assert.equal(db.listCVs(appId).length, 0);
});
