import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildVerifiedSpecs,
  parseVerifiedSpecsCsv,
} from "../src/lib/verified-specs-build";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = join(root, "docs/seo/verified-specs.csv");
const jsonPath = join(root, "src/data/verified-specs.json");
const rows = parseVerifiedSpecsCsv(readFileSync(csvPath, "utf8"));
const specs = buildVerifiedSpecs(rows);
writeFileSync(jsonPath, `${JSON.stringify(specs, null, 2)}\n`);
console.log(
  `Wrote ${Object.keys(specs).length} verified spec records to ${jsonPath}`,
);
