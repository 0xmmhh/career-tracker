import type { WorkMode } from "../types.js";

/**
 * Decide whether a listing matches the user's criteria:
 *   - based in Wrocław, OR
 *   - remote, OR
 *   - hybrid (office-day frequency can't be read from portals, so hybrid is
 *     kept for manual vetting rather than dropped).
 *
 * `cityText` is whatever location string the portal provides.
 */
export function matchesCriteria(cityText: string, mode: WorkMode): boolean {
  const city = cityText.toLowerCase();
  const inWroclaw = city.includes("wroc");
  return inWroclaw || mode === "remote" || mode === "hybrid";
}
