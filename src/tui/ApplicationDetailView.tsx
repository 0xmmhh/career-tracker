import React from "react";
import { Box, Text } from "ink";
import { STATUS_LABEL } from "./BoardView.js";
import { WORKMODE_COLOR } from "./ListView.js";
import type { ApplicationRow } from "../db.js";
import type { WorkMode } from "../types.js";

export function ApplicationDetailView({
  application,
  fitResult,
  tailorResult,
}: {
  application: ApplicationRow;
  fitResult: string | null;
  tailorResult: string | null;
}) {
  const a = application;
  const descLines = a.job_description ? a.job_description.split("\n").length : 0;

  return (
    <Box flexDirection="column">
      <Text bold>
        {a.position_name || "(no title)"}
        {a.company_name ? <Text> · {a.company_name}</Text> : null}
      </Text>
      <Text dimColor>{a.job_url || "(no URL)"}</Text>
      <Text>
        Status: <Text color="cyan">{STATUS_LABEL[a.status]}</Text>
        {"   "}Mode:{" "}
        <Text color={WORKMODE_COLOR[(a.work_mode ?? "unknown") as WorkMode]}>
          {a.work_mode ?? "unknown"}
        </Text>
      </Text>
      {(a.salary || a.deadline || a.contact) && (
        <Text>
          {a.salary ? <Text>Salary: <Text color="green">{a.salary}</Text>   </Text> : null}
          {a.deadline ? <Text>Deadline: <Text color="yellow">{a.deadline}</Text>   </Text> : null}
          {a.contact ? <Text>Contact: {a.contact}</Text> : null}
        </Text>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Notes:</Text>
        <Text>{a.notes || <Text dimColor>(none — press [e] to edit)</Text>}</Text>
      </Box>

      <Box marginTop={1}>
        <Text bold>Job description: </Text>
        {descLines > 0 ? (
          <Text dimColor>{descLines} line{descLines !== 1 ? "s" : ""} — press ⏎ to view/edit</Text>
        ) : (
          <Text dimColor>(empty — press ⏎ to add)</Text>
        )}
      </Box>

      {fitResult && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">AI fit analysis:</Text>
          {fitResult.split("\n").map((l, i) => (
            <Text key={i}>{l}</Text>
          ))}
        </Box>
      )}

      {tailorResult && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="green">Tailored CV (saved):</Text>
          {tailorResult
            .split("\n")
            .slice(0, 18)
            .map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          {tailorResult.split("\n").length > 18 && (
            <Text dimColor>… open the CV view ([v]) to read the full tailored CV</Text>
          )}
        </Box>
      )}
    </Box>
  );
}
