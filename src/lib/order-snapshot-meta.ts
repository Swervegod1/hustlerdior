import { orderSnapshotSchema, type OrderSnapshot } from "./commerce-schema";

const CHUNK = 450;
const MAX_CHUNKS = 40;

/** Pack an order snapshot into Stripe metadata (500-character value limit). */
export function snapshotMetadata(
  id: string,
  ownerHash: string,
  snapshot: OrderSnapshot,
  extra: Record<string, string> = {},
) {
  const json = JSON.stringify(snapshot);
  const meta: Record<string, string> = {
    hd_order_id: id,
    hd_owner: ownerHash,
    ...extra,
  };
  let index = 0;
  for (let offset = 0; offset < json.length; offset += CHUNK, index++) {
    if (index >= MAX_CHUNKS) throw new Error("Order is too large for checkout.");
    meta[`hd_s${index}`] = json.slice(offset, offset + CHUNK);
  }
  return meta;
}

export function snapshotFromMetadata(
  metadata: Record<string, string> | null | undefined,
): OrderSnapshot | null {
  if (!metadata) return null;
  const parts: string[] = [];
  for (let index = 0; index < MAX_CHUNKS; index++) {
    const value = metadata[`hd_s${index}`];
    if (!value) break;
    parts.push(value);
  }
  if (!parts.length) return null;
  try {
    const parsed = orderSnapshotSchema.safeParse(JSON.parse(parts.join("")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function ownerFromMetadata(
  metadata: Record<string, string> | null | undefined,
) {
  const owner = metadata?.hd_owner;
  return owner && /^[a-f0-9]{64}$/.test(owner) ? owner : "";
}
