// Calculate file hash and compare it with a value stored in a hash file.
// Must calculate hash of --input using Streams API
// Must read expected hash value from --hash file
// Comparison should be case-insensitive and ignore trailing newline in hash file
// Paths are relative to the current working directory or can be absolute
// If input or hash file doesn't exist, print Operation failed
// If algorithm is not supported, print Operation failed

import fs from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { currentDir } from "../navigation.js";
import { logError, logSuccess } from "../utils/messages.js";
import { commandError, inputError } from "../repl.js";
import { KNOWN_ALGORITHMS } from "../constants.js";
import { checkArgsCount } from "../utils/argParser.js";
import { fileExists } from "../utils/fileExists.js";

export const hashCompare = async (incomeParts) => {
  if (!checkArgsCount(incomeParts, 4)) return inputError();
  const inputIndex = incomeParts.indexOf("--input");
  const hashIndex = incomeParts.indexOf("--hash");
  const algorithmIndex = incomeParts.indexOf("--algorithm");

  if (inputIndex === -1 || hashIndex === -1) {
    logError("You need --input and --hash arguments");
    return commandError();
  }
  const inputPath = incomeParts[inputIndex + 1];
  if (!(await fileExists(inputPath))) {
    return;
  }
  const hashPath = incomeParts[hashIndex + 1];
  if (!(await fileExists(hashPath))) {
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
      const hex = hashSum.digest("hex").toLowerCase();
      fs.readFile(resolve(currentDir, hashPath), "utf8", (err, data) => {
        if (err) {
          commandError();
          return res();
        }

        const expected = data.trim().toLowerCase();

        if (hex === expected) {
          logSuccess("OK");
        } else {
          logSuccess("MISMATCH");
        }

        res();
      });
    });

    stream.on("error", () => {
      commandError();
      reject();
    });
  });
};
