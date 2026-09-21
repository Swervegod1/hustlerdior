import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  const directory = new URL(
    import.meta.url.includes("/scripts/") ? "../database/" : "./database/",
    import.meta.url,
  );
  for (const file of (await readdir(directory))
    .filter((name) => /^\d+-[\w-]+\.sql$/.test(name))
    .sort()) {
    await db.query(await readFile(new URL(file, directory), "utf8"));
  }
  console.log("Commerce and support tables ready.");
} finally {
  await db.end();
}
