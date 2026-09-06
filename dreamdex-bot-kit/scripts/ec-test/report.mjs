#!/usr/bin/env node
/**
 * Merge artifacts/*.json into docs/tests/ec-test-report.md
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ARTIFACTS = path.join(ROOT, "artifacts");
const REPORT = path.join(ROOT, "docs/tests/ec-test-report.md");

async function loadResults() {
  try {
    const files = (await readdir(ARTIFACTS)).filter((f) => f.endsWith(".json"));
    // Latest run per case, not every run ever. Filenames end in an ISO timestamp,
    // so sorting ascending and overwriting by id leaves the most recent. Merging
    // all of them is how the first version of this report ended up listing the
    // same case three times with two different verdicts — a reader cannot tell
    // which one describes the code in front of them.
    const latest = new Map();
    for (const f of files.sort()) {
      const row = JSON.parse(await readFile(path.join(ARTIFACTS, f), "utf8"));
      if (row?.id) latest.set(row.id, row);
    }
    return [...latest.values()];
  } catch {
    return [];
  }
}

function tableForGate(rows, gate) {
  const g = rows.filter((r) => r.gate === gate);
  if (!g.length) return `_No gate ${gate} runs yet._\n`;
  let md = "| Case | Bot | Pass | Exit | Log |\n|------|-----|------|------|-----|\n";
  for (const r of g) {
    const pass = r.pass === true ? "yes" : r.pass === false ? "**no**" : r.skipped ? `skip (${r.skipped})` : "skip";
    md += `| ${r.id} | ${r.bot} | ${pass} | ${r.exitCode ?? "—"} | \`${r.logPath ?? ""}\` |\n`;
  }
  return md + "\n";
}

async function main() {
  const rows = await loadResults();
  let report;
  try {
    report = await readFile(REPORT, "utf8");
  } catch {
    report = "# EC bot test report\n\n<!-- AUTO_RESULTS_START -->\n<!-- AUTO_RESULTS_END -->\n";
  }

  const start = "<!-- AUTO_RESULTS_START -->";
  const end = "<!-- AUTO_RESULTS_END -->";
  const block = `${start}
## Automated run summary (generated)

_Gates last merged: ${new Date().toISOString()}_

### Gate 1
${tableForGate(rows, 1)}

### Gate 2
${tableForGate(rows, 2)}

### Gate 3
${tableForGate(rows, 3)}
${end}`;

  if (report.includes(start)) {
    report = report.replace(new RegExp(`${start}[\\s\\S]*${end}`), block);
  } else {
    report += `\n\n${block}\n`;
  }

  await writeFile(REPORT, report, "utf8");
  console.log(`Updated ${path.relative(ROOT, REPORT)} (${rows.length} result file(s))`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
