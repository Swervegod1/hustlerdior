/**
 * Turn the Printful verified-specs CSV into a compact lookup.
 * Empty cells are omitted. An UNVERIFIED blank note is not a stated brand.
 */

export type SpecSourceRow = {
  store_product_id: string;
  store_product_name: string;
  blank_brand_model: string;
  fabric_or_material_text_from_printful: string;
  gsm_or_oz_if_stated_verbatim: string;
  fit_if_stated: string;
  print_method_if_stated: string;
  source_url_or_endpoint: string;
};

export type VerifiedSpecRecord = {
  blank?: string;
  fabric?: string;
  weight?: string;
  fit?: string;
  printMethod?: string;
};

const COLUMNS = [
  "store_product_id",
  "store_product_name",
  "blank_brand_model",
  "fabric_or_material_text_from_printful",
  "gsm_or_oz_if_stated_verbatim",
  "fit_if_stated",
  "print_method_if_stated",
  "source_url_or_endpoint",
] as const;

const FIELD_MAP = [
  ["blank_brand_model", "blank"],
  ["fabric_or_material_text_from_printful", "fabric"],
  ["gsm_or_oz_if_stated_verbatim", "weight"],
  ["fit_if_stated", "fit"],
  ["print_method_if_stated", "printMethod"],
] as const;

/** RFC 4180 records, including quoted newlines. */
export function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }
  return rows;
}

export function parseVerifiedSpecsCsv(text: string): SpecSourceRow[] {
  const [header, ...records] = parseCsvRecords(text);
  if (!header) throw new Error("Verified specs CSV is empty");
  if (header.join(",") !== COLUMNS.join(",")) {
    throw new Error(`Unexpected verified specs header: ${header.join(",")}`);
  }
  return records.map((record, index) => {
    if (record.length !== COLUMNS.length) {
      throw new Error(
        `Verified specs row ${index + 2} has ${record.length} columns`,
      );
    }
    const row = {} as SpecSourceRow;
    COLUMNS.forEach((column, columnIndex) => {
      row[column] = record[columnIndex] ?? "";
    });
    if (!/^\d{1,15}$/.test(row.store_product_id)) {
      throw new Error(`Invalid store product id on row ${index + 2}`);
    }
    return row;
  });
}

function statedCell(column: (typeof FIELD_MAP)[number][0], value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (column === "blank_brand_model" && trimmed.startsWith("UNVERIFIED")) {
    return undefined;
  }
  return trimmed;
}

/** One record per store product. Products with no stated fields are omitted. */
export function buildVerifiedSpecs(rows: SpecSourceRow[]) {
  const specs: Record<string, VerifiedSpecRecord> = {};
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.store_product_id)) {
      throw new Error(`Duplicate store product id ${row.store_product_id}`);
    }
    seen.add(row.store_product_id);
    const record: VerifiedSpecRecord = {};
    for (const [column, key] of FIELD_MAP) {
      const value = statedCell(column, row[column]);
      if (value) record[key] = value;
    }
    if (Object.keys(record).length > 0) specs[row.store_product_id] = record;
  }
  return specs;
}
