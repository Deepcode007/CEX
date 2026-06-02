import { describe, expect, test } from "bun:test";
import {
  type ApiSuccess,
  authHeaders,
  e2eBaseUrl,
  e2ePassword,
  expectApiFailure,
  expectUuid,
  isRecord,
  jsonBody,
  uniqueEmail,
} from "./helpers";
import { sleep, sleepSync } from "bun";

type Asset = "ETH" | "SOL" | "USD";
type OrderStatus = "open" | "filled" | "cancelled";

type Session = {
  token: string;
  userId: string;
  email: string;
};

type Wallet = {
  id: string;
  userid: string;
  asset: string;
  balance: number;
};

type Balance = {
  available: number;
  locked: number;
};

type PlacedOrder = {
  orderId: string;
  asset: Asset;
  quantity: number;
  filled_quantity: number;
  type: "limit" | "market";
  status: OrderStatus;
};

type DepthLevel = {
  price: number;
  total_quantity: number;
};

type Depth = {
  bids: DepthLevel[];
  asks: DepthLevel[];
};

type StoredOrder = {
  id: string;
  userId: string;
  asset: string;
  price: number | null;
  quantity: number;
  type: "limit" | "market";
  side: "taker" | "maker";
  filled_quantity: number;
  status: OrderStatus;
  createdAt: string;
};

type Fill = {
  id: string;
  userId: string;
  asset: string;
  price: number;
  quantity: number;
  type: "limit" | "market";
  side: "taker" | "maker";
  filled_quantity: number;
  status: OrderStatus;
  orderId: string;
  createdAt: string;
};

const jsonHeaders = { "Content-Type": "application/json" };

/**
 * These are true HTTP integration tests. They require backend, Redis, Postgres,
 * OrderBook, and the seeded Stock rows used by routes.ts and the engine.
 */
describe("CEX integration - route contracts, order book, and matching", () => {
  const base = e2eBaseUrl();

  test("signup and login return typed backend success and failure payloads", async () => {
    const email = uniqueEmail();

    const signup = await fetch(`${base}/signup`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password: e2ePassword, name: "E2E Session" }),
    });
    expect(signup.status).toBe(201);
    const created = await jsonBody(signup);
    assertSignup(created, email);

    const duplicate = await fetch(`${base}/signup`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password: e2ePassword, name: "E2E Session" }),
    });
    expect(duplicate.status).toBe(402);
    expectApiFailure(await jsonBody(duplicate));

    const login = await fetch(`${base}/login`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password: e2ePassword }),
    });
    expect(login.status).toBe(200);
    const loggedIn = await jsonBody(login);
    assertLogin(loggedIn);

    const badLogin = await fetch(`${base}/login`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password: "wrong-password" }),
    });
    expect(badLogin.status).toBe(401);
    expectApiFailure(await jsonBody(badLogin));
  });

  test("wallet, deposit, and balance routes expose typed backend/engine shapes", async () => {
    const trader = await createSession("E2E Wallets");

    const wallet = await createWallet(trader.token, "ETH");
    expect(wallet.userid).toBe(trader.userId);
    expect(wallet.asset).toBe("ETH");
    expect(wallet.balance).toBe(0);

    const duplicateWallet = await postJson(`${base}/wallet`, trader.token, { asset: "ETH" });
    expect(duplicateWallet.status).toBe(400);
    expectApiFailure(await jsonBody(duplicateWallet));

    const badWallet = await postJson(`${base}/wallet`, trader.token, { asset: "BTC" });
    expect(badWallet.status).toBe(400);
    expectApiFailure(await jsonBody(badWallet));

    const usdBalance = await deposit(trader.token, "USD", 10000);
    expect(usdBalance.available).toBeGreaterThanOrEqual(10000);
    expect(usdBalance.locked).toBe(0);

    const ethBalance = await deposit(trader.token, "ETH", 5);
    expect(ethBalance.available).toBeGreaterThanOrEqual(5);
    expect(ethBalance.locked).toBe(0);

    const invalidDeposit = await postJson(`${base}/wallet/add`, trader.token, { asset: "USD", delta: 0 });
    expect(invalidDeposit.status).toBe(400);
    expectApiFailure(await jsonBody(invalidDeposit));

    const realWorldBalance = await fetch(`${base}/balance`, {
      method: "GET",
      headers: authHeaders(trader.token),
    });
    expect(realWorldBalance.status).toBe(400);
    expectApiFailure(await jsonBody(realWorldBalance));
  });

  test("order routes validate schema, asset support, balance, cancel, and order list shape", async () => {
    const trader = await createSession("E2E Order Route");
    await createWallet(trader.token, "ETH");

    const invalidSchema = await postJson(`${base}/order`, trader.token, {
      side: "hold",
      type: "limit",
      symbol: "ETH",
      price: 10,
      quantity: 1,
    });
    expect(invalidSchema.status).toBe(400);
    expectApiFailure(await jsonBody(invalidSchema));

    const invalidAsset = await postJson(`${base}/order`, trader.token, {
      side: "buy",
      type: "limit",
      symbol: "BTC",
      price: 10,
      quantity: 1,
    });
    expect(invalidAsset.status).toBe(400);
    expectApiFailure(await jsonBody(invalidAsset));

    const insufficient = await postJson(`${base}/order`, trader.token, {
      side: "buy",
      type: "limit",
      symbol: "ETH",
      price: 10,
      quantity: 1,
    });
    expect(insufficient.status).toBe(400);
    expectApiFailure(await jsonBody(insufficient));

    await deposit(trader.token, "USD", 1000);
    const resting = await placeOrder(trader.token, {
      side: "buy",
      type: "limit",
      symbol: "ETH",
      price: 3,
      quantity: 2,
    });

    expect(resting.status).toBe("open");
    expect(resting.filled_quantity).toBe(0);

    const cancelled = await fetch(`${base}/order/${resting.orderId}`, {
      method: "DELETE",
      headers: authHeaders(trader.token),
    });
    const cancelBody = await jsonBody(cancelled);
    expect(cancelled.status).toBe(200);
    assertStringSuccess(cancelBody, "Order cancelled");

    const cancelAgain = await fetch(`${base}/order/${resting.orderId}`, {
      method: "DELETE",
      headers: authHeaders(trader.token),
    });
    expect(cancelAgain.status).toBe(400);
    expectApiFailure(await jsonBody(cancelAgain));

    const orders = await fetch(`${base}/orders`, {
      method: "GET",
      headers: authHeaders(trader.token),
    });
    expect(orders.status).toBe(200);
    const ordersBody = await jsonBody(orders);
    assertOrderList(ordersBody);
  });

  test("orderbook route returns typed OrderBook depth and reflects a resting limit order", async () => {
    const trader = await createSession("E2E Depth");
    await createWallet(trader.token, "SOL");
    const price = uniqueSmallPrice();
    const quantity = 4;
    await deposit(trader.token, "USD", price * quantity);
    const order = await placeOrder(trader.token, {
      side: "buy",
      type: "limit",
      symbol: "SOL",
      price,
      quantity,
    });
    expect(order.status).toBe("open");

    const depth = await getDepth(trader.token, "SOL");
    expect(depth.bids.some((level) => level.price === price && level.total_quantity >= 4)).toBe(true);

    const badDepth = await fetch(`${base}/orderbook/BTC`, {
      method: "GET",
      headers: authHeaders(trader.token),
    });
    expect(badDepth.status).toBe(400);
    expectApiFailure(await jsonBody(badDepth));
  });

  test("matching through HTTP fills maker and taker orders and updates OrderBook depth", async () => {
    const seller = await createSession("E2E Seller");
    const buyer = await createSession("E2E Buyer");
    const price = uniqueLargePrice();
    const quantity = 3;

    await createWallet(seller.token, "ETH");
    await createWallet(buyer.token, "ETH");
    await deposit(seller.token, "ETH", quantity);
    const ask = await placeOrder(seller.token, {
      side: "sell",
      type: "limit",
      symbol: "ETH",
      price,
      quantity,
    });
    expect(ask.status).toBe("open");

    let depth = await getDepth(seller.token, "ETH");
    expect(depth.asks.some((level) => level.price === price && level.total_quantity >= quantity)).toBe(true);

    await deposit(buyer.token, "USD", price * quantity);
    const bid = await placeOrder(buyer.token, {
      side: "buy",
      type: "limit",
      symbol: "ETH",
      price,
      quantity,
    });
    expect(bid.status).toBe("filled");
    expect(bid.filled_quantity).toBe(quantity);

    depth = await getDepth(buyer.token, "ETH");
    const matchedLevel = depth.asks.find((level) => level.price === price);
    expect(matchedLevel?.total_quantity ?? 0).toBe(0);

    const fills = await fetch(`${base}/fills/ETH`, {
      method: "GET",
      headers: authHeaders(buyer.token),
    });
    expect(fills.status).toBe(200);
    const fillsBody = await jsonBody(fills);
    assertFillList(fillsBody);

    const badFills = await fetch(`${base}/fills/BTC`, {
      method: "GET",
      headers: authHeaders(buyer.token),
    });
    expect(badFills.status).toBe(400);
    expectApiFailure(await jsonBody(badFills));
  });

  test("fails to place a buy order with insufficient USD balance", async () => {
    const trader = await createSession("E2E Insufficient Buy");
    await createWallet(trader.token, "SOL");
    // No USD deposited
    
    const res = await postJson(`${base}/order`, trader.token, {
      side: "buy",
      type: "limit",
      symbol: "SOL",
      price: 100,
      quantity: 1,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expectApiFailure(await jsonBody(res));
  });

  test("fails to place a sell order with insufficient asset balance", async () => {
    const trader = await createSession("E2E Insufficient Sell");
    await createWallet(trader.token, "SOL");
    // No SOL deposited
    
    const res = await postJson(`${base}/order`, trader.token, {
      side: "sell",
      type: "limit",
      symbol: "SOL",
      price: 100,
      quantity: 1,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expectApiFailure(await jsonBody(res));
  });

  test("fails to place an order with zero quantity or negative price", async () => {
    const trader = await createSession("E2E Bad Order");
    await createWallet(trader.token, "SOL");
    await deposit(trader.token, "USD", 1000);
    
    const resZeroQuantity = await postJson(`${base}/order`, trader.token, {
      side: "buy",
      type: "limit",
      symbol: "SOL",
      price: 100,
      quantity: 0,
    });
    expect(resZeroQuantity.status).toBeGreaterThanOrEqual(400);

    const resNegativePrice = await postJson(`${base}/order`, trader.token, {
      side: "buy",
      type: "limit",
      symbol: "SOL",
      price: -10,
      quantity: 1,
    });
    expect(resNegativePrice.status).toBeGreaterThanOrEqual(400);
  });

  test("limit order partially fills and leaves remaining quantity on the book", async () => {
    // clear the orderbook before running again
    const maker = await createSession("E2E Maker Partial");
    const taker = await createSession("E2E Taker Partial");
    const price = uniqueLargePrice();

    await createWallet(maker.token, "ETH");
    await createWallet(taker.token, "ETH");

    // Maker sells 5 ETH
    await deposit(maker.token, "ETH", 5);
    const ask = await placeOrder(maker.token, {
      side: "sell",
      type: "limit",
      symbol: "ETH",
      price,
      quantity: 5,
    });

    // Taker buys 3 ETH
    await deposit(taker.token, "USD", price * 3);
    const bid = await placeOrder(taker.token, {
      side: "buy",
      type: "limit",
      symbol: "ETH",
      price,
      quantity: 3,
    });
    expect(bid.status).toBe("filled");
    expect(bid.filled_quantity).toBe(3);

    // Maker order should be partially filled (filled_quantity = 3)
    // wait few seconds
    sleepSync(3000);
    const makerOrdersRes = await fetch(`${base}/orders`, { headers: authHeaders(maker.token) });
    const makerOrders = await jsonBody(makerOrdersRes);
    const makerOrder = (makerOrders as any).data.find((o: any) => o.id === ask.orderId);
    console.log("hehe ", makerOrder);
    expect(makerOrder.filled_quantity).toBe(3);
    expect(makerOrder.status).toBe("open");

    // Depth should show remaining 2 ETH at the price level
    const depth = await getDepth(maker.token, "ETH");
    expect(depth.asks.some((level) => level.price === price && level.total_quantity >= 2)).toBe(true);
  });

  async function createSession(name: string): Promise<Session> {
    const email = uniqueEmail();
    const signup = await fetch(`${base}/signup`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password: e2ePassword, name }),
    });
    expect(signup.status).toBe(201);
    const created = await jsonBody(signup);
    assertSignup(created, email);

    const login = await fetch(`${base}/login`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password: e2ePassword }),
    });
    expect(login.status).toBe(200);
    const body = await jsonBody(login);
    assertLogin(body);

    return { token: body.data.token, userId: created.data.user.id, email };
  }

  async function createWallet(token: string, asset: Asset): Promise<Wallet> {
    const res = await postJson(`${base}/wallet`, token, { asset });
    expect(res.status).toBe(201);

    const body = await jsonBody(res);
    assertWalletSuccess(body);
    return body.data;
  }

  async function deposit(token: string, asset: Asset, delta: number): Promise<Balance> {
    const res = await postJson(`${base}/wallet/add`, token, { asset, delta });
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    assertBalanceSuccess(body);
    return body.data;
  }

  async function placeOrder(
    token: string,
    order: { side: "buy" | "sell"; type: "limit"; symbol: Asset; price: number; quantity: number },
  ): Promise<PlacedOrder> {
    const res = await postJson(`${base}/order`, token, order);
    const body = await jsonBody(res);
    console.log("failing body ", " res ", res.status);
    console.log("the body ", body);
    expect(res.status).toBe(201);

    assertPlacedOrderSuccess(body, order.symbol, order.quantity, order.type);
    return body.data;
  }

  async function getDepth(token: string, symbol: Asset): Promise<Depth> {
    const res = await fetch(`${base}/orderbook/${symbol}`, {
      method: "GET",
      headers: authHeaders(token),
    });
    expect(res.status).toBe(200);

    const body = await jsonBody(res);
    assertDepthSuccess(body);
    return body.data;
  }

  function postJson(url: string, token: string, payload: unknown): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  }
});

function assertSignup(
  body: unknown,
  email: string,
): asserts body is ApiSuccess<{ user: { id: string; email: string; name: string }; wallet: Wallet }> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  const data = (body as { data?: unknown }).data;
  expect(isRecord(data)).toBe(true);
  const user = (data as { user?: unknown }).user;
  expect(isRecord(user)).toBe(true);
  expectUuid((user as { id?: unknown }).id);
  expect((user as { email?: unknown }).email).toBe(email);
  expect(typeof (user as { name?: unknown }).name).toBe("string");
  assertWallet((data as { wallet?: unknown }).wallet, "USD");
}

function assertLogin(body: unknown): asserts body is ApiSuccess<{ token: string }> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  const data = (body as { data?: unknown }).data;
  expect(isRecord(data)).toBe(true);
  expect(typeof (data as { token?: unknown }).token).toBe("string");
  expect(((data as { token: string }).token.match(/\./g) ?? []).length).toBe(2);
}

function assertWalletSuccess(body: unknown): asserts body is ApiSuccess<Wallet> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  assertWallet((body as { data?: unknown }).data);
}

function assertWallet(value: unknown, expectedAsset?: Asset): asserts value is Wallet {
  expect(isRecord(value)).toBe(true);
  expectUuid((value as { id?: unknown }).id);
  expectUuid((value as { userid?: unknown }).userid);
  expect(typeof (value as { asset?: unknown }).asset).toBe("string");
  if (expectedAsset) expect((value as { asset?: unknown }).asset).toBe(expectedAsset);
  expect(typeof (value as { balance?: unknown }).balance).toBe("number");
}

function assertBalanceSuccess(body: unknown): asserts body is ApiSuccess<Balance> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  const data = (body as { data?: unknown }).data;
  expect(isRecord(data)).toBe(true);
  expect(typeof (data as { available?: unknown }).available).toBe("number");
  expect(typeof (data as { locked?: unknown }).locked).toBe("number");
}

function assertPlacedOrderSuccess(
  body: unknown,
  asset: Asset,
  quantity: number,
  type: "limit" | "market",
): asserts body is ApiSuccess<PlacedOrder> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  const data = (body as { data?: unknown }).data;
  expect(isRecord(data)).toBe(true);
  expectUuid((data as { orderId?: unknown }).orderId);
  expect((data as { asset?: unknown }).asset).toBe(asset);
  expect((data as { quantity?: unknown }).quantity).toBe(quantity);
  expect((data as { type?: unknown }).type).toBe(type);
  expect(typeof (data as { filled_quantity?: unknown }).filled_quantity).toBe("number");
  expect(["open", "filled", "cancelled"]).toContain(String((data as { status?: unknown }).status));
}

function assertDepthSuccess(body: unknown): asserts body is ApiSuccess<Depth> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  const data = (body as { data?: unknown }).data;
  expect(isRecord(data)).toBe(true);
  assertDepthLevels((data as { bids?: unknown }).bids);
  assertDepthLevels((data as { asks?: unknown }).asks);
}

function assertDepthLevels(value: unknown): asserts value is DepthLevel[] {
  expect(Array.isArray(value)).toBe(true);
  for (const level of value as unknown[]) {
    expect(isRecord(level)).toBe(true);
    expect(typeof (level as { price?: unknown }).price).toBe("number");
    expect(typeof (level as { total_quantity?: unknown }).total_quantity).toBe("number");
  }
}

function assertStringSuccess(body: unknown, expected: string): asserts body is ApiSuccess<string> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  expect((body as { data?: unknown }).data).toBe(expected);
}

function assertOrderList(body: unknown): asserts body is ApiSuccess<StoredOrder[]> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  const data = (body as { data?: unknown }).data;
  expect(Array.isArray(data)).toBe(true);
  for (const order of data as unknown[]) {
    expect(isRecord(order)).toBe(true);
    expectUuid((order as { id?: unknown }).id);
    expectUuid((order as { userId?: unknown }).userId);
    expect(typeof (order as { asset?: unknown }).asset).toBe("string");
    expect(typeof (order as { quantity?: unknown }).quantity).toBe("number");
    expect(["limit", "market"]).toContain(String((order as { type?: unknown }).type));
    expect(["taker", "maker"]).toContain(String((order as { side?: unknown }).side));
    expect(["open", "filled", "cancelled"]).toContain(String((order as { status?: unknown }).status));
    expect(typeof (order as { filled_quantity?: unknown }).filled_quantity).toBe("number");
    expect(typeof (order as { createdAt?: unknown }).createdAt).toBe("string");
  }
}

function assertFillList(body: unknown): asserts body is ApiSuccess<Fill[]> {
  expect(isRecord(body)).toBe(true);
  expect((body as { success?: unknown }).success).toBe(true);
  const data = (body as { data?: unknown }).data;
  expect(Array.isArray(data)).toBe(true);
  for (const fill of data as unknown[]) {
    expect(isRecord(fill)).toBe(true);
    expectUuid((fill as { id?: unknown }).id);
    expectUuid((fill as { userId?: unknown }).userId);
    expectUuid((fill as { orderId?: unknown }).orderId);
    expect(typeof (fill as { asset?: unknown }).asset).toBe("string");
    expect(typeof (fill as { price?: unknown }).price).toBe("number");
    expect(typeof (fill as { quantity?: unknown }).quantity).toBe("number");
    expect(["limit", "market"]).toContain(String((fill as { type?: unknown }).type));
    expect(["taker", "maker"]).toContain(String((fill as { side?: unknown }).side));
    expect(["open", "filled", "cancelled"]).toContain(String((fill as { status?: unknown }).status));
    expect(typeof (fill as { filled_quantity?: unknown }).filled_quantity).toBe("number");
    expect(typeof (fill as { createdAt?: unknown }).createdAt).toBe("string");
  }
}

function uniqueSmallPrice(): number {
  return 11 + Math.floor(Math.random() * 500);
}

function uniqueLargePrice(): number {
  return 50000 + Math.floor(Math.random() * 50000);
}
