import fs from "node:fs";
import { resolve } from "node:path";

import { commandError, inputError } from "../repl.js";
import { checkArgsCount } from "../utils/argParser.js";
import { logError, logSuccess } from "../utils/messages.js";
import { fileExists } from "../utils/fileExists.js";
import { currentDir } from "../navigation.js";

// Count lines, words, and characters in a file (similar to the wc command).
// Must use Streams API to process the file (do not load the entire file into memory)
// A word is any sequence of non-whitespace characters
// Paths are relative to the current working directory or can be absolute
// If the input file doesn't exist, print Operation failed
export const countFile = async (incomeParts) => {
  if (!checkArgsCount(incomeParts, 2)) return inputError();
  const inputIndex = incomeParts.indexOf("--input");

  if (inputIndex === -1) {
    logError("You need --input arguments");
    return commandError();
  }
  const inputPath = incomeParts[inputIndex + 1];

  if (!(await fileExists(inputPath))) {
    return;
  }

  return new Promise((res, reject) => {
    const stream = fs.createReadStream(resolve(currentDir, inputPath), {
      encoding: "utf-8",
    });

    let lines = 0;
    let words = 0;
    let characters = 0;
    let left = "";

    stream.on("data", (chunk) => {
      characters += chunk.length;
      lines += (chunk.match(/\n/g) || []).length;
      let parts = (left + chunk).split(/\s/);
      left = parts.pop() ?? "";
      words += parts.filter((w) => w.length > 0).length;
    });

    stream.on("close", () => {
      if (characters > 0) lines++;
      if (left && left.trim()) words++;
      logSuccess(`Lines: ${lines}\nWords: ${words}\nCharacters: ${characters}`);
      res();
    });

    stream.on("error", () => {
      commandError();
      reject();
    });
  });
};
