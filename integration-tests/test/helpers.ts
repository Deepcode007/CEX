import { expect } from "bun:test";
import { HeadersInit } from "bun";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error?: string;
  data?: string;
};

/** Base URL of the running backend (same host/port as `env.PORT` in backend). */
export function e2eBaseUrl(): string {
  return (process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
}

export function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/** Meets backend SignupSchema (length, upper, lower, digit, special). */
export const e2ePassword = "E2e!test9";

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function jsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _raw: text };
  }
}

export function expectApiFailure(body: unknown): asserts body is ApiFailure {
  expect(isRecord(body)).toBe(true);
  const apiBody = body as ApiFailure;
  expect(apiBody.success).toBe(false);
  expect(typeof apiBody.error === "string" || typeof apiBody.data === "string").toBe(true);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function expectUuid(value: unknown): asserts value is string {
  expect(typeof value).toBe("string");
  expect(value as string).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}
