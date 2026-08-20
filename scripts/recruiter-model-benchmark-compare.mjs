import { readFile } from "node:fs/promises";

function formatSeconds(milliseconds) {
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

async function readReport(filePath) {
  const content = await readFile(filePath, "utf8");
  if (content.length > 10_000_000) throw new Error("report is too large");
  const report = JSON.parse(content);
  if (
    report?.schemaVersion !== 1 ||
    typeof report.model !== "string" ||
    typeof report.summary?.deterministicScore !== "number" ||
    typeof report.summary?.medianLatencyMs !== "number" ||
    typeof report.summary?.p95LatencyMs !== "number" ||
    typeof report.summary?.failedCases !== "number"
  ) {
    throw new Error("invalid report format");
  }
  return report;
}

if (process.argv.length < 4) {
  console.error(
    "Usage: node scripts/recruiter-model-benchmark-compare.mjs <report-a.json> <report-b.json> [report-c.json]",
  );
  process.exitCode = 1;
} else {
  try {
    const reports = [];
    for (const filePath of process.argv.slice(2)) {
      reports.push(await readReport(filePath));
    }

    console.info("Recruiter AI Model Benchmark Comparison");
    console.info("");
    console.info("Model\tScore\tMedian\tP95\tFailures");
    for (const report of reports) {
      console.info(
        `${report.model}\t${report.summary.deterministicScore.toFixed(1)}\t${formatSeconds(report.summary.medianLatencyMs)}\t${formatSeconds(report.summary.p95LatencyMs)}\t${report.summary.failedCases}`,
      );
    }
  } catch {
    console.error("Recruiter AI Model Benchmark Comparison: FAIL");
    process.exitCode = 1;
  }
}
