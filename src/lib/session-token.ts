import {
  createHmac,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
export function newSession(secret: string, now = Date.now()) {
  const payload = `${randomBytes(32).toString("hex")}.${now}`;
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}
export function validSession(value: string, secret: string, now = Date.now()) {
  if (!/^[a-f0-9]{64}\.\d{13}\.[a-f0-9]{64}$/.test(value)) return false;
  const [nonce, issued, signature] = value.split(".");
  const age = now - Number(issued);
  if (age < -60000 || age > MAX_AGE_MS) return false;
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    createHmac("sha256", secret).update(`${nonce}.${issued}`).digest(),
  );
}
export const sessionHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
