import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { directoryGroups } from "../src/lib/navigation";
const read = (p: string) =>
  readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
test("Customer support routes exist and are linked from footer", () => {
  for (const route of ["shipping", "returns", "terms", "contact"]) {
    assert.match(read(`src/app/${route}/page.tsx`), /export default function/);
    assert.ok(
      directoryGroups.some((group) =>
        group.links.some((link) => link.href === `/${route}`),
      ),
    );
  }
});
test("Unapproved commercial terms remain blocked from search", () => {
  for (const route of ["shipping", "returns", "terms"]) {
    assert.match(read(`src/app/${route}/page.tsx`), /index: false/);
    assert.match(read(`src/app/${route}/page.tsx`), /approval/i);
  }
});
test("Static structured FAQ never wrongly claims payments are disabled", () => {
  const faq = JSON.parse(read("src/data/faq-help.json"));
  assert.ok(
    faq.mainEntity.some(
      (q: { name: string }) => q.name === "Is online checkout open?",
    ),
  );
  assert.ok(
    !JSON.stringify(faq).includes("Payment is not currently collected"),
  );
});
