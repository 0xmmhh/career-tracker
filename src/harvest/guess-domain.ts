/** Polish characters to ASCII equivalents. */
const PL_MAP: Record<string, string> = {
  ą: "a", ć: "c", ę: "e", ł: "l", ń: "n",
  ó: "o", ś: "s", ź: "z", ż: "z",
};

function depolish(s: string): string {
  return s.replace(/[ąćęłńóśźż]/gi, (c) => PL_MAP[c.toLowerCase()] ?? c);
}

/** Strip common Polish and international legal entity suffixes from a company name. */
function stripLegal(name: string): string {
  return name
    .replace(/\bsp(ółka)?\.?\s*(z\s*o\.?\s*o\.?|k\.?|j\.?|c\.?)\b/gi, "")
    .replace(/\bs\.?\s*a\.?\b/gi, "")
    .replace(/\bspółka\s*akcyjna\b/gi, "")
    .replace(/\b(llc|ltd\.?|inc\.?|gmbh|b\.?v\.?|a\.?s\.?|oy)\b/gi, "")
    .replace(/\(.*?\)/g, "") // remove anything in parentheses
    .replace(/[-–—]+$/, "") // trailing dashes
    .trim();
}

/**
 * Generate candidate domain origins to probe for a company.
 * Returns `https://` origins (with and without www) across common TLDs.
 * The list is ordered: .pl first (most Polish companies), then .com, .io, .eu.
 */
export function guessOrigins(rawName: string): string[] {
  const clean = depolish(stripLegal(rawName)).toLowerCase();

  // Build slug variants: with hyphens (angry-nerds) and solid (angrynerds)
  const hyphen = clean.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const solid = clean.replace(/[^a-z0-9]+/g, "");
  if (!hyphen || hyphen.length < 2) return [];

  const tlds = [".pl", ".com", ".io", ".eu", ".co"];
  const bases = [...new Set([hyphen, solid])];

  const origins: string[] = [];
  for (const base of bases) {
    for (const tld of tlds) {
      origins.push(`https://www.${base}${tld}`);
      origins.push(`https://${base}${tld}`);
    }
  }
  return origins;
}
