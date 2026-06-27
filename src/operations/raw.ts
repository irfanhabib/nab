import { z } from "zod";
import { defineOp, type Operation } from "./types.ts";
import type { HttpMethod } from "../client/http.ts";

export const rawOps: Operation[] = [
  defineOp({
    id: "raw.request",
    group: "raw",
    command: "raw",
    topLevel: true,
    summary:
      "Call any YNAB API endpoint directly (escape hatch for endpoints not yet mapped)",
    mutates: true,
    args: z.object({
      method: z
        .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
        .describe("HTTP method"),
      path: z.string().describe("Path under /v1, e.g. /budgets or /user"),
      data: z.record(z.any()).optional().describe("JSON request body"),
      query: z.record(z.any()).optional().describe("Query parameters as a JSON object"),
    }),
    positionals: ["method", "path"],
    run(ctx, args) {
      return ctx.client.raw(args.method as HttpMethod, args.path, {
        body: args.data,
        query: args.query as Record<string, unknown> | undefined,
      });
    },
  }),
];
