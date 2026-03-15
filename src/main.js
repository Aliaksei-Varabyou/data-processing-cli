import { createInterface } from "node:readline/promises";
import { chdir, stdin as input, stdout as output } from "node:process";
import { homedir } from "node:os";

import {
  getPrompt,
  logError,
  writeByeMessage,
  writeGreeting,
} from "./utils/messages.js";
import { commandError, doCommand } from "./repl.js";

writeGreeting();
console.log("Directory for test::", process.cwd());
chdir(homedir());

const rl = createInterface({ input, output, prompt: getPrompt() });
rl.prompt();

try {
  rl.on("line", (line) => {
    const command = line.trim();
    if (command === ".exit" || command === "exit") {
      rl.close();
    } else {
      doCommand(command).then(() => {
        // change prompt if working directory was changed
        rl.setPrompt(getPrompt());
        rl.prompt();
      });
    }
  }).on("close", () => {
    writeByeMessage();
  });
} catch {
  logError(commandError());
}
