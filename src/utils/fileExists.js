import { access } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

import { commandError } from "../repl.js";
import { logError } from "./messages.js";

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
  const filePath = join(cwd(), name);
  if (!(await pathExists(filePath))) {
    logError(`${name} don't exist`);
    commandError();
    return false;
  }
  return true;
};
