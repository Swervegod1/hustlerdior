import specs from "@/data/verified-specs.json";
import type { CatalogFacts } from "./seo";
import type { VerifiedSpecRecord } from "./verified-specs-build";

const table = specs as Record<string, VerifiedSpecRecord>;

export type ProductDetailLine = {
  key: "blank" | "weight" | "fabric" | "fit" | "printMethod";
  label: string;
  value: string;
};

export function verifiedSpecFor(
  productId: number,
): VerifiedSpecRecord | undefined {
  return table[String(productId)];
}

/**
 * Printful names a technique only when the cell does not say "not stated".
 * The label is the text before the placement annotation, verbatim.
 */
export function statedPrintMethod(value: string | undefined) {
  const raw = value?.trim() ?? "";
  if (!raw || /^not stated\b/i.test(raw)) return undefined;
  const label = raw.split(" [")[0]?.trim();
  return label || undefined;
}

export function detailLines(
  spec: VerifiedSpecRecord | undefined,
): ProductDetailLine[] {
  if (!spec) return [];
  const lines: ProductDetailLine[] = [];
  if (spec.blank)
    lines.push({ key: "blank", label: "Blank", value: spec.blank });
  if (spec.weight) {
    lines.push({ key: "weight", label: "Fabric weight", value: spec.weight });
  }
  if (spec.fabric) {
    lines.push({ key: "fabric", label: "Fabric", value: spec.fabric });
  }
  if (spec.fit) lines.push({ key: "fit", label: "Fit", value: spec.fit });
  const printMethod = statedPrintMethod(spec.printMethod);
  if (printMethod) {
    lines.push({
      key: "printMethod",
      label: "Print method",
      value: printMethod,
    });
  }
  return lines;
}

export function detailLinesFor(productId: number) {
  return detailLines(verifiedSpecFor(productId));
}

/** Facts that the product page shows, shaped for ProductGroup JSON-LD. */
export function catalogFactsFor(productId: number): CatalogFacts | null {
  const lines = detailLinesFor(productId);
  if (!lines.length) return null;
  const material = lines.find((line) => line.key === "fabric")?.value;
  const weight = lines.find((line) => line.key === "weight")?.value;
  const additionalProperty = lines
    .filter((line) => line.key !== "fabric" && line.key !== "weight")
    .map((line) => ({ name: line.label, value: line.value }));
  return {
    ...(material ? { material } : {}),
    ...(weight ? { weight } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
  };
}
