export const parseArgs = (income) => {
  const incomeParts = income.split(" ").filter((item) => item !== "");
  const command = incomeParts.shift();
  return { incomeParts, command };
};

export const checkArgsCount = (incomeParts, n) => {
  return incomeParts[n - 1] !== undefined;
};
