import { AppError } from "../util/errors.ts";

export const DEFAULT_BASE_URL = "https://api.ynab.com/v1";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method: HttpMethod;
  path: string; // begins with "/", relative to the base URL
  token: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  baseUrl?: string;
  signal?: AbortSignal;
}

/** Information surfaced from the YNAB rate-limit error (200 req/hour/token). */
function rateLimitDetail(res: Response): string {
  const remaining = res.headers.get("x-rate-limit");
  return remaining ? ` (rate limit: ${remaining})` : "";
}

function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
  const url = new URL(base.replace(/\/$/, "") + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * Perform a single YNAB API request and return the unwrapped `data` payload.
 * YNAB wraps every success in `{ data: ... }` and every failure in
 * `{ error: { id, name, detail } }`; both are normalized here.
 */
export async function request<T = unknown>(opts: RequestOptions): Promise<T> {
  const url = buildUrl(opts.baseUrl ?? DEFAULT_BASE_URL, opts.path, opts.query);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.token}`,
    Accept: "application/json",
  };
  const init: RequestInit = { method: opts.method, headers, signal: opts.signal };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err: any) {
    throw new AppError({
      id: "network",
      name: "NetworkError",
      detail: `Request to ${url} failed: ${err?.message ?? err}`,
    });
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    if (!res.ok) {
      throw new AppError({
        id: String(res.status),
        name: "HttpError",
        detail: `${res.status} ${res.statusText}${rateLimitDetail(res)}: ${text.slice(0, 500)}`,
        status: res.status,
      });
    }
    throw new AppError({
      id: "parse",
      name: "ParseError",
      detail: `Could not parse response from ${url}`,
      status: res.status,
    });
  }

  if (!res.ok || json?.error) {
    const e = json?.error ?? {};
    throw new AppError({
      id: String(e.id ?? res.status),
      name: e.name ?? "HttpError",
      detail: (e.detail ?? `${res.status} ${res.statusText}`) + rateLimitDetail(res),
      status: res.status,
      exitCode: res.status === 429 ? 3 : 1,
    });
  }

  return (json?.data ?? json) as T;
}
