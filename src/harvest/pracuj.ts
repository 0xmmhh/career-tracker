import { withPage } from "../scrape/browser.js";
import { matchesCriteria } from "./filter.js";
import type { FoundCompany, WorkMode } from "../types.js";

const LISTING = "https://www.pracuj.pl/praca/wroclaw;wp";

/**
 * pracuj.pl blocks plain fetches (403), so we render the Wrocław listing in a
 * browser and read offer cards from the DOM. Each `[data-test="default-offer"]`
 * card exposes the company name and offer link via stable data-test selectors.
 */
export async function harvestPracuj(): Promise<FoundCompany[]> {
  return withPage(async (page) => {
    await page.goto(LISTING, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2500);

    const cards = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll('[data-test="default-offer"]'),
      ).map((c) => {
        const name = (
          c.querySelector('[data-test="text-company-name"]') as HTMLElement
        )?.innerText;
        const href = (
          c.querySelector('a[data-test="link-offer"]') as HTMLAnchorElement
        )?.href;
        return { name, href, text: (c as HTMLElement).innerText };
      });
    });

    const seen = new Set<string>();
    const out: FoundCompany[] = [];
    for (const card of cards) {
      if (!card.name || !card.href || seen.has(card.name)) continue;
      const mode = readMode(card.text.toLowerCase());
      // Listing is already filtered to Wrocław; keep all (mode info is a bonus).
      if (!matchesCriteria("wroclaw", mode)) continue;
      seen.add(card.name);
      out.push({
        name: card.name,
        url: card.href,
        source: "pracuj",
        city: "Wrocław",
        work_mode: mode,
      });
    }
    return out;
  });
}

function readMode(blob: string): WorkMode {
  if (blob.includes("zdaln") || blob.includes("remote")) return "remote";
  if (blob.includes("hybr")) return "hybrid";
  if (blob.includes("stacjon")) return "office";
  return "unknown";
}
