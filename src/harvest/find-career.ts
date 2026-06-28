import { guessOrigins } from "./guess-domain.js";
import { probeCareerPage } from "../discover/probe.js";
import { ddgFindDomain } from "./ddg-search.js";

/**
 * Try to find a company's own career page.
 * Step 1: Guess common domain variants from the name (fast, no network search).
 * Step 2: If guessing fails, ask DuckDuckGo (free, no API key) for the company's
 *         website and probe that domain for career paths.
 */
export async function findCareerPage(companyName: string): Promise<string | null> {
  // ── Step 1: domain guessing ──────────────────────────────────────────────
  const origins = guessOrigins(companyName);
  for (const origin of origins) {
    try {
      const res = await fetch(origin, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok && res.status !== 405) continue;
    } catch {
      continue;
    }
    const careerUrl = await probeCareerPage(origin);
    if (careerUrl) return careerUrl;
  }

  // ── Step 2: DuckDuckGo search fallback ──────────────────────────────────
  const ddgOrigin = await ddgFindDomain(companyName);
  if (!ddgOrigin) return null;

  // Skip if we already tried this origin via guessing.
  if (origins.some((o) => o === ddgOrigin || o === ddgOrigin + "/")) return null;

  return probeCareerPage(ddgOrigin);
}
