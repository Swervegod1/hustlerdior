import { headers } from "next/headers";
import { publicHostFrom } from "./seo";

export async function requestPublicHost() {
  return publicHostFrom(await headers());
}
