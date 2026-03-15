// Encrypt a file using AES-256-GCM.
// Must derive a 32-byte key from password and salt
// Must encrypt using AES-256-GCM
// Must use Streams API end-to-end
// You must not load the full file into memory. The only allowed in-memory buffering is:
// the header (first 28 bytes = salt + iv)
// the authentication tag (last 16 bytes)
// Paths are relative to the current working directory or can be absolute
// If the input file doesn't exist, print Operation failed
import fs from "node:fs";
import { resolve } from "node:path";
import { randomBytes, createCipheriv, scryptSync } from "node:crypto";

import { commandError, inputError } from "../repl.js";
import { checkArgsCount } from "../utils/argParser.js";
import { successOperation } from "../utils/messages.js";
import { fileExists } from "../utils/fileExists.js";
import { currentDir } from "../navigation.js";

export const encrypt = async (incomeParts) => {
  if (!checkArgsCount(incomeParts, 6)) return inputError();
  const inputIndex = incomeParts.indexOf("--input");
  const outputIndex = incomeParts.indexOf("--output");
  const passwordIndex = incomeParts.indexOf("--password");

  const inputPath = incomeParts[inputIndex + 1];
  const outputPath = incomeParts[outputIndex + 1];
  const password = incomeParts[passwordIndex + 1];

  if (!(await fileExists(inputPath))) {
    return;
  }

  return new Promise((res) => {
    const readStream = fs.createReadStream(resolve(currentDir, inputPath));
    const writeStream = fs.createWriteStream(resolve(currentDir, outputPath));

    readStream.on("error", () => {
      commandError();
      res();
    });

    writeStream.on("error", () => {
      commandError();
      res();
    });

    // Header part
    const salt = randomBytes(16);
    const iv = randomBytes(12);

    // derive key
    const key = scryptSync(password, salt, 32);
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    writeStream.write(salt);
    writeStream.write(iv);

    // pipeline
    readStream.pipe(cipher).pipe(writeStream, { end: false });

    cipher.on("end", () => {
      const tag = cipher.getAuthTag();
      writeStream.write(tag);
      successOperation();
      res();
    });
  });
};
