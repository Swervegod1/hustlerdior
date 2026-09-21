import { readFile, mkdir, writeFile } from "node:fs/promises";
import { stageWholesaleFeed } from "../src/lib/suppliers.ts";
const path = process.argv[2];
if (!path)
  throw new Error(
    "Usage: node --import tsx scripts/stage-wholesale.mjs /path/to/authorized-supplier-feed.json",
  );
const rows = stageWholesaleFeed(JSON.parse(await readFile(path, "utf8")));
await mkdir("private-data", { recursive: true });
await writeFile(
  "private-data/wholesale-drafts.json",
  JSON.stringify(rows, null, 2),
  { mode: 0o600 },
);
console.log(
  `Staged ${rows.length} supplier variants for review. Nothing was published or ordered.`,
);
