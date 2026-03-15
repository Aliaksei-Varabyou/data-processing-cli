import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  getPrompt,
  logError,
  writeByeMessage,
  writeGreeting,
} from "./utils/messages.js";
import { commandError, doCommand } from "./repl.js";

writeGreeting();
console.log("cd  /Users/owl/Projects/RS/Study/Node/");
console.log("encrypt --input data.csv --output enc.data --password pass");
console.log("decrypt --input enc.data --output data.txt --password pass");

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
