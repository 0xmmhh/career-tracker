import React from "react";
import { Box, Text } from "ink";
import type { CV } from "../types.js";

const BASE_PREVIEW_LINES = 8;
export const CV_PAGE_SIZE = 20;

const PROFILES = [
  { lang: "en" as const, label: "English", path: "data/base-cv-en.txt" },
  { lang: "pl" as const, label: "Polish",  path: "data/base-cv-pl.txt" },
];

export function CVView({
  baseCVEn,
  baseCVPl,
  cvs,
  selected,
  viewing,
  scroll = 0,
}: {
  baseCVEn: string;
  baseCVPl: string;
  cvs: CV[];
  selected: number;
  viewing: CV | null;
  scroll?: number;
}) {
  if (viewing) {
    const lines = viewing.content.split("\n");
    const visibleLines = lines.slice(scroll, scroll + CV_PAGE_SIZE);
    const hasMore = scroll + CV_PAGE_SIZE < lines.length;
    return (
      <Box flexDirection="column">
        <Text bold color="green">{viewing.label || "CV"}</Text>
        <Text dimColor>
          {viewing.created_at}
          {lines.length > CV_PAGE_SIZE
            ? `  (lines ${scroll + 1}–${Math.min(scroll + CV_PAGE_SIZE, lines.length)} of ${lines.length})`
            : ""}
        </Text>
        <Box marginTop={1} flexDirection="column">
          {visibleLines.map((l, i) => (
            <Text key={scroll + i}>{l || " "}</Text>
          ))}
          {hasMore && <Text dimColor>↓ more</Text>}
        </Box>
      </Box>
    );
  }

  const profileContents = [baseCVEn, baseCVPl];

  return (
    <Box flexDirection="column">
      <Text bold>Base Profiles</Text>
      <Text dimColor>Edit files directly, then [r] to reload</Text>
      <Box marginTop={1} flexDirection="column">
        {PROFILES.map((p, i) => {
          const isSel = selected === i;
          const content = profileContents[i];
          const firstLine = content.split("\n").find((l) => l.trim()) ?? "";
          return (
            <Text key={p.lang} color={isSel ? "cyan" : undefined}>
              {isSel ? "▶ " : "  "}
              <Text bold>{p.label}</Text>
              {content.trim() ? (
                <Text dimColor> · {firstLine.slice(0, 60)}</Text>
              ) : (
                <Text dimColor> · empty — add to {p.path}</Text>
              )}
            </Text>
          );
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Tailored CVs ({cvs.length})</Text>
        {cvs.length === 0 ? (
          <Text dimColor>
            None yet. Open an application ([p]) and press [c] to tailor.
          </Text>
        ) : (
          cvs.map((c, i) => {
            const isSel = selected === i + 2;
            return (
              <Text key={c.id} color={isSel ? "cyan" : undefined}>
                {isSel ? "▶ " : "  "}
                {c.label || "(untitled)"} <Text dimColor>· {c.created_at}</Text>
              </Text>
            );
          })
        )}
      </Box>
    </Box>
  );
}
