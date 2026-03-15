import { logError } from "./utils/messages.js";
import { INVALID_INPUT, NWD_COMMANDS, OPERATION_FAILED } from "./constants.js";
import { nwdCommand } from "./navigation.js";
import { parseArgs } from "./utils/argParser.js";
import { csvToJson } from "./commands/csvToJson.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";

const getCommandType = (command) => {
  if (NWD_COMMANDS.includes(command)) {
    return "NWD";
  }
  return command;
};

export const doCommand = async (income) => {
  const { incomeParts, command } = parseArgs(income);
  switch (getCommandType(command)) {
    case "NWD":
      await nwdCommand(command, incomeParts);
      break;
    case "csv-to-json":
      await csvToJson(incomeParts);
      break;
    case "json-to-csv":
      await jsonToCsv(incomeParts);
      break;
    default:
      commandError();
      break;
  }
};

export const commandError = () => {
  logError(OPERATION_FAILED);
};

export const inputError = () => {
  logError(INVALID_INPUT);
};
