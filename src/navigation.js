import { chdir, cwd } from "node:process";
import { resolve } from "node:path";
import { promises } from "node:fs";

import { inputError, commandError } from "./repl.js";

// Moves up one directory level from the current working directory
// If already in the root directory, does nothing (no error)
// After successful navigation, prints the new current working directory path
const up = () => {
  try {
    chdir(resolve(cwd(), ".."));
  } catch {
    inputError();
  }
};

// Navigates to the specified directory
// Can accept both relative and absolute paths
// If path doesn't exist or is not a directory, prints Operation failed and stays in current directory
// If successful, prints the new current working directory path
const cd = (incomeParts) => {
  try {
    chdir(incomeParts[0]);
  } catch {
    inputError();
  }
};

// A list of all files and folders in the current directory
// Folders listed first, then files, all in alphabetical order
// Each entry shows the name (with extension for files) and type (file or folder)
const ls = async () => {
  try {
    const files = await promises.readdir(cwd(), { withFileTypes: true });

    const fileInfo = await Promise.all(
      files.map((file) => {
        return {
          name: file.name,
          type: file.isDirectory() ? "folder" : "file",
        };
      }),
    );

    const sortedFileInfo = fileInfo.sort((a, b) => {
      if (a.type < b.type) return 1;
      if (a.type > b.type) return -1;
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      return 0;
    });

    console.table(sortedFileInfo);
  } catch {
    inputError();
  }
};

const NWD_FUNCTIONS = { up, cd, ls };

export const nwdCommand = async (command, incomeParts) => {
  try {
    await NWD_FUNCTIONS[command](incomeParts);
  } catch {
    commandError();
  }
};
