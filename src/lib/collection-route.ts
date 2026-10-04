import { z } from "zod";
import { collections } from "./collections";

export function collectionPathAction(
  pathname: string,
):
  | { kind: "pass" }
  | { kind: "redirect"; pathname: string }
  | { kind: "not-found" } {
  const match = pathname.match(/^\/collections\/([^/]+)\/?$/);
  if (!match) return { kind: "pass" };
  let raw: string;
  try {
    raw = decodeURIComponent(match[1]);
  } catch {
    return { kind: "not-found" };
  }
  const slug = raw.toLowerCase();
  if (slug === "curated") return { kind: "redirect", pathname: "/curated" };
  if (!collections.some((collection) => collection.slug === slug)) {
    return { kind: "not-found" };
  }
  return { kind: "pass" };
}

/** Invalid order ids never render the order page, which would add a second robots meta. */
export function orderPathAction(
  pathname: string,
): { kind: "pass" } | { kind: "not-found" } {
  const match = pathname.match(/^\/orders\/([^/]+)\/?$/);
  if (!match) return { kind: "pass" };
  let raw: string;
  try {
    raw = decodeURIComponent(match[1]);
  } catch {
    return { kind: "not-found" };
  }
  if (!z.uuid().safeParse(raw).success) return { kind: "not-found" };
  return { kind: "pass" };
}
