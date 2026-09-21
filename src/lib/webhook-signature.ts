import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPrintfulSignature(
  body: Buffer,
  signature: string | null,
  publicKey: string | null,
  expectedPublicKey: string,
  secretHex: string,
) {
  if (
    !signature ||
    !/^[0-9a-f]{64}$/i.test(signature) ||
    !/^(?:[0-9a-f]{2}){16,}$/i.test(secretHex)
  )
    return false;
  if (!publicKey || publicKey !== expectedPublicKey) return false;
  const expected = createHmac("sha256", Buffer.from(secretHex, "hex"))
    .update(body)
    .digest();
  const received = Buffer.from(signature, "hex");
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
