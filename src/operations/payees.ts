import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg, sinceKnowledgeArg } from "./common.ts";

export const payeeOps: Operation[] = [
  defineOp({
    id: "payees.list",
    group: "payees",
    command: "list",
    summary: "List all payees",
    args: z.object({ budget: budgetArg, since_knowledge: sinceKnowledgeArg }),
    run(ctx, args) {
      return ctx.client.listPayees(resolveBudget(ctx, args.budget), args.since_knowledge);
    },
  }),

  defineOp({
    id: "payees.get",
    group: "payees",
    command: "get",
    summary: "Get a single payee",
    args: z.object({ payee_id: z.string().describe("Payee id"), budget: budgetArg }),
    positionals: ["payee_id"],
    run(ctx, args) {
      return ctx.client.getPayee(resolveBudget(ctx, args.budget), args.payee_id);
    },
  }),

  defineOp({
    id: "payees.create",
    group: "payees",
    command: "create",
    summary: "Create a new payee",
    mutates: true,
    args: z.object({ name: z.string().describe("Payee name"), budget: budgetArg }),
    run(ctx, args) {
      return ctx.client.createPayee(resolveBudget(ctx, args.budget), { name: args.name });
    },
  }),

  defineOp({
    id: "payees.update",
    group: "payees",
    command: "update",
    summary: "Rename a payee",
    mutates: true,
    args: z.object({
      payee_id: z.string().describe("Payee id"),
      name: z.string().describe("New payee name"),
      budget: budgetArg,
    }),
    positionals: ["payee_id"],
    run(ctx, args) {
      return ctx.client.updatePayee(resolveBudget(ctx, args.budget), args.payee_id, {
        name: args.name,
      });
    },
  }),
];
