import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg, sinceKnowledgeArg } from "./common.ts";

export const budgetOps: Operation[] = [
  defineOp({
    id: "budgets.list",
    group: "budgets",
    command: "list",
    summary: "List all budgets",
    args: z.object({
      include_accounts: z
        .boolean()
        .optional()
        .describe("Include the list of budget accounts"),
    }),
    run(ctx, args) {
      return ctx.client.listBudgets(args.include_accounts);
    },
  }),

  defineOp({
    id: "budgets.get",
    group: "budgets",
    command: "get",
    summary: "Get a single budget with all entities (full export)",
    args: z.object({
      budget: budgetArg,
      since_knowledge: sinceKnowledgeArg,
    }),
    positionals: ["budget"],
    run(ctx, args) {
      return ctx.client.getBudget(resolveBudget(ctx, args.budget), args.since_knowledge);
    },
  }),

  defineOp({
    id: "budgets.settings",
    group: "budgets",
    command: "settings",
    summary: "Get a budget's settings (currency & number formats)",
    args: z.object({ budget: budgetArg }),
    positionals: ["budget"],
    run(ctx, args) {
      return ctx.client.getBudgetSettings(resolveBudget(ctx, args.budget));
    },
  }),
];
