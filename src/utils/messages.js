import { currentDir } from "../navigation.js";

export const writeGreeting = () => {
  writeMessage("Welcome to Data Processing CLI!", "green");
};

export const writeByeMessage = () => {
  writeMessage("Thank you for using Data Processing CLI!", "green");
};

export const getPrompt = () => {
  return `${setColor(`You are currently in <<${currentDir}>>`, 36)}\n${setColor("Enter command", 33)} > `;
};

export const setColor = (text, code) => `\x1b[${code}m${text}\x1b[0m`;
const colors = {
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  white: 37,
};

export const writeMessage = (message, color = "white") => {
  console.log(
    setColor(`\n--------\n${message}\n--------`, colors[color] || 37),
  );
};

export const logSuccess = (message) => {
  console.log(setColor(`\n${message}\n`, 32));
};

export const logError = (error) => {
  console.log(setColor(`\n${error}\n`, 31));
};

export const successOperation = () => {
  logSuccess("--- The operation was completed successfully ---");
};
