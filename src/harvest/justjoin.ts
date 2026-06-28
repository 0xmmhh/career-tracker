import { withPage } from "../scrape/browser.js";
import { matchesCriteria } from "./filter.js";
import type { FoundCompany, WorkMode } from "../types.js";

const LISTING = "https://justjoin.it/job-offers/wroclaw";
const SCROLL_STEPS = 6;

/**
 * justjoin.it is a React SPA with a virtualized list, so only a handful of
 * offer cards exist in the DOM at once. We scroll repeatedly, reading each
 * `[data-index]` card's company name (first text line) and offer link.
 */
export async function harvestJustJoin(): Promise<FoundCompany[]> {
  return withPage(async (page) => {
    await page.goto(LISTING, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(3000);

    const seen = new Set<string>();
    const out: FoundCompany[] = [];

    for (let step = 0; step <= SCROLL_STEPS; step++) {
      const cards = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("[data-index]")).map((c) => {
          const a = c.querySelector(
            'a[href*="/job-offer/"]',
          ) as HTMLAnchorElement | null;
          return {
            href: a?.href ?? "",
            text: (c as HTMLElement).innerText,
          };
        });
      });

      for (const card of cards) {
        const lines = card.text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const name = lines[0];
        if (!name || !card.href || seen.has(name)) continue;
        const blob = card.text.toLowerCase();
        const mode = readMode(blob);
        const city = blob.includes("wroc") ? "Wrocław" : "";
        if (!matchesCriteria(city || "wroc", mode)) continue;
        seen.add(name);
        out.push({
          name,
          url: card.href,
          source: "justjoin",
          city: city || "Wrocław",
          work_mode: mode,
        });
      }

      await page.mouse.wheel(0, 2500);
      await page.waitForTimeout(800);
    }

    return out;
  });
}

function readMode(blob: string): WorkMode {
  if (blob.includes("remote") || blob.includes("zdaln")) return "remote";
  if (blob.includes("hybrid") || blob.includes("hybr")) return "hybrid";
  return "unknown";
}
