import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { stageDropshipCandidates } from "../src/lib/dropship-candidates.ts";

const source = resolve(process.argv[2] || "inventory/dropship-candidates.json");
const rows = stageDropshipCandidates(
  JSON.parse(await readFile(source, "utf8")),
);
let downloadedImages = 0;
for (const row of rows) {
  for (const image of row.images) {
    if (image.status !== "downloaded") continue;
    const bytes = await readFile(resolve(image.localFile));
    if (createHash("sha256").update(bytes).digest("hex") !== image.sha256) {
      throw new Error(`Image checksum mismatch: ${row.candidateId}`);
    }
    downloadedImages++;
  }
}
await mkdir("private-data", { recursive: true, mode: 0o700 });
const target = "private-data/dropship-candidates.json";
const temporary = `${target}.${randomUUID()}.tmp`;
await writeFile(temporary, `${JSON.stringify(rows, null, 2)}\n`, {
  mode: 0o600,
});
await rename(temporary, target);
console.log(
  JSON.stringify({
    stagedStyles: rows.length,
    downloadedImages,
    published: 0,
    file: target,
  }),
);
