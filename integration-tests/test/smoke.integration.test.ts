import { describe, expect, test } from "bun:test";
import { e2eBaseUrl, expectApiFailure, jsonBody } from "./helpers";

/**
 * Public route smoke tests and auth boundary checks for every route mounted
 * after app.use(auth) in backend/src/routes/routes.ts.
 */
describe("CEX integration - public routes and auth boundary", () => {
  const base = e2eBaseUrl();

  test("GET /health returns ok after Redis ping", async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body).toEqual({ ok: true });
  });

  test("GET /stocks is public and returns the backend stocks payload", async () => {
    const res = await fetch(`${base}/stocks`);
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    expect(body).toEqual({ STOCKS: "stocks" });
  });

  test.each([
    ["POST", "/order"],
    ["DELETE", "/order/e2e-missing-order"],
    ["GET", "/orders"],
    ["GET", "/orderbook/ETH"],
    ["GET", "/fills/ETH"],
    ["GET", "/balance"],
    ["POST", "/wallet/add"],
    ["POST", "/wallet"],
  ] as const)("%s %s without Authorization returns typed 401 failure", async (method, path) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify({}),
    });

    expect(res.status).toBe(401);
    const body = await jsonBody(res);
    expectApiFailure(body);
    expect((body as { error?: string }).error).toBe("User unauthorised");
  });
});
