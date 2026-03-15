import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";

import { commandError, inputError } from "../repl.js";
import { checkArgsCount } from "../utils/argParser.js";
import { logError, successOperation } from "../utils/messages.js";
import { fileExists } from "../utils/fileExists.js";

class CsvToJsonTransform extends Transform {
  constructor() {
    super();
    this.headers = null;
    this.buffer = "";
    this.first = true;
  }

  processLine(line) {
    const values = line.split(",");
    const obj = {};

    this.headers.forEach((h, i) => {
      obj[h] = values[i];
    });

    const json = JSON.stringify(obj);

    if (this.first) {
      this.push("[\n" + json);
      this.first = false;
    } else {
      this.push(",\n" + json);
    }
  }

  _transform(chunk, _, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop();

    for (const line of lines) {
      if (!this.headers) {
        this.headers = line.split(",");
        continue;
      }

      this.processLine(line);
    }
    callback();
  }

  _flush(callback) {
    if (this.buffer) {
      this.processLine(this.buffer);
    }

    this.push("\n]");
    callback();
  }
}

// The first line of the CSV file is treated as headers
// Each subsequent line becomes a JSON object with header names as keys
// The output file should contain a JSON array of objects
// Must use Readable Stream → Transform Stream → Writable Stream pipeline
// Paths are relative to the current working directory or can be absolute
// If the input file doesn't exist, print Operation failed
export const csvToJson = async (incomeParts) => {
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
      new CsvToJsonTransform(),
      fs.createWriteStream(outputPath),
    );
    successOperation();
  } catch {
    inputError();
  }
};
