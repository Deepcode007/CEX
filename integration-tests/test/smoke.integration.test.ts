import { describe, expect, test } from "bun:test";
import { e2eBaseUrl } from "./helpers";

/**
 * No database writes and no JWT — only needs backend + Redis.
 * Start: `cd backend && bun run src/server.ts` (with valid env including Redis).
 */
describe("CEX integration — smoke (live backend)", () => {
  const base = e2eBaseUrl();

  test("GET /health returns ok after Redis ping", async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
  });

  test("GET /stocks is public (no Authorization header)", async () => {
    const res = await fetch(`${base}/stocks`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  test("POST /order without Authorization returns 401", async () => {
    const res = await fetch(`${base}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        side: "buy",
        type: "limit",
        symbol: "ETH",
        price: 1,
        quantity: 1,
      }),
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { success?: boolean };
    expect(body.success).toBe(false);
  });
});
