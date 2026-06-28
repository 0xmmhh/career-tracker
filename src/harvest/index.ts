import { addCandidate } from "../db.js";
import { closeBrowser } from "../scrape/browser.js";
import { mapLimit } from "../scrape/browser.js";
import { harvestNoFluffJobs } from "./nofluffjobs.js";
import { harvestPracuj } from "./pracuj.js";
import { harvestJustJoin } from "./justjoin.js";
import { findCareerPage } from "./find-career.js";
import { CONCURRENCY } from "../config.js";
import type { FoundCompany } from "../types.js";

export interface HarvestProgress {
  source: string;
  name: string;
  careerUrl: string | null;
}

export interface HarvestSummary {
  source: string;
  found: number;
  withCareerPage: number;
  added: number;
  error?: string;
}

const SOURCES: { name: string; run: () => Promise<FoundCompany[]> }[] = [
  { name: "nofluffjobs", run: harvestNoFluffJobs },
  { name: "pracuj", run: harvestPracuj },
  { name: "justjoin", run: harvestJustJoin },
];

/**
 * Run all portal harvesters. For each found company, guess their domain and
 * probe for a career page. Companies with a found career page are added to
 * the candidates table for review — not directly to tracked.
 */
export async function harvestAll(
  onProgress?: (p: HarvestProgress) => void,
): Promise<HarvestSummary[]> {
  const summaries: HarvestSummary[] = [];

  for (const source of SOURCES) {
    let companies: FoundCompany[] = [];
    try {
      companies = await source.run();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summaries.push({ source: source.name, found: 0, withCareerPage: 0, added: 0, error: message });
      continue;
    }

    // Deduplicate by company name within this source batch.
    const unique = [...new Map(companies.map((c) => [c.name, c])).values()];

    let withCareerPage = 0;
    let added = 0;

    await mapLimit(unique, CONCURRENCY, async (company) => {
      const careerUrl = await findCareerPage(company.name);
      onProgress?.({ source: source.name, name: company.name, careerUrl });
      if (!careerUrl) return;
      withCareerPage++;
      const ok = addCandidate({ name: company.name, url: careerUrl, source: source.name });
      if (ok) added++;
    });

    summaries.push({ source: source.name, found: unique.length, withCareerPage, added });
  }

  await closeBrowser();
  return summaries;
}
