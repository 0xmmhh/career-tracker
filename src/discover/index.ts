import { addCandidate } from "../db.js";
import { CONCURRENCY } from "../config.js";
import { mapLimit } from "../scrape/browser.js";
import { searchConfigured, searchDomains } from "./search.js";
import { nameFromOrigin, probeCareerPage } from "./probe.js";

export interface DiscoverProgress {
  done: number;
  total: number;
  current: string;
  added: number;
}

export interface DiscoverResult {
  configured: boolean;
  domains: number;
  added: number;
}

/**
 * Discover unknown companies: Google-search for Wrocław employers, probe each
 * domain for a career page, and store hits as candidates for review.
 */
export async function discoverAll(
  onProgress?: (p: DiscoverProgress) => void,
): Promise<DiscoverResult> {
  if (!searchConfigured()) {
    return { configured: false, domains: 0, added: 0 };
  }

  const origins = await searchDomains();
  let done = 0;
  let added = 0;

  await mapLimit(origins, CONCURRENCY, async (origin) => {
    const careerUrl = await probeCareerPage(origin);
    if (careerUrl) {
      const ok = addCandidate({
        name: nameFromOrigin(origin),
        url: careerUrl,
        source: "discover",
      });
      if (ok) added++;
    }
    done++;
    onProgress?.({ done, total: origins.length, current: origin, added });
  });

  return { configured: true, domains: origins.length, added };
}
