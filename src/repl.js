import { logError } from "./utils/messages.js";
import { NWD_COMMANDS } from "./constants.js";
import { nwdCommand } from "./navigation.js";

const getCommandType = (command) => {
  if (NWD_COMMANDS.includes(command)) {
    return "NWD";
  }
  return null;
};

export const doCommand = async (income) => {
  const incomeParts = income.split(" ").filter((item) => item !== "");
  const command = incomeParts.shift();
  switch (getCommandType(command)) {
    case "NWD":
      await nwdCommand(command, incomeParts);
      break;
    default:
      commandError();
      break;
  }
};

export const commandError = () => {
  logError(COMMAND_FAILED);
};

export const inputError = () => {
  logError(INVALID_INPUT);
};
