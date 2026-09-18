import "server-only";
import { Pool, type PoolClient } from "pg";
import { HttpError } from "./http";

const globalDb = globalThis as unknown as { hdPool?: Pool };
export function database() {
  if (!process.env.DATABASE_URL)
    throw new HttpError(
      503,
      "This service is being prepared. Please try again later.",
    );
  // TLS settings belong in the connection URL/provider configuration. Never disable certificate validation.
  return (globalDb.hdPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
  }));
}
export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export const USAGE_SQL = `INSERT INTO hd_usage(bucket, window_id, used) VALUES ($1,$2,1)
  ON CONFLICT (bucket,window_id) DO UPDATE SET used=hd_usage.used+1 WHERE hd_usage.used < $3 RETURNING used`;

/** Atomic across replicas. Fail closed if the durable database is unavailable. */
export async function consumeUsage(
  limits: { bucket: string; window: string; limit: number }[],
) {
  await transaction(async (client) => {
    for (const item of limits) {
      if (!Number.isSafeInteger(item.limit) || item.limit < 1)
        throw new HttpError(503, "This service is being prepared.");
      const r = await client.query(USAGE_SQL, [
        item.bucket,
        item.window,
        item.limit,
      ]);
      if (!r.rowCount)
        throw new HttpError(
          429,
          "Today’s preview or checkout limit has been reached. Please try again later.",
        );
    }
  });
}
