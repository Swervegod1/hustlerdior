/** Public product path segment. The numeric id keeps renamed titles addressable. */
export function productSlug(name: string, id: number): string {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${id}`;
}
