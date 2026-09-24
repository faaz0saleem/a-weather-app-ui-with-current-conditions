import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** A deliberate, user-facing API failure. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message ?? code);
  }
}

export const unauthorized = () => new ApiError(401, "unauthorized", "Please sign in first.");
export const forbidden = () => new ApiError(403, "forbidden", "You don't have access to this.");
export const notFound = (what = "Not found") => new ApiError(404, "not_found", what);
export const badRequest = (code: string, message?: string, extra?: Record<string, unknown>) =>
  new ApiError(400, code, message, extra);

/** Supabase/Postgres errors raised by our functions look like "WP:code". */
export function dbError(e: { message?: string; details?: string | null } | null | undefined): ApiError {
  const msg = e?.message ?? "db_error";
  const m = msg.match(/WP:([a-z0-9_]+)/);
  if (m) return new ApiError(409, m[1], msg, e?.details ? { detail: e.details } : undefined);
  return new ApiError(500, "db_error", msg);
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { "cache-control": "no-store", ...(init?.headers ?? {}) } });
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return json({ error: { code: e.code, message: e.message, ...e.extra } }, { status: e.status });
  }
  if (e instanceof ZodError) {
    return json({ error: { code: "invalid_input", message: e.issues[0]?.message ?? "Invalid input" } }, { status: 400 });
  }
  console.error("[api] unexpected error", e);
  return json({ error: { code: "server_error", message: "Something went wrong." } }, { status: 500 });
}

/** Wrap a route handler so thrown ApiErrors become JSON responses. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw badRequest("invalid_json", "Invalid request body.");
  }
}
