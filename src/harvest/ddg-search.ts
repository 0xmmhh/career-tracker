import { withPage } from "../scrape/browser.js";

const PORTAL_DOMAINS =
  /pracuj\.pl|nofluffjobs|justjoin|linkedin|glassdoor|indeed|facebook|twitter|wikipedia|olx\.pl|praca\.pl|monster\.com|goldenline|careers24|trojmiasto|gratka|gumtree/i;

/**
 * Use a Playwright browser to search DuckDuckGo for a company name and
 * return the origin of the first result that looks like the company's own site.
 */
export async function ddgFindDomain(companyName: string): Promise<string | null> {
  const q = encodeURIComponent(`${companyName} kariera OR careers`);
  try {
    return await withPage(async (page) => {
      await page.goto(`https://duckduckgo.com/?q=${q}&kl=pl-pl`, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });
      await page.waitForTimeout(2000);

      const origin = await page.evaluate((ignore: string) => {
        const ignoreRe = new RegExp(ignore, "i");
        const links = Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            '[data-result] h2 a, .result__a, article a[href^="http"]',
          ),
        );
        for (const a of links) {
          try {
            const u = new URL(a.href);
            if (u.protocol !== "https:") continue;
            if (ignoreRe.test(u.hostname)) continue;
            return `${u.protocol}//${u.host}`;
          } catch {
            continue;
          }
        }
        return null;
      }, PORTAL_DOMAINS.source);

      return origin;
    });
  } catch {
    return null;
  }
}
