import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { BASE_CV_EN_PATH, BASE_CV_PL_PATH, DATA_DIR } from "./config.js";

export function readBaseCV(lang: "en" | "pl"): string {
  try {
    return readFileSync(lang === "en" ? BASE_CV_EN_PATH : BASE_CV_PL_PATH, "utf8");
  } catch {
    return "";
  }
}

export function ensureBaseCVFiles(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  for (const path of [BASE_CV_EN_PATH, BASE_CV_PL_PATH]) {
    try {
      writeFileSync(path, "", { flag: "wx" });
    } catch {
      // already exists — fine
    }
  }
}
