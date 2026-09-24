"use client";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

/** fetch() wrapper for our JSON API routes. Throws ClientApiError with the server's code/message. */
export async function api<T = unknown>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      method: rest.method ?? (json !== undefined ? "POST" : "GET"),
      headers: json !== undefined ? { "content-type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });
  } catch {
    throw new ClientApiError(0, "network", "Can't reach the server. Check your internet.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } }).error ?? {};
    const { code, message, ...extra } = err as Record<string, unknown>;
    throw new ClientApiError(res.status, String(code ?? "error"), String(message ?? "Something went wrong."), extra);
  }
  return data as T;
}
