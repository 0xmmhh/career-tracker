import { CAREER_PATHS } from "../config.js";

/**
 * Try known career-page paths against an origin. Returns the first URL that
 * looks like a real career page (HTTP 200 and not redirected back to the
 * homepage), or null.
 */
export async function probeCareerPage(origin: string): Promise<string | null> {
  for (const path of CAREER_PATHS) {
    const target = origin + path;
    try {
      const res = await fetch(target, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      });
      if (!res.ok) continue;

      // A real career page keeps its path; a 200 that redirected to "/" is the
      // homepage and doesn't count.
      const finalUrl = new URL(res.url);
      if (finalUrl.pathname === "/" || finalUrl.pathname === "") continue;

      return target;
    } catch {
      // timeout / DNS / TLS error — try next path
    }
  }
  return null;
}

/** Derive a readable company name from an origin host. */
export function nameFromOrigin(origin: string): string {
  try {
    const host = new URL(origin).host.replace(/^www\./, "");
    const base = host.split(".")[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return origin;
  }
}
