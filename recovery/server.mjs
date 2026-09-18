import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("./index.html", import.meta.url));
const server = createServer((_request, response) => {
  response.writeHead(503, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Retry-After": "3600",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  });
  response.end(page);
});
server.listen(
  Number(process.env.PORT || 3000),
  process.env.HOSTNAME || "0.0.0.0",
);
