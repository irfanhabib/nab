import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg } from "./common.ts";

export const payeeLocationOps: Operation[] = [
  defineOp({
    id: "payee-locations.list",
    group: "payee-locations",
    command: "list",
    summary: "List all payee locations",
    args: z.object({ budget: budgetArg }),
    run(ctx, args) {
      return ctx.client.listPayeeLocations(resolveBudget(ctx, args.budget));
    },
  }),

  defineOp({
    id: "payee-locations.get",
    group: "payee-locations",
    command: "get",
    summary: "Get a single payee location",
    args: z.object({
      payee_location_id: z.string().describe("Payee location id"),
      budget: budgetArg,
    }),
    positionals: ["payee_location_id"],
    run(ctx, args) {
      return ctx.client.getPayeeLocation(resolveBudget(ctx, args.budget), args.payee_location_id);
    },
  }),

  defineOp({
    id: "payee-locations.by-payee",
    group: "payee-locations",
    command: "by-payee",
    summary: "List locations for a specific payee",
    args: z.object({ payee_id: z.string().describe("Payee id"), budget: budgetArg }),
    positionals: ["payee_id"],
    run(ctx, args) {
      return ctx.client.listPayeeLocationsByPayee(resolveBudget(ctx, args.budget), args.payee_id);
    },
  }),
];
