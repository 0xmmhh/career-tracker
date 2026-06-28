import React from "react";
import { Box, Text } from "ink";

export type AddField = "name" | "url" | "notes";

export interface AddForm {
  name: string;
  url: string;
  notes: string;
}

const FIELDS: { key: AddField; label: string; hint: string }[] = [
  { key: "name", label: "Company name", hint: "e.g. SEOhost" },
  { key: "url",  label: "Career page URL", hint: "e.g. https://seohost.pl/praca" },
  { key: "notes", label: "Notes (optional)", hint: "e.g. hosting company, Wrocław" },
];

export function AddView({
  form,
  activeField,
}: {
  form: AddForm;
  activeField: AddField;
}) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text bold>Add company</Text>
      <Text dimColor>Tab · next field    Enter · submit    Esc · cancel</Text>
      <Box marginTop={1} flexDirection="column">
        {FIELDS.map((f) => {
          const isActive = f.key === activeField;
          const value = form[f.key];
          return (
            <Box key={f.key} marginBottom={0}>
              <Text color={isActive ? "cyan" : "white"}>
                {isActive ? "▶ " : "  "}
                <Text bold={isActive}>{f.label}: </Text>
                {value}
                {isActive ? <Text color="cyan">▌</Text> : null}
                {!value && !isActive ? (
                  <Text dimColor>{f.hint}</Text>
                ) : null}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export const FIELD_ORDER: AddField[] = ["name", "url", "notes"];

export function nextField(current: AddField): AddField {
  const i = FIELD_ORDER.indexOf(current);
  return FIELD_ORDER[(i + 1) % FIELD_ORDER.length];
}
