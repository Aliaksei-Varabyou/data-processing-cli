// Compute statistics for a large log file using Worker Threads for parallel processing.
// Split the input file into N chunks (where N = number of CPU cores), ensuring chunks start and end on line boundaries
// Send each chunk to a Worker Thread for parsing and partial aggregation
// Each Worker returns partial stats: counts by level, counts by status class, path counts, total lines, response time sum
// The main thread merges partial stats and computes final avgResponseTimeMs
// Write the JSON result to the output file
// Must use Worker Threads for parallel processing
// The number of workers should equal the number of logical CPU cores
// Paths are relative to the current working directory or can be absolute
// If the input file doesn't exist, print Operation failed
import fs from "node:fs/promises";
import { resolve } from "node:path";
import { cpus } from "node:os";
import { Worker } from "node:worker_threads";

import { commandError, inputError } from "../repl.js";
import { checkArgsCount } from "../utils/argParser.js";
import { fileExists } from "../utils/fileExists.js";
import { currentDir } from "../navigation.js";

function merge(target, source) {
  for (const key in source) {
    target[key] = (target[key] || 0) + source[key];
  }
}

function finalize(results, outputPath) {
  const result = {
    total: 0,
    levels: {},
    status: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
    paths: {},
    responseTimeSum: 0,
  };

  for (const part of results) {
    result.total += part.total;
    result.responseTimeSum += part.responseTimeSum;

    merge(result.levels, part.levels);
    merge(result.paths, part.paths);

    for (const k in result.status) result.status[k] += part.status[k];
  }

  const topPaths = Object.entries(result.paths)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const output = {
    total: result.total,
    levels: result.levels,
    status: result.status,
    topPaths,
    avgResponseTimeMs: Number(
      (result.responseTimeSum / result.total).toFixed(2),
    ),
  };

  fs.writeFile(outputPath, JSON.stringify(output, null, 2));
}

export const logStats = async (incomeParts) => {
  if (!checkArgsCount(incomeParts, 4)) return inputError();
  const inputIndex = incomeParts.indexOf("--input");
  const outputIndex = incomeParts.indexOf("--output");

  const inputPath = resolve(currentDir, incomeParts[inputIndex + 1]);
  const outputPath = resolve(currentDir, incomeParts[outputIndex + 1]);

  if (!(await fileExists(incomeParts[inputIndex + 1]))) {
    return;
  }

  // worker counts and chunk size
  const workersCount = cpus().length;
  const stats = await fs.stat(inputPath);
  const fileSize = stats.size;
  const chunkSize = Math.ceil(stats.size / workersCount);

  // array of chunks koords
  const chunks = [];
  for (let i = 0; i < workersCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);
    chunks.push({ start, end });
  }

  // build results from workers
  const partialResults = [];
  for (const chunk of chunks) {
    const worker = new Worker(
      new URL("../workers/logWorker.js", import.meta.url),
      {
        workerData: {
          filePath: inputPath,
          start: chunk.start,
          end: chunk.end,
        },
      },
    );

    worker.on("message", (result) => {
      partialResults.push(result);
      if (partialResults.length === workersCount) {
        finalize(partialResults, outputPath);
      }
    });

    worker.on("error", () => {
      commandError();
    });
  }
};
