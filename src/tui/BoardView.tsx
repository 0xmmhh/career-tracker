import React from "react";
import { Box, Text } from "ink";
import type { ApplicationRow } from "../db.js";
import type { ApplicationStatus } from "../types.js";

export const STATUS_ORDER: ApplicationStatus[] = [
  "bookmarked",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  bookmarked: "bookmarked",
  applied: "applied",
  phone_screen: "phone screen",
  interview: "interview",
  offer: "offer",
  rejected: "rejected",
};

export const STATUS_COLOR: Record<ApplicationStatus, string> = {
  bookmarked: "white",
  applied: "cyan",
  phone_screen: "yellow",
  interview: "magenta",
  offer: "green",
  rejected: "red",
};

function pad(s: string, width: number): string {
  const str = s ?? "";
  return str.length > width ? str.slice(0, width - 1) + "…" : str.padEnd(width);
}

/** Group applications by company name, preserving insertion order of first occurrence. */
function groupByCompany(
  apps: ApplicationRow[],
): { companyName: string | null; apps: ApplicationRow[] }[] {
  const map = new Map<string, ApplicationRow[]>();
  for (const a of apps) {
    const key = a.company_name ?? "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return [...map.entries()].map(([companyName, apps]) => ({ companyName, apps }));
}

export function BoardView({
  applications,
  selected,
}: {
  applications: ApplicationRow[];
  selected: number;
}) {
  if (applications.length === 0) {
    return (
      <Box paddingY={1}>
        <Text dimColor>
          No applications yet. Open a company and press [a] to add one.
        </Text>
      </Box>
    );
  }

  const indexMap = new Map(applications.map((a, i) => [a.id, i]));
  const groups = groupByCompany(applications);

  return (
    <Box flexDirection="column">
      {groups.map(({ companyName, apps }) => (
        <Box key={companyName ?? "_"} flexDirection="column" marginBottom={1}>
          <Text bold>{companyName ?? "—"}</Text>
          {apps.map((a) => {
            const isSel = indexMap.get(a.id) === selected;
            return (
              <Box key={a.id}>
                <Text color={isSel ? "cyan" : undefined}>
                  {isSel ? "▶  ↳ " : "    ↳ "}
                  {pad(a.position_name || "(no title)", 26)}
                  <Text color={STATUS_COLOR[a.status]}>{pad(STATUS_LABEL[a.status], 14)}</Text>
                  {a.applied_at ? (
                    <Text dimColor>{a.applied_at.slice(0, 10)}</Text>
                  ) : null}
                </Text>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
