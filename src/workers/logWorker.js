import fs from "node:fs";
import { parentPort, workerData } from "node:worker_threads";

const { filePath, start, end } = workerData;

const stats = {
  total: 0,
  levels: {},
  status: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
  paths: {},
  responseTimeSum: 0,
};

const stream = fs.createReadStream(filePath, {
  start,
  end,
  encoding: "utf8",
});

let buffer = "";

stream.on("data", (chunk) => {
  buffer += chunk;

  const lines = buffer.split("\n");
  buffer = lines.pop();

  for (const line of lines) processLine(line);
});

stream.on("end", () => {
  if (buffer) processLine(buffer);

  parentPort.postMessage(stats);
});

function processLine(line) {
  if (!line.trim()) return;

  const parts = line.split(" ");

  const level = parts[1];
  const statusCode = Number(parts[3]);
  const responseTime = Number(parts[4]);
  const path = parts[6];

  stats.total++;

  stats.levels[level] = (stats.levels[level] || 0) + 1;

  const statusClass = `${Math.floor(statusCode / 100)}xx`;
  if (stats.status[statusClass] !== undefined) stats.status[statusClass]++;

  stats.paths[path] = (stats.paths[path] || 0) + 1;

  stats.responseTimeSum += responseTime;
}
