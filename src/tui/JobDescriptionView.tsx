import React from "react";
import { Box, Text } from "ink";
import type { ApplicationRow } from "../db.js";

export const JOBDESC_PAGE_SIZE = 20;

export function JobDescriptionView({
  application,
  scroll,
  editing,
  editValue,
}: {
  application: ApplicationRow;
  scroll: number;
  editing: boolean;
  editValue: string;
}) {
  const a = application;
  const heading = `${a.position_name || "(no title)"}${
    a.company_name ? ` · ${a.company_name}` : ""
  } — job description`;

  if (editing) {
    const lines = editValue.split("\n");
    const tail = lines.slice(Math.max(0, lines.length - JOBDESC_PAGE_SIZE));
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">{heading}</Text>
        <Text dimColor>editing — type or paste, Enter · save  Esc · cancel</Text>
        <Box marginTop={1} flexDirection="column">
          {tail.map((l, i) => (
            <Text key={i}>
              {l || " "}
              {i === tail.length - 1 ? <Text color="cyan">▌</Text> : null}
            </Text>
          ))}
        </Box>
      </Box>
    );
  }

  if (!a.job_description) {
    return (
      <Box flexDirection="column">
        <Text bold>{heading}</Text>
        <Box marginTop={1}>
          <Text dimColor>(no job description — press [e] to add)</Text>
        </Box>
      </Box>
    );
  }

  const lines = a.job_description.split("\n");
  const visible = lines.slice(scroll, scroll + JOBDESC_PAGE_SIZE);
  const hasMore = scroll + JOBDESC_PAGE_SIZE < lines.length;

  return (
    <Box flexDirection="column">
      <Text bold>{heading}</Text>
      <Text dimColor>
        {lines.length > JOBDESC_PAGE_SIZE
          ? `lines ${scroll + 1}–${Math.min(scroll + JOBDESC_PAGE_SIZE, lines.length)} of ${lines.length}`
          : `${lines.length} line${lines.length !== 1 ? "s" : ""}`}
      </Text>
      <Box marginTop={1} flexDirection="column">
        {visible.map((l, i) => (
          <Text key={scroll + i}>{l || " "}</Text>
        ))}
        {hasMore && <Text dimColor>↓ more</Text>}
      </Box>
    </Box>
  );
}
