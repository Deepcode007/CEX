import { beforeAll, describe, expect, test } from "bun:test";
import { authHeaders, e2eBaseUrl, e2ePassword, uniqueEmail } from "./helpers";

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _raw: text };
  }
}

/**
 * Requires the same env as production backend: DATABASE_URL, JWT_KEY, Redis, Prisma stocks (ETH, SOL, USD).
 * Order placement also needs the OrderBook engine consuming the Redis queue (otherwise expect 400 from engine).
 */
describe("CEX integration — session & limit orders (live backend)", () => {
  const base = e2eBaseUrl();

  let jwtReady = false;

  beforeAll(async () => {
    const email = uniqueEmail();
    const signup = await fetch(`${base}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: e2ePassword,
        name: "E2E Trader",
      }),
    });
    if (signup.status !== 201) {
      console.warn(`[e2e] signup probe: HTTP ${signup.status} — check DATABASE_URL and backend logs`);
      return;
    }
    const login = await fetch(`${base}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: e2ePassword }),
    });
    jwtReady = login.status === 200;
    if (!jwtReady) {
      const body = await safeJson(login);
      console.warn(
        `[e2e] login probe: HTTP ${login.status}. Ensure backend process has JWT_KEY set (jsonwebtoken). Body:`,
        body,
      );
    }
  });

  test("POST /signup then POST /login returns JWT", async () => {
    expect(jwtReady).toBe(true);

    const email = uniqueEmail();
    const signup = await fetch(`${base}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: e2ePassword,
        name: "E2E Trader",
      }),
    });
    expect(signup.status).toBe(201);
    const created = (await signup.json()) as { success?: boolean; data?: { user?: { id: string } } };
    expect(created.success).toBe(true);
    expect(created.data?.user?.id).toBeDefined();

    const login = await fetch(`${base}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: e2ePassword }),
    });
    expect(login.status).toBe(200);
    const session = (await login.json()) as { success?: boolean; data?: { token?: string } };
    expect(session.success).toBe(true);
    expect(typeof session.data?.token).toBe("string");
    expect(session.data!.token!.length).toBeGreaterThan(20);
  });

  test("POST /order limit ETH with JWT — 201 when engine OK, else 400 with error string", async () => {
    expect(jwtReady).toBe(true);

    const email = uniqueEmail();
    await fetch(`${base}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: e2ePassword,
        name: "E2E Order",
      }),
    });

    const login = await fetch(`${base}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: e2ePassword }),
    });
    const session = (await login.json()) as { data?: { token?: string } };
    const token = session.data?.token;
    expect(token).toBeDefined();

    const order = await fetch(`${base}/order`, {
      method: "POST",
      headers: authHeaders(token!),
      body: JSON.stringify({
        side: "buy",
        type: "limit",
        symbol: "ETH",
        price: 2500,
        quantity: 1,
      }),
    });

    const body = (await safeJson(order)) as { success?: boolean; error?: string; data?: unknown };
    if (order.status === 201) {
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    } else {
      expect(order.status).toBe(400);
      expect(body.success).toBe(false);
      expect(typeof body.error).toBe("string");
    }
  });

  test("POST /order rejects unknown symbol with 400", async () => {
    expect(jwtReady).toBe(true);

    const email = uniqueEmail();
    await fetch(`${base}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: e2ePassword,
        name: "E2E Bad Symbol",
      }),
    });
    const login = await fetch(`${base}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: e2ePassword }),
    });
    const token = ((await login.json()) as { data?: { token?: string } }).data?.token!;
    expect(token).toBeDefined();

    const res = await fetch(`${base}/order`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        side: "buy",
        type: "limit",
        symbol: "BTC",
        price: 1,
        quantity: 1,
      }),
    });
    expect(res.status).toBe(400);
  });
});
