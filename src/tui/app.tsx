import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { spawn } from "node:child_process";
import {
  addApplication,
  addCompany,
  deleteApplication,
  deleteApplicationsByCompany,
  deleteCompany,
  deleteCV,
  findCompanyByName,
  listApplications,
  listCandidates,
  listCompanies,
  listCVs,
  promoteCandidate,
  saveCV,
  setCandidateDecision,
  setInterestLevel,
  updateApplication,
  updateCandidateUrl,
  type ApplicationRow,
} from "../db.js";
import { harvestAll } from "../harvest/index.js";
import { discoverAll } from "../discover/index.js";
import { analyzeJobFit, tailorCV } from "../enrich/llm.js";
import { ensureBaseCVFiles, readBaseCV } from "../base-cv.js";
import { ListView } from "./ListView.js";
import { DetailView } from "./DetailView.js";
import { CandidatesView } from "./CandidatesView.js";
import { AddView, FIELD_ORDER, nextField } from "./AddView.js";
import {
  AddApplicationView,
  EMPTY_APP_FORM,
  nextAppField,
  APP_FIELD_ORDER,
} from "./AddApplicationView.js";
import { BoardView, STATUS_ORDER } from "./BoardView.js";
import { ApplicationDetailView } from "./ApplicationDetailView.js";
import { JobDescriptionView, JOBDESC_PAGE_SIZE } from "./JobDescriptionView.js";
import { CVView, CV_PAGE_SIZE } from "./CVView.js";
import { HelpView, HELP_TOTAL_LINES } from "./HelpView.js";
import type { AddField, AddForm } from "./AddView.js";
import type { AppField, AppForm } from "./AddApplicationView.js";
import type {
  ApplicationStatus,
  Candidate,
  Company,
  CV,
  InterestLevel,
  WorkMode,
} from "../types.js";

function openUrl(url: string) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

const INTEREST_CYCLE: InterestLevel[] = ["high", "medium", "low", "none"];
function nextInterest(level: InterestLevel): InterestLevel {
  const i = INTEREST_CYCLE.indexOf(level ?? "medium");
  return INTEREST_CYCLE[(i + 1) % INTEREST_CYCLE.length];
}

const WORKMODE_CYCLE: WorkMode[] = ["office", "remote", "hybrid", "unknown"];
function nextWorkMode(mode: WorkMode): WorkMode {
  const i = WORKMODE_CYCLE.indexOf(mode ?? "unknown");
  return WORKMODE_CYCLE[(i + 1) % WORKMODE_CYCLE.length];
}

function nextStatus(s: ApplicationStatus): ApplicationStatus {
  const i = STATUS_ORDER.indexOf(s);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

function nowStr(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

type View =
  | "list"
  | "detail"
  | "candidates"
  | "add"
  | "board"
  | "application"
  | "addApp"
  | "jobdesc"
  | "cv"
  | "help";

const EMPTY_FORM: AddForm = { name: "", url: "", notes: "" };

export function App() {
  const { exit } = useApp();
  const [view, setView] = useState<View>("list");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [baseCVEn, setBaseCVEn] = useState("");
  const [baseCVPl, setBaseCVPl] = useState("");
  const [selected, setSelected] = useState(0);
  const [candSelected, setCandSelected] = useState(0);
  const [appSelected, setAppSelected] = useState(0);      // board navigation
  const [detailAppSelected, setDetailAppSelected] = useState(0); // apps in company detail
  const [cvSelected, setCvSelected] = useState(0);
  const [cvViewing, setCvViewing] = useState<CV | null>(null);
  const [helpScroll, setHelpScroll] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [appDetailId, setAppDetailId] = useState<number | null>(null);
  const [appDetailReturn, setAppDetailReturn] = useState<"detail" | "board">("detail");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [filter, setFilter] = useState("");
  const [searching, setSearching] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(EMPTY_FORM);
  const [addField, setAddField] = useState<AddField>("name");
  const [appForm, setAppForm] = useState<AppForm>(EMPTY_APP_FORM);
  const [appField, setAppField] = useState<AppField>("position");
  const [appLockedCompany, setAppLockedCompany] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [editingCandUrl, setEditingCandUrl] = useState(false);
  const [editCandUrlValue, setEditCandUrlValue] = useState("");
  const [highOnly, setHighOnly] = useState(false);
  const [appEditId, setAppEditId] = useState<number | null>(null);
  const [fitResult, setFitResult] = useState<string | null>(null);
  const [tailorResult, setTailorResult] = useState<string | null>(null);
  const [descScroll, setDescScroll] = useState(0);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [cvScroll, setCvScroll] = useState(0);
  const [langPick, setLangPick] = useState<null | "fit" | "tailor">(null);
  const [tailorConfirm, setTailorConfirm] = useState(false);
  const [fitConfirm, setFitConfirm] = useState(false);
  const [appDeleteConfirm, setAppDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<null | {
    companyId: number;
    appCount: number;
    step: 1 | 2;
  }>(null);

  function reload() {
    setCompanies(listCompanies());
    setCandidates(showRejected ? listCandidates() : listCandidates("pending"));
    setApplications(listApplications());
    setCvs(listCVs());
    setBaseCVEn(readBaseCV("en"));
    setBaseCVPl(readBaseCV("pl"));
  }

  useEffect(() => {
    ensureBaseCVFiles();
    reload();
  }, [showRejected]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const searchFiltered = filter
    ? companies.filter((c) =>
        (c.name + " " + c.url).toLowerCase().includes(filter.toLowerCase()),
      )
    : companies;
  const filtered = highOnly
    ? searchFiltered.filter((c) => c.interest_level === "high")
    : searchFiltered;

  const appsByCompany = new Map<number, ApplicationRow[]>();
  for (const a of applications) {
    if (a.company_id == null) continue;
    if (!appsByCompany.has(a.company_id)) appsByCompany.set(a.company_id, []);
    appsByCompany.get(a.company_id)!.push(a);
  }

  const companyApplications =
    detailId != null ? applications.filter((a) => a.company_id === detailId) : [];

  const boardApplications = [...applications].sort((a, b) =>
    (a.company_name ?? "").localeCompare(b.company_name ?? ""),
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  async function run(label: string, fn: () => Promise<string>) {
    setBusy(label);
    setMessage("");
    try {
      const result = await fn();
      setMessage(result);
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
      reload();
    }
  }

  const detailApp =
    appDetailId != null ? applications.find((a) => a.id === appDetailId) : undefined;

  function cycleAppStatus(id: number) {
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    const next = nextStatus(app.status);
    const fields: Parameters<typeof updateApplication>[1] = { status: next };
    if (next === "applied" && !app.applied_at) fields.applied_at = nowStr();
    updateApplication(id, fields);
    reload();
    setMessage(`Status → ${next}`);
  }

  // ── Search filter ──────────────────────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.return || key.escape) { setSearching(false); return; }
      if (key.backspace || key.delete) { setFilter((f) => f.slice(0, -1)); return; }
      if (input) setFilter((f) => f + input);
    },
    { isActive: searching },
  );

  // ── Candidate URL edit ─────────────────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) { setEditingCandUrl(false); return; }
      if (key.return) {
        const trimmed = editCandUrlValue.trim();
        if (trimmed && candidates[candSelected]) {
          updateCandidateUrl(candidates[candSelected].id, trimmed);
          reload();
          setMessage("URL updated");
        }
        setEditingCandUrl(false);
        return;
      }
      if (key.backspace || key.delete) { setEditCandUrlValue((v) => v.slice(0, -1)); return; }
      if (input) setEditCandUrlValue((v) => v + input);
    },
    { isActive: editingCandUrl },
  );

  // ── Job description edit ───────────────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) { setEditingDesc(false); return; }
      if (key.return) {
        if (appDetailId != null) {
          updateApplication(appDetailId, { job_description: descValue });
          reload();
          setMessage("Job description saved");
        }
        setEditingDesc(false);
        return;
      }
      if (key.backspace || key.delete) { setDescValue((v) => v.slice(0, -1)); return; }
      if (input) setDescValue((v) => v + input);
    },
    { isActive: editingDesc },
  );

  // ── Add company form ───────────────────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) { setView("list"); setAddForm(EMPTY_FORM); setAddField("name"); return; }
      if (key.tab) { setAddField((f) => nextField(f)); return; }
      if (key.return) {
        const isLast = addField === FIELD_ORDER[FIELD_ORDER.length - 1];
        if (!isLast && addField !== "url") { setAddField((f) => nextField(f)); return; }
        if (!addForm.name.trim() || !addForm.url.trim()) {
          setMessage("Name and URL are required");
          return;
        }
        const inserted = addCompany({
          name: addForm.name.trim(),
          url: addForm.url.trim(),
          source: "manual",
          notes: addForm.notes.trim(),
        });
        setMessage(inserted ? `Added: ${addForm.name.trim()}` : "URL already tracked");
        setAddForm(EMPTY_FORM);
        setAddField("name");
        setView("list");
        reload();
        return;
      }
      if (key.backspace || key.delete) {
        setAddForm((f) => ({ ...f, [addField]: f[addField].slice(0, -1) }));
        return;
      }
      if (input) setAddForm((f) => ({ ...f, [addField]: f[addField] + input }));
    },
    { isActive: view === "add" },
  );

  // ── Add application form ───────────────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) {
        setView(appEditId != null ? "application" : "detail");
        setAppForm(EMPTY_APP_FORM);
        setAppField("position");
        setAppLockedCompany(null);
        setAppEditId(null);
        return;
      }
      if (key.tab) {
        if (appLockedCompany && appField === "position") {
          setAppField("url");
          return;
        }
        if (!appLockedCompany && appField === "company" && appForm.company) {
          const match = companies.find((c) =>
            c.name.toLowerCase().startsWith(appForm.company.toLowerCase()),
          );
          if (match && match.name.toLowerCase() !== appForm.company.toLowerCase()) {
            setAppForm((f) => ({ ...f, company: match.name }));
            return;
          }
        }
        setAppField((f) => nextAppField(f));
        return;
      }
      if (key.return) {
        const isLast = appField === APP_FIELD_ORDER[APP_FIELD_ORDER.length - 1];
        if (!isLast) {
          let nextF = nextAppField(appField);
          if (nextF === "company" && appLockedCompany) nextF = nextAppField(nextF);
          setAppField(nextF);
          return;
        }
        const companyName = appLockedCompany ?? appForm.company.trim();
        if (!appForm.position.trim() && !companyName) {
          setMessage("Add at least a position or a company");
          return;
        }
        const company = companyName ? findCompanyByName(companyName) : undefined;
        if (appEditId != null) {
          updateApplication(appEditId, {
            company_id: company?.id ?? null,
            position_name: appForm.position.trim(),
            job_url: appForm.url.trim(),
            salary: appForm.salary.trim(),
            deadline: appForm.deadline.trim(),
            contact: appForm.contact.trim(),
            notes: appForm.notes.trim(),
          });
          setMessage(`Updated: ${appForm.position.trim() || companyName}`);
        } else {
          addApplication({
            company_id: company?.id ?? null,
            position_name: appForm.position.trim(),
            job_url: appForm.url.trim(),
            job_description: "",
            status: "bookmarked",
            work_mode: "unknown",
            salary: appForm.salary.trim(),
            deadline: appForm.deadline.trim(),
            contact: appForm.contact.trim(),
            fit_analysis: "",
            applied_at: null,
            notes: appForm.notes.trim(),
          });
          setMessage(`Saved: ${appForm.position.trim() || companyName}`);
        }
        const returnView = appEditId != null ? "application" : "detail";
        setAppForm(EMPTY_APP_FORM);
        setAppField("position");
        setAppLockedCompany(null);
        setAppEditId(null);
        setView(returnView);
        setDetailAppSelected(0);
        reload();
        return;
      }
      if (key.backspace || key.delete) {
        setAppForm((f) => ({ ...f, [appField]: f[appField].slice(0, -1) }));
        return;
      }
      if (input) setAppForm((f) => ({ ...f, [appField]: f[appField] + input }));
    },
    { isActive: view === "addApp" },
  );

  // ── Re-tailor confirmation (tailoring spends API tokens) ───────────────────
  useInput(
    (input, key) => {
      if (key.escape) { setTailorConfirm(false); return; }
      if (input === "y" || input === "Y") {
        setTailorConfirm(false);
        setLangPick("tailor");
      }
    },
    { isActive: tailorConfirm },
  );

  // ── Re-run fit confirmation (fit analysis spends API tokens) ───────────────
  useInput(
    (input, key) => {
      if (key.escape) { setFitConfirm(false); return; }
      if (input === "y" || input === "Y") {
        setFitConfirm(false);
        setLangPick("fit");
      }
    },
    { isActive: fitConfirm },
  );

  // ── Delete application confirmation ────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) { setAppDeleteConfirm(false); return; }
      if (input === "y") {
        if (appDetailId != null) {
          deleteApplication(appDetailId);
          reload();
          setDetailAppSelected(0);
          setAppSelected(0);
          setMessage("Application deleted");
        }
        setAppDeleteConfirm(false);
        setView(appDetailReturn);
      }
    },
    { isActive: appDeleteConfirm },
  );

  // ── Language picker (fit / tailor) ─────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) { setLangPick(null); return; }
      const lang =
        input === "e" || input === "E" ? "en" :
        input === "p" || input === "P" ? "pl" : null;
      if (!lang) return;
      const action = langPick;
      setLangPick(null);
      const app = applications.find((a) => a.id === appDetailId);
      if (!app) return;
      const langLabel = lang === "en" ? "English" : "Polish";
      if (action === "fit") {
        run("Analyzing fit", async () => {
          const cv = readBaseCV(lang);
          if (!cv.trim()) return `No ${langLabel} profile yet — add to data/base-cv-${lang}.txt`;
          const out = await analyzeJobFit(cv, app.job_description, app.company_name ?? "");
          if (!out) return "AI unavailable — set DEEPSEEK_API_KEY in .env.";
          updateApplication(app.id, { fit_analysis: out });
          setFitResult(out);
          return "Fit analysis ready";
        });
      } else if (action === "tailor") {
        run("Tailoring CV", async () => {
          const cv = readBaseCV(lang);
          if (!cv.trim()) return `No ${langLabel} profile yet — add to data/base-cv-${lang}.txt`;
          const out = await tailorCV(cv, app.job_description, app.company_name ?? "", app.position_name);
          if (!out) return "AI unavailable — set DEEPSEEK_API_KEY in .env.";
          saveCV({
            application_id: app.id,
            is_base: 0,
            label: `${app.company_name ?? "?"} – ${app.position_name || "role"} (${lang.toUpperCase()})`,
            content: out,
          });
          setTailorResult(out);
          return "Tailored CV saved";
        });
      }
    },
    { isActive: langPick !== null },
  );

  // ── Delete confirmation ────────────────────────────────────────────────────
  useInput(
    (input, key) => {
      if (key.escape) { setDeleteConfirm(null); return; }
      if (deleteConfirm?.step === 1 && input === "y") {
        if (deleteConfirm.appCount === 0) {
          deleteCompany(deleteConfirm.companyId);
          reload();
          setSelected(0);
          setView("list");
          setDeleteConfirm(null);
          setMessage("Company deleted");
        } else {
          setDeleteConfirm((c) => c ? { ...c, step: 2 } : null);
        }
        return;
      }
      if (deleteConfirm?.step === 2 && input === "Y") {
        deleteApplicationsByCompany(deleteConfirm.companyId);
        deleteCompany(deleteConfirm.companyId);
        reload();
        setSelected(0);
        setView("list");
        setDeleteConfirm(null);
        setMessage("Company and applications deleted");
      }
    },
    { isActive: deleteConfirm !== null },
  );

  // ── Main key handling ──────────────────────────────────────────────────────
  useInput(
    (input, key) => {
      if (busy) return;

      // ── Company list ───────────────────────────────────────────────────────
      if (view === "list") {
        if (input === "q") return exit();
        if (key.downArrow || input === "j")
          return setSelected((s) => Math.min(s + 1, filtered.length - 1));
        if (key.upArrow || input === "k")
          return setSelected((s) => Math.max(s - 1, 0));
        if (key.return && filtered[selected]) {
          setDetailId(filtered[selected].id);
          setDetailAppSelected(0);
          return setView("detail");
        }
        if (input === "o" && filtered[selected]) {
          openUrl(filtered[selected].url);
          return setMessage(`Opening ${filtered[selected].url}`);
        }
        if (input === "i" && filtered[selected]) {
          const next = nextInterest(filtered[selected].interest_level);
          setInterestLevel(filtered[selected].id, next);
          reload();
          return setMessage(`Interest → ${next}`);
        }
        if (input === "f") {
          setHighOnly((v) => !v);
          setSelected(0);
          return setMessage(highOnly ? "Showing all companies" : "Showing high-interest only");
        }
        if (input === "n") {
          setAddForm(EMPTY_FORM);
          setAddField("name");
          setMessage("");
          return setView("add");
        }
        if (input === "/") { setFilter(""); return setSearching(true); }
        if (input === "b") { setAppSelected(0); return setView("board"); }
        if (input === "v") { setCvSelected(0); setCvViewing(null); return setView("cv"); }
        if (input === "c") { setCandSelected(0); return setView("candidates"); }
        if (input === "h") { setHelpScroll(0); return setView("help"); }
        if (input === "g")
          return run("Harvesting portals", async () => {
            const rs = await harvestAll((p) =>
              setMessage(`${p.source}: ${p.name} → ${p.careerUrl ? p.careerUrl.slice(0, 40) : "no career page"}`),
            );
            const added = rs.reduce((a, r) => a + r.added, 0);
            const found = rs.reduce((a, r) => a + r.withCareerPage, 0);
            return `Harvest done: ${added} new candidates (${found} with career pages found)`;
          });
        if (input === "d")
          return run("Discovering companies", async () => {
            const r = await discoverAll((p) =>
              setMessage(`Probing ${p.done}/${p.total}: ${p.current}`),
            );
            if (!r.configured)
              return "Discovery needs Google API keys (optional) — see .env.example";
            return `Discovery done: ${r.added} candidates from ${r.domains} domains`;
          });
        return;
      }

      // ── Company detail ─────────────────────────────────────────────────────
      if (view === "detail" && detailId != null) {
        if (key.escape || input === "b") return setView("list");
        if (key.downArrow || input === "j")
          return setDetailAppSelected((s) => Math.min(s + 1, companyApplications.length - 1));
        if (key.upArrow || input === "k")
          return setDetailAppSelected((s) => Math.max(s - 1, 0));
        if (key.return && companyApplications[detailAppSelected]) {
          setAppDetailId(companyApplications[detailAppSelected].id);
          setFitResult(companyApplications[detailAppSelected].fit_analysis || null);
          setTailorResult(null);
          setDescScroll(0);
          setAppDetailReturn("detail");
          return setView("application");
        }
        if (input === "a") {
          const company = companies.find((c) => c.id === detailId);
          if (company) {
            setAppLockedCompany(company.name);
            setAppForm({ ...EMPTY_APP_FORM, company: company.name });
            setAppField("position");
            setMessage("");
            return setView("addApp");
          }
        }
        if (input === "o") {
          const company = companies.find((c) => c.id === detailId);
          if (company) { openUrl(company.url); return setMessage(`Opening ${company.url}`); }
        }
        if (input === "i") {
          const company = companies.find((c) => c.id === detailId);
          if (company) {
            const next = nextInterest(company.interest_level);
            setInterestLevel(company.id, next);
            reload();
            return setMessage(`Interest → ${next}`);
          }
        }
        if (input === "d") {
          setDeleteConfirm({ companyId: detailId, appCount: companyApplications.length, step: 1 });
          return;
        }
        return;
      }

      // ── Candidates ─────────────────────────────────────────────────────────
      if (view === "candidates") {
        if (key.escape || input === "b") return setView("list");
        if (key.downArrow || input === "j")
          return setCandSelected((s) => Math.min(s + 1, candidates.length - 1));
        if (key.upArrow || input === "k")
          return setCandSelected((s) => Math.max(s - 1, 0));
        if (input === "o" && candidates[candSelected]) {
          openUrl(candidates[candSelected].url);
          return setMessage(`Opening ${candidates[candSelected].url}`);
        }
        if (input === "e" && candidates[candSelected]) {
          setEditCandUrlValue(candidates[candSelected].url);
          return setEditingCandUrl(true);
        }
        if (input === "a" && candidates[candSelected]) {
          promoteCandidate(candidates[candSelected].id);
          reload();
          setCandSelected((s) => Math.max(0, s - 1));
          return setMessage("Approved → tracked");
        }
        if (input === "r" && candidates[candSelected]) {
          setCandidateDecision(candidates[candSelected].id, "rejected");
          reload();
          setCandSelected((s) => Math.max(0, s - 1));
          return setMessage("Rejected");
        }
        if (input === "u" && candidates[candSelected]) {
          setCandidateDecision(candidates[candSelected].id, "pending");
          reload();
          return setMessage("Restored to pending");
        }
        if (key.tab) {
          setShowRejected((v) => !v);
          setCandSelected(0);
          return setMessage(showRejected ? "Showing pending only" : "Showing all including rejected");
        }
        if (input === "d")
          return run("Discovering companies", async () => {
            const r = await discoverAll();
            if (!r.configured)
              return "Discovery needs Google API keys (optional) — see .env.example";
            return `Discovery done: ${r.added} new candidates`;
          });
        return;
      }

      // ── Board ──────────────────────────────────────────────────────────────
      if (view === "board") {
        if (key.escape || input === "b") return setView("list");
        if (key.downArrow || input === "j")
          return setAppSelected((s) => Math.min(s + 1, boardApplications.length - 1));
        if (key.upArrow || input === "k")
          return setAppSelected((s) => Math.max(s - 1, 0));
        if (key.return && boardApplications[appSelected]) {
          setAppDetailId(boardApplications[appSelected].id);
          setFitResult(boardApplications[appSelected].fit_analysis || null);
          setTailorResult(null);
          setDescScroll(0);
          setAppDetailReturn("board");
          return setView("application");
        }
        return;
      }

      // ── Application detail ─────────────────────────────────────────────────
      if (view === "application" && appDetailId != null) {
        if (key.escape || input === "b") return setView(appDetailReturn);
        const app = applications.find((a) => a.id === appDetailId);
        if (!app) return setView(appDetailReturn);
        if (key.return) { setDescScroll(0); return setView("jobdesc"); }
        if (input === "o" && app.job_url) {
          openUrl(app.job_url);
          return setMessage(`Opening ${app.job_url}`);
        }
        if (input === "w") {
          const next = nextWorkMode(app.work_mode);
          updateApplication(app.id, { work_mode: next });
          reload();
          return setMessage(`Work mode → ${next}`);
        }
        if (input === "s") return cycleAppStatus(app.id);
        if (input === "e") {
          setAppEditId(app.id);
          setAppLockedCompany(null);
          setAppForm({
            position: app.position_name,
            company: app.company_name ?? "",
            url: app.job_url,
            salary: app.salary,
            deadline: app.deadline,
            contact: app.contact,
            notes: app.notes,
          });
          setAppField("position");
          setMessage("");
          return setView("addApp");
        }
        if (input === "d") { setAppDeleteConfirm(true); return; }
        if (input === "f") {
          const alreadyAnalyzed = fitResult != null || !!app.fit_analysis;
          if (alreadyAnalyzed) { setFitConfirm(true); return; }
          setLangPick("fit");
          return;
        }
        if (input === "c") {
          const alreadyTailored =
            tailorResult != null || cvs.some((cv) => cv.application_id === app.id);
          if (alreadyTailored) { setTailorConfirm(true); return; }
          setLangPick("tailor");
          return;
        }
        return;
      }

      // ── Job description (drill-in from application) ──────────────────────────
      if (view === "jobdesc" && appDetailId != null) {
        const app = applications.find((a) => a.id === appDetailId);
        if (!app) return setView("application");
        if (key.escape || input === "b") return setView("application");
        if (key.downArrow || input === "j")
          return setDescScroll((s) =>
            Math.min(s + 1, Math.max(0, app.job_description.split("\n").length - JOBDESC_PAGE_SIZE)),
          );
        if (key.upArrow || input === "k")
          return setDescScroll((s) => Math.max(0, s - 1));
        if (input === "e") { setDescValue(app.job_description); return setEditingDesc(true); }
        return;
      }

      // ── CV manager ────────────────────────────────────────────────────────
      if (view === "cv") {
        if (cvViewing) {
          if (key.escape || input === "b") return setCvViewing(null);
          if (key.downArrow || input === "j")
            return setCvScroll((s) =>
              Math.min(s + 1, Math.max(0, cvViewing.content.split("\n").length - CV_PAGE_SIZE)),
            );
          if (key.upArrow || input === "k")
            return setCvScroll((s) => Math.max(0, s - 1));
          return;
        }
        if (key.escape || input === "b") return setView("list");
        if (key.downArrow || input === "j")
          return setCvSelected((s) => Math.min(s + 1, 1 + cvs.length));
        if (key.upArrow || input === "k")
          return setCvSelected((s) => Math.max(s - 1, 0));
        if (input === "r") {
          setBaseCVEn(readBaseCV("en"));
          setBaseCVPl(readBaseCV("pl"));
          return setMessage("Profiles reloaded");
        }
        if (key.return) {
          setCvScroll(0);
          if (cvSelected === 0)
            return setCvViewing({ id: -1, application_id: null, is_base: 1, label: "English Profile", content: baseCVEn, created_at: "" });
          if (cvSelected === 1)
            return setCvViewing({ id: -2, application_id: null, is_base: 1, label: "Polish Profile", content: baseCVPl, created_at: "" });
          const cv = cvs[cvSelected - 2];
          if (cv) setCvViewing(cv);
          return;
        }
        if (input === "d" && cvSelected >= 2 && cvs[cvSelected - 2]) {
          deleteCV(cvs[cvSelected - 2].id);
          reload();
          setCvSelected((s) => Math.max(0, s - 1));
          return setMessage("Tailored CV deleted");
        }
        return;
      }

      // ── Help ──────────────────────────────────────────────────────────────
      if (view === "help") {
        if (key.escape || input === "b" || input === "q") return setView("list");
        if (key.downArrow || input === "j")
          return setHelpScroll((s) => Math.min(s + 1, HELP_TOTAL_LINES - 1));
        if (key.upArrow || input === "k")
          return setHelpScroll((s) => Math.max(s - 1, 0));
        return;
      }
    },
    {
      isActive:
        !searching &&
        view !== "add" &&
        view !== "addApp" &&
        !editingCandUrl &&
        !editingDesc &&
        langPick === null &&
        !tailorConfirm &&
        !fitConfirm &&
        !appDeleteConfirm &&
        deleteConfirm === null,
    },
  );

  // ── Derived footer state ───────────────────────────────────────────────────
  const detailCompany =
    detailId != null ? companies.find((c) => c.id === detailId) : undefined;

  const deleteConfirmMsg = deleteConfirm
    ? deleteConfirm.step === 1
      ? `Delete '${companies.find((c) => c.id === deleteConfirm.companyId)?.name ?? "?"}'${
          deleteConfirm.appCount > 0
            ? ` and ${deleteConfirm.appCount} application${deleteConfirm.appCount !== 1 ? "s" : ""}`
            : ""
        }? [y] confirm  [Esc] cancel`
      : `All ${deleteConfirm.appCount} application${deleteConfirm.appCount !== 1 ? "s" : ""} will be permanently deleted. [Y] (uppercase) to confirm  [Esc] cancel`
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text bold color="cyan">Career Tracker</Text>
        <Text>
          {"  "}
          {companies.length} tracked · {applications.length} applications
        </Text>
      </Box>
      <Text dimColor>{"─".repeat(72)}</Text>

      {view === "list" && (
        <ListView companies={filtered} selected={selected} appsByCompany={appsByCompany} />
      )}
      {view === "detail" && detailCompany && (
        <DetailView
          company={detailCompany}
          applications={companyApplications}
          selected={detailAppSelected}
        />
      )}
      {view === "candidates" && (
        <CandidatesView candidates={candidates} selected={candSelected} showRejected={showRejected} />
      )}
      {view === "add" && <AddView form={addForm} activeField={addField} />}
      {view === "board" && (
        <BoardView applications={boardApplications} selected={appSelected} />
      )}
      {view === "addApp" && (
        <AddApplicationView
          form={appForm}
          activeField={appField}
          lockedCompany={appLockedCompany ?? undefined}
          title={appEditId != null ? "Edit application" : "Save a job posting"}
          suggestions={
            !appLockedCompany && appField === "company" && appForm.company
              ? companies
                  .filter((c) =>
                    c.name.toLowerCase().startsWith(appForm.company.toLowerCase()),
                  )
                  .slice(0, 5)
                  .map((c) => c.name)
              : []
          }
        />
      )}
      {view === "application" && detailApp && (
        <ApplicationDetailView
          application={detailApp}
          fitResult={fitResult}
          tailorResult={tailorResult}
        />
      )}
      {view === "jobdesc" && detailApp && (
        <JobDescriptionView
          application={detailApp}
          scroll={descScroll}
          editing={editingDesc}
          editValue={descValue}
        />
      )}
      {view === "cv" && (
        <CVView
          baseCVEn={baseCVEn}
          baseCVPl={baseCVPl}
          cvs={cvs}
          selected={cvSelected}
          viewing={cvViewing}
          scroll={cvScroll}
        />
      )}
      {view === "help" && <HelpView scroll={helpScroll} />}

      <Text dimColor>{"─".repeat(72)}</Text>
      <Footer
        view={view}
        busy={busy}
        message={message}
        searching={searching}
        filter={filter}
        editingCandUrl={editingCandUrl}
        editCandUrlValue={editCandUrlValue}
        showRejected={showRejected}
        highOnly={highOnly}
        cvViewing={cvViewing != null}
        editingDesc={editingDesc}
        langPick={langPick}
        tailorConfirm={tailorConfirm}
        fitConfirm={fitConfirm}
        appDeleteConfirm={appDeleteConfirm}
        deleteConfirmMsg={deleteConfirmMsg}
      />
    </Box>
  );
}

function Footer({
  view,
  busy,
  message,
  searching,
  filter,
  editingCandUrl,
  editCandUrlValue,
  showRejected,
  highOnly,
  cvViewing,
  editingDesc,
  langPick,
  tailorConfirm,
  fitConfirm,
  appDeleteConfirm,
  deleteConfirmMsg,
}: {
  view: View;
  busy: string | null;
  message: string;
  searching: boolean;
  filter: string;
  editingCandUrl: boolean;
  editCandUrlValue: string;
  showRejected: boolean;
  highOnly: boolean;
  cvViewing: boolean;
  editingDesc: boolean;
  langPick: null | "fit" | "tailor";
  tailorConfirm: boolean;
  fitConfirm: boolean;
  appDeleteConfirm: boolean;
  deleteConfirmMsg: string | null;
}) {
  if (deleteConfirmMsg) {
    return <Text color="red">{deleteConfirmMsg}</Text>;
  }
  if (appDeleteConfirm) {
    return <Text color="red">Delete this application? [y] confirm  [Esc] cancel</Text>;
  }
  if (tailorConfirm) {
    return (
      <Text color="yellow">
        Already tailored — tailoring again spends API tokens. [y] continue  [Esc] cancel
      </Text>
    );
  }
  if (fitConfirm) {
    return (
      <Text color="yellow">
        Fit already analyzed — re-running spends API tokens. [y] continue  [Esc] cancel
      </Text>
    );
  }
  if (langPick) {
    return <Text color="cyan">Choose profile: [E]nglish  [P]olish  [Esc] cancel</Text>;
  }
  if (searching) {
    return <Text color="cyan">Search: {filter}▌ (Enter/Esc to apply)</Text>;
  }
  if (editingCandUrl) {
    return <Text color="cyan">Edit URL: {editCandUrlValue}▌  (Enter · save  Esc · cancel)</Text>;
  }
  if (editingDesc) {
    return <Text color="cyan">Editing job description — type / paste, Enter · save  Esc · cancel</Text>;
  }
  if (busy) {
    return (
      <Text color="yellow">
        <Spinner /> {busy}… {message}
      </Text>
    );
  }

  const candHelp = showRejected
    ? "↑↓ move · [o] open · [e] edit URL · [u] un-reject · [Tab] show pending only · [Esc] back"
    : "↑↓ move · [o] open · [e] edit URL · [a]pprove · [r]eject · [Tab] show rejected · [d]iscover · [Esc] back";

  const help =
    view === "list"
      ? `↑↓ move · ⏎ detail · [o] open · [i] interest · [f] ${highOnly ? "show all" : "high only"} · [n] add · [b]oard · [v] CV · [c]andidates · [g]ather · [d]iscover · [h]elp · [q]uit`
      : view === "detail"
        ? "↑↓ apps · ⏎ open · [a]dd app · [o] open URL · [i] interest · [d]elete company · [Esc] back"
        : view === "candidates"
          ? candHelp
          : view === "board"
            ? "↑↓ move · ⏎ open application · [Esc] back"
            : view === "application"
              ? "⏎ description · [f] AI fit · [c] tailor CV · [e] edit · [d] delete · [w] mode · [s] cycle status · [o] open URL · [Esc] back"
              : view === "jobdesc"
                ? "↑↓ / j/k scroll · [e] edit · [Esc] back"
                : view === "cv"
                  ? cvViewing
                    ? "↑↓ / j/k scroll · [Esc] back to list"
                    : "↑↓ move · ⏎ view · [r] reload profiles · [d] delete tailored · [Esc] back"
                  : view === "help"
                    ? "↑↓ / j/k scroll · [Esc] back"
                    : "";

  return (
    <Box flexDirection="column">
      <Text dimColor>{help}</Text>
      {message ? <Text color="green">{message}</Text> : null}
    </Box>
  );
}

function Spinner() {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), 80);
    return () => clearInterval(t);
  }, []);
  return <Text>{frames[i]}</Text>;
}
