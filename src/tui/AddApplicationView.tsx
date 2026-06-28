import React from "react";
import { Box, Text } from "ink";

export type AppField =
  | "position"
  | "company"
  | "url"
  | "salary"
  | "deadline"
  | "contact"
  | "notes";

export interface AppForm {
  position: string;
  company: string;
  url: string;
  salary: string;
  deadline: string;
  contact: string;
  notes: string;
}

const FIELDS: { key: AppField; label: string; hint: string }[] = [
  { key: "position",    label: "Position",        hint: "e.g. QA Engineer" },
  { key: "company",     label: "Company",          hint: "matches a tracked company if the name is the same" },
  { key: "url",         label: "Job URL",          hint: "e.g. https://…/jobs/1234" },
  { key: "salary",      label: "Salary",           hint: "e.g. 15 000–20 000 PLN / month" },
  { key: "deadline",    label: "Deadline",         hint: "e.g. 2026-07-15" },
  { key: "contact",     label: "Contact",          hint: "e.g. recruiter name / email" },
  { key: "notes",       label: "Notes",            hint: "private notes for yourself" },
];

export const APP_FIELD_ORDER: AppField[] = [
  "position",
  "company",
  "url",
  "salary",
  "deadline",
  "contact",
  "notes",
];

export function nextAppField(current: AppField): AppField {
  const i = APP_FIELD_ORDER.indexOf(current);
  return APP_FIELD_ORDER[(i + 1) % APP_FIELD_ORDER.length];
}

export const EMPTY_APP_FORM: AppForm = {
  position: "",
  company: "",
  url: "",
  salary: "",
  deadline: "",
  contact: "",
  notes: "",
};

export function AddApplicationView({
  form,
  activeField,
  suggestions = [],
  lockedCompany,
  title = "Save a job posting",
}: {
  form: AppForm;
  activeField: AppField;
  suggestions?: string[];
  lockedCompany?: string;
  title?: string;
}) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text bold>{title}</Text>
      <Text dimColor>Tab · next field / autocomplete    Enter · submit    Esc · cancel</Text>
      <Box marginTop={1} flexDirection="column">
        {FIELDS.map((f) => {
          if (f.key === "company" && lockedCompany) {
            return (
              <Box key={f.key}>
                <Text dimColor>    Company: {lockedCompany}</Text>
              </Box>
            );
          }

          const isActive = f.key === activeField;
          const value = form[f.key];
          const shown =
            f.key === "notes" && value.length > 60
              ? "…" + value.slice(-60)
              : value;

          return (
            <React.Fragment key={f.key}>
              <Box>
                <Text color={isActive ? "cyan" : "white"}>
                  {isActive ? "▶ " : "  "}
                  <Text bold={isActive}>{f.label}: </Text>
                  {shown}
                  {isActive ? <Text color="cyan">▌</Text> : null}
                  {!value && !isActive ? <Text dimColor>{f.hint}</Text> : null}
                </Text>
              </Box>
              {f.key === "company" && isActive && suggestions.length > 0 && (
                <Box marginLeft={4} flexDirection="column">
                  {suggestions.map((s, i) => (
                    <Text key={s} color={i === 0 ? "cyan" : undefined} dimColor={i > 0}>
                      {i === 0 ? "↹  " : "   "}{s}
                    </Text>
                  ))}
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
}
