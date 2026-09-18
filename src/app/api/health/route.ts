export function GET() {
  return Response.json(
    { status: "ok", service: "hustlerdior" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
