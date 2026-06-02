import { HeadersInit } from "bun";

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
