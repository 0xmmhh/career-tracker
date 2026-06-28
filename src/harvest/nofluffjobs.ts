import { matchesCriteria } from "./filter.js";
import type { FoundCompany, WorkMode } from "../types.js";

const API =
  "https://nofluffjobs.com/api/search/posting?pageTo=10&pageSize=100" +
  "&salaryCurrency=PLN&salaryPeriod=month&region=pl";

interface NfjPosting {
  name?: string; // company name
  url?: string; // offer slug
  fullyRemote?: boolean;
  location?: { places?: { city?: string }[] };
}

/**
 * nofluffjobs exposes a JSON search API that accepts a `rawSearch` filter
 * string. We query Wrocław postings and read company name + offer URL.
 */
export async function harvestNoFluffJobs(): Promise<FoundCompany[]> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    body: JSON.stringify({ rawSearch: "city=wroclaw" }),
  });
  if (!res.ok) throw new Error(`nofluffjobs API ${res.status}`);

  const data = (await res.json()) as { postings?: NfjPosting[] };
  const postings = data.postings ?? [];
  const seen = new Set<string>();
  const out: FoundCompany[] = [];

  for (const p of postings) {
    if (!p.name || !p.url || seen.has(p.name)) continue;
    const mode: WorkMode = p.fullyRemote ? "remote" : "unknown";
    const cities = (p.location?.places ?? [])
      .map((pl) => pl.city ?? "")
      .join(" ");
    if (!matchesCriteria(cities, mode)) continue;
    seen.add(p.name);
    out.push({
      name: p.name,
      url: `https://nofluffjobs.com/pl/job/${p.url}`,
      source: "nofluffjobs",
      city: cities.includes("Wroc") ? "Wrocław" : cities.split(" ")[0] ?? "",
      work_mode: mode,
    });
  }
  return out;
}
