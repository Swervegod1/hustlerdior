import { readFile, mkdir, writeFile, rename, chmod } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { stageWholesaleCandidates } from "../src/lib/supplier-candidates.ts";

const source = resolve(
  process.argv[2] || "inventory/wholesale-candidates.json",
);
const rows = stageWholesaleCandidates(
  JSON.parse(await readFile(source, "utf8")),
);
await mkdir("private-data", { recursive: true, mode: 0o700 });
const target = "private-data/wholesale-candidates.json";
const temporary = `${target}.${randomUUID()}.tmp`;
await writeFile(temporary, `${JSON.stringify(rows, null, 2)}\n`, {
  mode: 0o600,
});
await rename(temporary, target);
await chmod(target, 0o600);
console.log(
  JSON.stringify({
    stagedStyles: rows.length,
    file: target,
    published: 0,
    downloadedImages: 0,
  }),
);
