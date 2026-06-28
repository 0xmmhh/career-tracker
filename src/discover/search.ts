import { GOOGLE_API_KEY, GOOGLE_CSE_ID } from "../config.js";

const ENDPOINT = "https://www.googleapis.com/customsearch/v1";

/** Default queries aimed at Wrocław companies not on the big portals. */
const QUERIES = [
  '"wrocław" "oferty pracy" -site:pracuj.pl -site:nofluffjobs.com -site:justjoin.it',
  '"wrocław" kariera -site:pracuj.pl -site:nofluffjobs.com -site:justjoin.it',
  'wrocław firma kariera dołącz do nas',
];

export interface SearchConfigError {
  configured: false;
}

/** True if the Google Custom Search API is configured. */
export function searchConfigured(): boolean {
  return Boolean(GOOGLE_API_KEY && GOOGLE_CSE_ID);
}

/**
 * Run the default queries and return unique origin URLs (scheme + host) of the
 * results. Google CSE free tier returns up to 10 results per call.
 */
export async function searchDomains(): Promise<string[]> {
  const origins = new Set<string>();

  for (const q of QUERIES) {
    const url =
      `${ENDPOINT}?key=${encodeURIComponent(GOOGLE_API_KEY)}` +
      `&cx=${encodeURIComponent(GOOGLE_CSE_ID)}&num=10&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google CSE ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { items?: { link?: string }[] };
    for (const item of data.items ?? []) {
      if (!item.link) continue;
      try {
        const u = new URL(item.link);
        origins.add(`${u.protocol}//${u.host}`);
      } catch {
        // skip malformed
      }
    }
  }

  return [...origins];
}
