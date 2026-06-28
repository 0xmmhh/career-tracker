import React from "react";
import { render } from "ink";
import { App } from "./app.js";

export function startTui() {
  // Enter alternate screen buffer (like htop/vim): clears the terminal and
  // restores it exactly as it was when the app exits.
  process.stdout.write("\x1B[?1049h\x1B[2J\x1B[H");
  const restore = () => process.stdout.write("\x1B[?1049l");

  const { waitUntilExit } = render(<App />);
  waitUntilExit().then(restore, restore);
}
