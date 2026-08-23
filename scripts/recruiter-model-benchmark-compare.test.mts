import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function report(model: string, criticalFailures?: number) {
  return {
    schemaVersion: 1,
    model,
    summary: {
      deterministicScore: 88,
      medianLatencyMs: 22_900,
      p95LatencyMs: 40_200,
      failedCases: 4,
      ...(criticalFailures === undefined ? {} : { criticalFailures }),
    },
  };
}

describe("benchmark report comparison", () => {
  it("shows critical failures while remaining compatible with older reports", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "benchmark-compare-"));
    temporaryDirectories.push(directory);
    const oldReportPath = path.join(directory, "old.json");
    const calibratedReportPath = path.join(directory, "calibrated.json");
    await Promise.all([
      writeFile(
        oldReportPath,
        JSON.stringify(report("qwen2.5-coder:3b")),
        "utf8",
      ),
      writeFile(
        calibratedReportPath,
        JSON.stringify(report("qwen3:1.7b", 2)),
        "utf8",
      ),
    ]);

    const result = spawnSync(
      process.execPath,
      [
        path.join(
          process.cwd(),
          "scripts/recruiter-model-benchmark-compare.mjs",
        ),
        oldReportPath,
        calibratedReportPath,
      ],
      { encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      "Model\tScore\tMedian\tP95\tFailures\tCritical",
    );
    expect(result.stdout).toContain(
      "qwen2.5-coder:3b\t88.0\t22.9s\t40.2s\t4\t0",
    );
    expect(result.stdout).toContain("qwen3:1.7b\t88.0\t22.9s\t40.2s\t4\t2");
    expect(result.stdout).toContain("human review");
  });
});
