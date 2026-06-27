import { test, expect, describe, afterEach } from "bun:test";
import { request } from "../src/client/http.ts";
import { AppError } from "../src/util/errors.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mockFetch(handler: (url: string, init: RequestInit) => Response) {
  globalThis.fetch = (async (input: any, init: any) =>
    handler(String(input), init ?? {})) as typeof fetch;
}

describe("http request", () => {
  test("unwraps the data envelope and sets auth + query", async () => {
    let seenUrl = "";
    let seenAuth = "";
    mockFetch((url, init) => {
      seenUrl = url;
      seenAuth = (init.headers as Record<string, string>).Authorization ?? "";
      return new Response(JSON.stringify({ data: { ok: 1 } }), { status: 200 });
    });
    const data = await request({
      method: "GET",
      path: "/budgets",
      token: "tok",
      query: { include_accounts: true, skip: undefined },
    });
    expect(data).toEqual({ ok: 1 });
    expect(seenAuth).toBe("Bearer tok");
    expect(seenUrl).toBe("https://api.ynab.com/v1/budgets?include_accounts=true");
  });

  test("maps a YNAB error envelope to AppError", async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: { id: "404.1", name: "not_found", detail: "nope" } }), {
          status: 404,
        }),
    );
    const err = await request({ method: "GET", path: "/x", token: "t" }).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).id).toBe("404.1");
    expect((err as AppError).detail).toContain("nope");
    expect((err as AppError).status).toBe(404);
  });

  test("returns undefined on 204", async () => {
    mockFetch(() => new Response(null, { status: 204 }));
    const data = await request({ method: "DELETE", path: "/x", token: "t" });
    expect(data).toBeUndefined();
  });

  test("sends a JSON body when provided", async () => {
    let body = "";
    mockFetch((_url, init) => {
      body = init.body as string;
      return new Response(JSON.stringify({ data: {} }), { status: 200 });
    });
    await request({ method: "POST", path: "/x", token: "t", body: { a: 1 } });
    expect(JSON.parse(body)).toEqual({ a: 1 });
  });
});
