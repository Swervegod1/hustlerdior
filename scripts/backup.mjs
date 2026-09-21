import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "hustlerdior-backup-"));
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const filename = `hustlerdior-source-${stamp}.tar.gz`;
const destination = join(root, "private-backups", filename);
const manifest = {
  createdAt: new Date().toISOString(),
  kind: "source-and-public-catalog",
  excludes: [
    "credentials",
    "private cost reports",
    "customer/order databases",
    "node_modules",
    "build output",
  ],
  files: [],
};
const allowedFiles = new Set([
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next-env.d.ts",
  "next.config.ts",
  "tailwind.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "Dockerfile",
  "README.md",
  ".env.example",
  ".gitignore",
  ".dockerignore",
  ".prettierignore",
  ".prettierrc.json",
]);
const allowedDirectories = new Set([
  "src",
  "public",
  "scripts",
  "tests",
  "docs",
  "recovery",
  "database",
  "inventory",
]);
async function copyTree(relative, top = false) {
  for (const entry of await readdir(join(root, relative), {
    withFileTypes: true,
  })) {
    if (
      top &&
      !allowedFiles.has(entry.name) &&
      !allowedDirectories.has(entry.name)
    )
      continue;
    if (
      !top &&
      entry.name.startsWith(".") &&
      entry.name !== ".env.backup.example"
    )
      continue;
    const file = join(relative, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Refusing symlink in backup: ${file}`);
    if (entry.isDirectory()) {
      await mkdir(join(temp, file), { recursive: true });
      await copyTree(file);
    } else if (entry.isFile()) {
      const bytes = await readFile(join(root, file));
      await cp(join(root, file), join(temp, file));
      manifest.files.push({
        path: file,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
  }
}
try {
  await copyTree("", true);
  await writeFile(
    join(temp, "BACKUP-MANIFEST.json"),
    JSON.stringify(manifest, null, 2),
  );
  await mkdir(join(root, "private-backups"), { recursive: true, mode: 0o700 });
  execFileSync("tar", ["-czf", destination, "-C", temp, "."], {
    stdio: "pipe",
  });
  const checksum = createHash("sha256")
    .update(await readFile(destination))
    .digest("hex");
  await writeFile(`${destination}.sha256`, `${checksum}  ${filename}\n`);
  console.log(
    `Created ${destination} with ${manifest.files.length} source files. Keep the checksum beside it.`,
  );
} finally {
  await rm(temp, { recursive: true, force: true });
}
