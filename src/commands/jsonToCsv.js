import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";

import { commandError, inputError } from "../repl.js";
import { checkArgsCount } from "../utils/argParser.js";
import { logError, successOperation } from "../utils/messages.js";
import { fileExists } from "../utils/fileExists.js";

class JsonToCsvTransform extends Transform {
  constructor() {
    super();
    this.headers = null;
    this.buffer = "";
  }

  processObject(obj) {
    if (!this.headers) {
      this.headers = Object.keys(obj);
      this.push(this.headers.join(",") + "\n");
    }

    const row = this.headers.map((h) => obj[h] ?? "").join(",");
    this.push(row + "\n");
  }

  _transform(chunk, _, callback) {
    this.buffer += chunk.toString();

    try {
      const data = JSON.parse(this.buffer);

      if (Array.isArray(data)) {
        for (const obj of data) {
          this.processObject(obj);
        }
      }
      this.buffer = "";
    } catch {}

    callback();
  }

  _flush(callback) {
    if (this.buffer) {
      try {
        const data = JSON.parse(this.buffer);

        if (Array.isArray(data)) {
          for (const obj of data) {
            this.processObject(obj);
          }
        }
      } catch {}
    }

    callback();
  }
}

// Input must be a JSON array of objects
// The first line of the output is the headers (keys from the first object)
// Each object becomes a CSV row
// Paths are relative to the current working directory or can be absolute
// If the input file doesn't exist or contains invalid JSON, print Operation failed
export const jsonToCsv = async (incomeParts) => {
  if (!checkArgsCount(incomeParts, 4)) return inputError();
  const inputIndex = incomeParts.indexOf("--input");
  const outputIndex = incomeParts.indexOf("--output");

  if (inputIndex === -1 || outputIndex === -1) {
    logError("You need --input and --output arguments");
    return commandError();
  }

  const inputPath = incomeParts[inputIndex + 1];
  const outputPath = incomeParts[outputIndex + 1];

  if (!(await fileExists(inputPath))) {
    return;
  }

  try {
    await pipeline(
      fs.createReadStream(inputPath),
      new JsonToCsvTransform(),
      fs.createWriteStream(outputPath),
    );
    successOperation();
  } catch {
    inputError();
  }
};
