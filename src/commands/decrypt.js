// Decrypt a file produced by encrypt.
// Must parse salt (first 16 bytes) and iv (next 12 bytes) from the input
// Must parse authTag (last 16 bytes) from the input
// Must decrypt using AES-256-GCM with authentication tag verification
// Must use Streams API end-to-end
// The decrypted result must match the original file content exactly
// Paths are relative to the current working directory or can be absolute
// If the input file doesn't exist or auth fails, print Operation failed
import fs from "node:fs";
import { resolve } from "node:path";
import { createDecipheriv, scryptSync } from "node:crypto";

import { commandError, inputError } from "../repl.js";
import { checkArgsCount } from "../utils/argParser.js";
import { successOperation } from "../utils/messages.js";
import { fileExists } from "../utils/fileExists.js";
import { currentDir } from "../navigation.js";

export const decrypt = async (incomeParts) => {
  if (!checkArgsCount(incomeParts, 6)) return inputError();
  const inputIndex = incomeParts.indexOf("--input");
  const outputIndex = incomeParts.indexOf("--output");
  const passwordIndex = incomeParts.indexOf("--password");

  const inputPath = resolve(currentDir, incomeParts[inputIndex + 1]);
  const outputPath = resolve(currentDir, incomeParts[outputIndex + 1]);
  const password = incomeParts[passwordIndex + 1];

  if (!(await fileExists(incomeParts[inputIndex + 1]))) {
    return;
  }

  return new Promise((res) => {
    fs.stat(inputPath, (err, stats) => {
      if (err || stats.size < 44) {
        commandError();
        return res();
      }

      const fd = fs.openSync(inputPath, "r");

      // read header
      const salt = Buffer.alloc(16);
      const iv = Buffer.alloc(12);

      fs.readSync(fd, salt, 0, 16, 0);
      fs.readSync(fd, iv, 0, 12, 16);

      // read authtag
      const authTag = Buffer.alloc(16);
      fs.readSync(fd, authTag, 0, 16, stats.size - 16);

      fs.closeSync(fd);

      // derive key
      const key = scryptSync(password, salt, 32);

      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      const readStream = fs.createReadStream(inputPath, {
        start: 28,
        end: stats.size - 17,
      });

      const writeStream = fs.createWriteStream(outputPath);

      readStream
        .pipe(decipher)
        .pipe(writeStream)
        .on("finish", () => {
          successOperation();
          res();
        });

      readStream.on("error", () => {
        commandError();
        res();
      });

      decipher.on("error", () => {
        commandError();
        res();
      });

      writeStream.on("error", () => {
        commandError();
        res();
      });
    });
  });
};
