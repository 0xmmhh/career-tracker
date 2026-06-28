import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");
export const DATA_DIR = join(ROOT, "data");
// CAREER_TRACKER_DB overrides the database path (used by tests for isolation).
export const DB_PATH = process.env.CAREER_TRACKER_DB ?? join(DATA_DIR, "tracker.db");
export const BASE_CV_EN_PATH = join(DATA_DIR, "base-cv-en.txt");
export const BASE_CV_PL_PATH = join(DATA_DIR, "base-cv-pl.txt");

/** Minimal .env loader — no dependency. Populates process.env if a .env file exists. */
function loadEnv(): void {
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    // no .env file — fine, discovery will warn if the key is missing
  }
}
loadEnv();

export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? "";
export const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID ?? "";

/** DeepSeek (OpenAI-compatible) — used for job-fit analysis and CV tailoring. */
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "";
export const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
export const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

/** Target city for harvesting. */
export const CITY = "Wrocław";

/** Concurrency for monitoring/probing. */
export const CONCURRENCY = 4;

/**
 * Career-page URL paths tried against a domain during discovery.
 * First one returning a real (non-homepage) 200 wins.
 */
export const CAREER_PATHS = [
  "/kariera",
  "/praca",
  "/careers",
  "/career",
  "/jobs",
  "/job",
  "/oferty-pracy",
  "/oferty",
  "/rekrutacja",
  "/zatrudnienie",
  "/dolacz-do-nas",
  "/praca-w-firmie",
  "/praca-u-nas",
  "/join",
  "/join-us",
  "/work-with-us",
  "/we-are-hiring",
  "/open-positions",
  "/openings",
  "/vacancies",
  "/hiring",
  "/team",
  "/about/careers",
  "/company/careers",
  "/en/careers",
  "/pl/kariera",
];
