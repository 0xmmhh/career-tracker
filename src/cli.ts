import { harvestAll } from "./harvest/index.js";
import { discoverAll } from "./discover/index.js";

const cmd = process.argv[2] ?? "tui";

async function main() {
  switch (cmd) {
    case "tui": {
      const { startTui } = await import("./tui/index.js");
      startTui();
      break;
    }

    case "harvest": {
      console.log("Harvesting job portals and probing for career pages…");
      const results = await harvestAll((p) =>
        console.log(
          `  [${p.source}] ${p.name} → ${p.careerUrl ?? "no career page found"}`,
        ),
      );
      for (const r of results) {
        if (r.error) {
          console.log(`  ${r.source}: ERROR ${r.error}`);
        } else {
          console.log(`  ${r.source}: ${r.found} companies, ${r.withCareerPage} career pages found, ${r.added} new candidates`);
        }
      }
      const added = results.reduce((a, r) => a + r.added, 0);
      console.log(`Done. ${added} new candidates. Review them with: npm start`);
      process.exit(0);
    }

    case "discover": {
      console.log("Discovering unknown companies…");
      const r = await discoverAll((p) =>
        console.log(`  ${p.done}/${p.total} ${p.current} (+${p.added})`),
      );
      if (!r.configured) {
        console.log(
          "Discovery needs Google API keys (optional) — see .env.example",
        );
        process.exit(1);
      }
      console.log(
        `Done. ${r.added} candidates from ${r.domains} domains. Review them in the TUI.`,
      );
      process.exit(0);
    }

    default:
      console.log(
        "Usage: tsx src/cli.ts [tui|harvest|discover]\n" +
          "  tui       launch the terminal UI (default)\n" +
          "  harvest   scrape job portals into tracked companies\n" +
          "  discover  find unknown companies via web search → candidates",
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
