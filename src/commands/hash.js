// Calculate a cryptographic hash of a file.
// Must use crypto.createHash with Streams API
// Paths are relative to the current working directory or can be absolute
// If the input file doesn't exist, print Operation failed
// If the algorithm is not supported, print Operation failed
// If --save is passed, write hash to <inputFilename>.<algorithm> (example: file.txt.sha256)

import fs from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { currentDir } from "../navigation.js";
import { logError, logSuccess } from "../utils/messages.js";
import { commandError, inputError } from "../repl.js";
import { KNOWN_ALGORITHMS } from "../constants.js";
import { checkArgsCount } from "../utils/argParser.js";
import { fileExists } from "../utils/fileExists.js";

export const hash = async (incomeParts) => {
  if (!checkArgsCount(incomeParts, 2)) return inputError();
  const inputIndex = incomeParts.indexOf("--input");
  const algorithmIndex = incomeParts.indexOf("--algorithm");
  const saveIndex = incomeParts.indexOf("--save");

  if (inputIndex === -1) {
    logError("You need --input arguments");
    return commandError();
  }
  const inputPath = incomeParts[inputIndex + 1];
  if (!(await fileExists(inputPath))) {
    return;
  }

  let algorithm = "sha256";
  if (algorithmIndex !== -1) {
    algorithm = incomeParts[algorithmIndex + 1];
    if (KNOWN_ALGORITHMS.indexOf(algorithm) === -1) {
      logError("Unknown algorithm");
      return commandError();
    }
  }

  return new Promise((res, reject) => {
    const stream = fs.createReadStream(resolve(currentDir, inputPath));
    const hashSum = createHash(algorithm);

    stream.on("data", (chunk) => {
      hashSum.update(chunk);
    });

    stream.on("end", () => {
      const hex = hashSum.digest("hex");
      logSuccess(`${algorithm}: ${hex}`);

      if (saveIndex !== -1) {
        const output = resolve(currentDir, `${inputPath}.${algorithm}`);
        fs.writeFileSync(output, hex);
      }
      res();
    });

    stream.on("error", () => {
      commandError();
      reject();
    });
  });
};
