import React from "react";
import { Box, Text } from "ink";
import { STATUS_COLOR, STATUS_LABEL } from "./BoardView.js";
import type { ApplicationRow } from "../db.js";
import type { Company, InterestLevel, WorkMode } from "../types.js";

const VISIBLE = 12;

const NAME_W = 26;
const MODE_W = 10;
const POS_W = 34;

const INTEREST: Record<InterestLevel, { symbol: string; color: string }> = {
  high:   { symbol: "★", color: "green" },
  medium: { symbol: "•", color: "yellow" },
  low:    { symbol: "·", color: "gray" },
  none:   { symbol: " ", color: "gray" },
};

export const WORKMODE_COLOR: Record<WorkMode, string> = {
  remote:  "green",
  hybrid:  "cyan",
  office:  "yellow",
  unknown: "gray",
};

function InterestDot({ level }: { level: InterestLevel }) {
  const s = INTEREST[level ?? "medium"];
  return <Text color={s.color}>{s.symbol}</Text>;
}

function pad(s: string, width: number): string {
  const str = s ?? "";
  return str.length > width ? str.slice(0, width - 1) + "…" : str.padEnd(width);
}

export function ListView({
  companies,
  selected,
  appsByCompany,
}: {
  companies: Company[];
  selected: number;
  appsByCompany: Map<number, ApplicationRow[]>;
}) {
  if (companies.length === 0) {
    return (
      <Box paddingY={1}>
        <Text dimColor>
          No companies yet. Press [n] to add one or [g] to harvest from job portals.
        </Text>
      </Box>
    );
  }

  let start = Math.max(0, selected - Math.floor(VISIBLE / 2));
  start = Math.min(start, Math.max(0, companies.length - VISIBLE));
  const rows = companies.slice(start, start + VISIBLE);

  return (
    <Box flexDirection="column">
      <Box>
        <Text dimColor bold>
          {"      "}{pad("Position", POS_W)}{pad("Mode", MODE_W)}Status
        </Text>
      </Box>

      {rows.map((c, i) => {
        const idx = start + i;
        const isSel = idx === selected;
        const apps = appsByCompany.get(c.id) ?? [];
        return (
          <Box key={c.id} flexDirection="column">
            <Box>
              <Text color={isSel ? "cyan" : undefined}>{isSel ? "▶ " : "  "}</Text>
              <InterestDot level={c.interest_level} />
              <Text color={isSel ? "cyan" : undefined}>{" "}{pad(c.name, NAME_W)}</Text>
            </Box>
            {apps.map((a) => {
              const mode = (a.work_mode ?? "unknown") as WorkMode;
              return (
                <Box key={a.id}>
                  <Text dimColor>{"    ↳ "}{pad(a.position_name || "(no title)", POS_W)}</Text>
                  <Text color={WORKMODE_COLOR[mode]}>{pad(mode, MODE_W)}</Text>
                  <Text color={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Text>
                </Box>
              );
            })}
          </Box>
        );
      })}
      {companies.length > VISIBLE && (
        <Text dimColor>
          {"  "}
          {selected + 1}/{companies.length}
        </Text>
      )}
    </Box>
  );
}
