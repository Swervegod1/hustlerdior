import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
await mkdir(".next/standalone/.next", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
// Runtime credentials are provided by the host. Never ship a local .env in a build artifact.
for (const name of [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  ".env.development",
  ".env.development.local",
])
  await rm(`.next/standalone/${name}`, { force: true });
await build({
  entryPoints: ["scripts/payment-worker.ts"],
  outfile: ".next/standalone/payment-worker.mjs",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
  conditions: ["react-server"],
});
await cp("content", ".next/standalone/content", { recursive: true });
await cp("database", ".next/standalone/database", { recursive: true });
await cp("scripts/migrate.mjs", ".next/standalone/migrate.mjs");
console.log(
  "Standalone assets and payment worker prepared; local environment files excluded.",
);
