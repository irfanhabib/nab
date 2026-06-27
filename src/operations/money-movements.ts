import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg } from "./common.ts";

export const moneyMovementOps: Operation[] = [
  defineOp({
    id: "money-movements.list",
    group: "money-movements",
    command: "list",
    summary: "List money movements (optionally for a single month)",
    args: z.object({
      budget: budgetArg,
      month: z.string().optional().describe("Limit to a budget month (YYYY-MM-DD)"),
    }),
    run(ctx, args) {
      const budget = resolveBudget(ctx, args.budget);
      return args.month
        ? ctx.client.listMoneyMovementsByMonth(budget, args.month)
        : ctx.client.listMoneyMovements(budget);
    },
  }),

  defineOp({
    id: "money-movements.groups",
    group: "money-movements",
    command: "groups",
    summary: "List money movement groups (optionally for a single month)",
    args: z.object({
      budget: budgetArg,
      month: z.string().optional().describe("Limit to a budget month (YYYY-MM-DD)"),
    }),
    run(ctx, args) {
      const budget = resolveBudget(ctx, args.budget);
      return args.month
        ? ctx.client.listMoneyMovementGroupsByMonth(budget, args.month)
        : ctx.client.listMoneyMovementGroups(budget);
    },
  }),
];
