import React from "react";
import { Box, Text } from "ink";

type Line =
  | { kind: "heading"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "blank" }
  | { kind: "body"; text: string }
  | { kind: "key"; key: string; desc: string }
  | { kind: "note"; text: string };

const CONTENT: Line[] = [
  { kind: "heading", text: "Career Tracker — Personal Job Search Organizer" },
  { kind: "blank" },

  { kind: "subheading", text: "INTENDED WORKFLOW" },
  { kind: "body", text: "1. Populate companies: [g]ather from portals, or [n] add manually." },
  { kind: "body", text: "2. Mark interest with [i] (high → medium → low → none)." },
  { kind: "body", text: "3. Open a company (Enter) → [a] to add a job posting you found." },
  { kind: "body", text: "4. In the application: [f] AI fit analysis, [c] tailored CV." },
  { kind: "body", text: "5. Apply externally, then [s] to advance: bookmarked → applied → …" },
  { kind: "body", text: "6. Keep pressing [s]: phone screen → interview → offer." },
  { kind: "blank" },

  { kind: "subheading", text: "COMPANY LIST  (default view)" },
  { kind: "key", key: "↑↓ / j/k", desc: "Navigate companies" },
  { kind: "key", key: "Enter", desc: "Open company detail" },
  { kind: "key", key: "[o]", desc: "Open career page in browser" },
  { kind: "key", key: "[i]", desc: "Cycle interest level: ★ high  •  medium  · low  none" },
  { kind: "key", key: "[f]", desc: "Toggle high-interest filter" },
  { kind: "key", key: "[n]", desc: "Add a company manually" },
  { kind: "key", key: "[g]", desc: "Gather companies from job portals (nofluffjobs, pracuj, justjoin.it)" },
  { kind: "key", key: "[d]", desc: "Discover companies via Google Search (needs GOOGLE_API_KEY)" },
  { kind: "key", key: "[/]", desc: "Search by name / URL" },
  { kind: "key", key: "[b]", desc: "Board — all your applications grouped by company" },
  { kind: "key", key: "[v]", desc: "CV manager" },
  { kind: "key", key: "[c]", desc: "Candidates (companies found by harvest/discover, awaiting approval)" },
  { kind: "key", key: "[h]", desc: "This help screen" },
  { kind: "key", key: "[q]", desc: "Quit" },
  { kind: "blank" },

  { kind: "subheading", text: "COMPANY DETAIL" },
  { kind: "key", key: "↑↓ / j/k", desc: "Navigate applications" },
  { kind: "key", key: "Enter", desc: "Open selected application" },
  { kind: "key", key: "[a]", desc: "Add a new application for this company" },
  { kind: "key", key: "[o]", desc: "Open career page in browser" },
  { kind: "key", key: "[i]", desc: "Cycle interest level" },
  { kind: "key", key: "[d]", desc: "Delete company (with confirmation)" },
  { kind: "key", key: "Esc / [b]", desc: "Back to company list" },
  { kind: "blank" },

  { kind: "subheading", text: "BOARD  [b] — all applications grouped by company" },
  { kind: "key", key: "↑↓ / j/k", desc: "Navigate applications" },
  { kind: "key", key: "Enter", desc: "Open application detail" },
  { kind: "key", key: "Esc", desc: "Back" },
  { kind: "blank" },

  { kind: "subheading", text: "APPLICATION DETAIL" },
  { kind: "key", key: "Enter", desc: "Open the job description (view & edit)" },
  { kind: "key", key: "[f]", desc: "AI fit analysis — scores your CV vs the job, saved & reused (asks before re-running)" },
  { kind: "key", key: "[c]", desc: "AI tailor CV — rewrites your base CV for this role (asks before re-running)" },
  { kind: "key", key: "[e]", desc: "Edit application — position, company, URL, salary, deadline, contact, notes" },
  { kind: "key", key: "[d]", desc: "Delete this application (with confirmation)" },
  { kind: "key", key: "[w]", desc: "Cycle work mode: office → remote → hybrid → unknown" },
  { kind: "key", key: "[s]", desc: "Cycle status: bookmarked → applied → phone screen → interview → offer → rejected" },
  { kind: "key", key: "[o]", desc: "Open job URL in browser" },
  { kind: "key", key: "Esc", desc: "Back" },
  { kind: "blank" },

  { kind: "subheading", text: "JOB DESCRIPTION  (Enter from an application)" },
  { kind: "key", key: "↑↓ / j/k", desc: "Scroll the job description" },
  { kind: "key", key: "[e]", desc: "Edit — type or paste, Enter saves, Esc cancels" },
  { kind: "key", key: "Esc", desc: "Back to the application" },
  { kind: "blank" },

  { kind: "subheading", text: "CV MANAGER  [v]" },
  { kind: "key", key: "↑↓ / j/k", desc: "Navigate" },
  { kind: "key", key: "Enter", desc: "View full CV text (scrollable)" },
  { kind: "key", key: "[r]", desc: "Reload base profiles from files" },
  { kind: "key", key: "[d]", desc: "Delete selected tailored CV" },
  { kind: "key", key: "Esc", desc: "Back" },
  { kind: "note", text: "English profile: data/base-cv-en.txt   Polish profile: data/base-cv-pl.txt" },
  { kind: "blank" },

  { kind: "subheading", text: "CANDIDATES  [c] — found by harvest/discover, pending review" },
  { kind: "key", key: "↑↓ / j/k", desc: "Navigate" },
  { kind: "key", key: "[a]", desc: "Approve → move to tracked company list" },
  { kind: "key", key: "[r]", desc: "Reject" },
  { kind: "key", key: "[u]", desc: "Un-reject (restore to pending)" },
  { kind: "key", key: "[e]", desc: "Edit career page URL" },
  { kind: "key", key: "[o]", desc: "Open URL in browser" },
  { kind: "key", key: "Tab", desc: "Toggle showing rejected candidates" },
  { kind: "key", key: "Esc", desc: "Back" },
  { kind: "blank" },

  { kind: "subheading", text: "AI FEATURES  (requires DEEPSEEK_API_KEY in .env)" },
  { kind: "body", text: "Fit analysis [f]:  Rates CV vs job 1–10, lists matching skills, gaps, 3 tips." },
  { kind: "body", text: "Tailor CV [c]:     Rewrites your base CV for the role. Saved in CV manager." },
  { kind: "note", text: "Setup: copy .env.example to .env and fill in DEEPSEEK_API_KEY." },
  { kind: "blank" },
];

export const HELP_TOTAL_LINES = CONTENT.length;
const VISIBLE = 22;

function HelpLine({ line }: { line: Line }) {
  switch (line.kind) {
    case "heading":
      return <Text bold color="cyan">{line.text}</Text>;
    case "subheading":
      return <Text bold color="yellow">{line.text}</Text>;
    case "blank":
      return <Text> </Text>;
    case "body":
      return <Text>  {line.text}</Text>;
    case "key":
      return (
        <Box>
          <Text color="cyan">  {line.key.padEnd(18)}</Text>
          <Text dimColor>{line.desc}</Text>
        </Box>
      );
    case "note":
      return <Text dimColor>  ↳ {line.text}</Text>;
  }
}

export function HelpView({ scroll }: { scroll: number }) {
  const visible = CONTENT.slice(scroll, scroll + VISIBLE);
  const canScrollUp = scroll > 0;
  const canScrollDown = scroll + VISIBLE < CONTENT.length;

  return (
    <Box flexDirection="column">
      {visible.map((line, i) => (
        <HelpLine key={scroll + i} line={line} />
      ))}
      <Box marginTop={1}>
        {canScrollUp && <Text dimColor>↑ more above  </Text>}
        {canScrollDown && <Text dimColor>↓ more below</Text>}
      </Box>
    </Box>
  );
}
