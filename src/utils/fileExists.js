import { access } from "node:fs/promises";
import { resolve } from "node:path";

import { commandError } from "../repl.js";
import { logError } from "./messages.js";
import { currentDir } from "../navigation.js";

const pathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    } else {
      throw err;
    }
  }
};

export const fileExists = async (name) => {
  const filePath = resolve(currentDir, name);
  if (!(await pathExists(filePath))) {
    logError(`${name} don't exist`);
    commandError();
    return false;
  }
  return true;
};
