import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg, sinceKnowledgeArg } from "./common.ts";

export const monthOps: Operation[] = [
  defineOp({
    id: "months.list",
    group: "months",
    command: "list",
    summary: "List all budget months",
    args: z.object({ budget: budgetArg, since_knowledge: sinceKnowledgeArg }),
    run(ctx, args) {
      return ctx.client.listMonths(resolveBudget(ctx, args.budget), args.since_knowledge);
    },
  }),

  defineOp({
    id: "months.get",
    group: "months",
    command: "get",
    summary: "Get a single budget month",
    args: z.object({
      month: z.string().describe("Budget month (YYYY-MM-DD) or 'current'"),
      budget: budgetArg,
    }),
    positionals: ["month"],
    run(ctx, args) {
      return ctx.client.getMonth(resolveBudget(ctx, args.budget), args.month);
    },
  }),
];
