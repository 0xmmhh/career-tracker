import React from "react";
import { Box, Text } from "ink";
import type { Candidate } from "../types.js";

const VISIBLE = 15;

function pad(s: string, width: number): string {
  return s.length > width ? s.slice(0, width - 1) + "…" : s.padEnd(width);
}

export function CandidatesView({
  candidates,
  selected,
  showRejected,
}: {
  candidates: Candidate[];
  selected: number;
  showRejected: boolean;
}) {
  if (candidates.length === 0) {
    return (
      <Box paddingY={1}>
        <Text dimColor>
          {showRejected
            ? "No candidates at all."
            : "No pending candidates. Press [d] to discover, or [Tab] to show rejected."}
        </Text>
      </Box>
    );
  }

  let start = Math.max(0, selected - Math.floor(VISIBLE / 2));
  start = Math.min(start, Math.max(0, candidates.length - VISIBLE));
  const rows = candidates.slice(start, start + VISIBLE);

  return (
    <Box flexDirection="column">
      {showRejected && (
        <Text dimColor>Showing all candidates including rejected</Text>
      )}
      {rows.map((c, i) => {
        const idx = start + i;
        const isSel = idx === selected;
        const isRejected = c.decision === "rejected";
        return (
          <Text
            key={c.id}
            color={isSel ? "cyan" : isRejected ? undefined : undefined}
            dimColor={isRejected && !isSel}
          >
            {isSel ? "▶ " : "  "}
            {isRejected ? <Text strikethrough>{pad(c.name, 20)}</Text> : pad(c.name, 20)}
            {" "}
            {pad(c.url.replace(/^https?:\/\//, ""), 46)}
            {isRejected ? <Text dimColor> [rejected]</Text> : null}
          </Text>
        );
      })}
      {candidates.length > VISIBLE && (
        <Text dimColor>
          {"  "}
          {selected + 1}/{candidates.length}
        </Text>
      )}
    </Box>
  );
}
