import { checkoutConfigured, printfulConfigured } from "@/lib/env";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "hustlerdior",
      printful: printfulConfigured(),
      checkout: checkoutConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
