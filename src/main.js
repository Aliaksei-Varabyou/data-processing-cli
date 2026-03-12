import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  getPrompt,
  logError,
  writeByeMessage,
  writeGreeting,
} from "./utils/messages.js";

writeGreeting();

const rl = createInterface({ input, output, prompt: getPrompt() });
rl.prompt();

try {
  rl.on("line", (line) => {
    const operation = line.trim();
    if (operation === ".exit" || operation === "exit") {
      rl.close();
    } else {
      rl.prompt();
    }
  }).on("close", () => {
    writeByeMessage();
  });
} catch {
  logError(operationError());
}
