import React from "react";
import { Box, Text } from "ink";
import { STATUS_COLOR, STATUS_LABEL } from "./BoardView.js";
import type { ApplicationRow } from "../db.js";
import type { Company } from "../types.js";

function pad(s: string, width: number): string {
  const str = s ?? "";
  return str.length > width ? str.slice(0, width - 1) + "…" : str.padEnd(width);
}

export function DetailView({
  company,
  applications,
  selected,
}: {
  company: Company;
  applications: ApplicationRow[];
  selected: number;
}) {
  return (
    <Box flexDirection="column">
      <Text bold color="cyan">{company.name}</Text>
      <Text dimColor>{company.url}</Text>
      {company.notes ? <Text>Notes: {company.notes}</Text> : null}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Applications ({applications.length})</Text>
        {applications.length === 0 ? (
          <Text dimColor>(none yet — press [a] to add one)</Text>
        ) : (
          applications.map((a, i) => {
            const isSel = i === selected;
            return (
              <Box key={a.id}>
                <Text color={isSel ? "cyan" : undefined}>
                  {isSel ? "▶ " : "  "}
                  {pad(a.position_name || "(no title)", 28)}
                  <Text color={STATUS_COLOR[a.status]}>{pad(STATUS_LABEL[a.status], 14)}</Text>
                  {a.applied_at ? (
                    <Text dimColor>{a.applied_at.slice(0, 10)}</Text>
                  ) : null}
                </Text>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
