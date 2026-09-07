// Server-only client for calling the Google Apps Script Web App backend.
// NEVER import this from a "use client" component — GAS_SHARED_SECRET must stay server-side.
import "server-only";
import { cache } from "react";
import type { GasResponse } from "./types";

const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL as string;
const GAS_SHARED_SECRET = process.env.GAS_SHARED_SECRET as string;

if (!GAS_WEB_APP_URL || !GAS_SHARED_SECRET) {
  // Fail loudly at import time in dev so misconfiguration is obvious early.
  console.warn("[gas-server] GAS_WEB_APP_URL or GAS_SHARED_SECRET is not set. Set them in .env.local");
}

export class GasCallError extends Error {
  authError: boolean;
  constructor(message: string, authError = false) {
    super(message);
    this.name = "GasCallError";
    this.authError = authError;
  }
}

/**
 * Call an Apps Script backend action as the given caller email.
 * callerEmail must come from a verified server-side session (NextAuth), never from client input.
 */
export async function callGas<T>(
  action: string,
  callerEmail: string | null,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: GAS_SHARED_SECRET,
      action,
      callerEmail,
      payload,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new GasCallError(`GAS request failed with HTTP ${res.status}`);
  }

  const json = (await res.json()) as GasResponse<T>;
  if (!json.ok) {
    throw new GasCallError(json.error || "Unknown GAS error", !!json.authError);
  }
  return json.data as T;
}

/**
 * Same as callGas, but deduplicated within a single request/render via React.cache() —
 * two call sites asking for the identical (action, callerEmail, payload) within the same
 * request (e.g. a layout and its child page both fetching a student's academic summary)
 * only hit the GAS backend once. Scoped to a NEW request every time (React.cache's scope
 * is one render pass), so it never leaks stale data across separate page loads/users.
 *
 * Only use this for read-only, idempotent actions (listX/getX). Never wrap a mutation
 * with this — a write must always execute, even if a request happens to call it twice
 * with identical-looking arguments.
 */
export const callGasCached = cache(async function callGasCached<T>(
  action: string,
  callerEmail: string | null,
  payloadKey: string
): Promise<T> {
  return callGas<T>(action, callerEmail, JSON.parse(payloadKey));
});
