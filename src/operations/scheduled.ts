import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg, sinceKnowledgeArg, flagColorArg } from "./common.ts";
import { decimalToMilli } from "../util/money.ts";
import type { SaveScheduledTransaction } from "../client/types.ts";

const frequency = z
  .enum([
    "never",
    "daily",
    "weekly",
    "everyOtherWeek",
    "twiceAMonth",
    "every4Weeks",
    "monthly",
    "everyOtherMonth",
    "every3Months",
    "every4Months",
    "twiceAYear",
    "yearly",
    "everyOtherYear",
  ])
  .optional()
  .describe("Recurrence frequency");

export const scheduledOps: Operation[] = [
  defineOp({
    id: "scheduled.list",
    group: "scheduled",
    command: "list",
    summary: "List all scheduled transactions",
    args: z.object({ budget: budgetArg, since_knowledge: sinceKnowledgeArg }),
    run(ctx, args) {
      return ctx.client.listScheduledTransactions(
        resolveBudget(ctx, args.budget),
        args.since_knowledge,
      );
    },
  }),

  defineOp({
    id: "scheduled.get",
    group: "scheduled",
    command: "get",
    summary: "Get a single scheduled transaction",
    args: z.object({
      scheduled_transaction_id: z.string().describe("Scheduled transaction id"),
      budget: budgetArg,
    }),
    positionals: ["scheduled_transaction_id"],
    run(ctx, args) {
      return ctx.client.getScheduledTransaction(
        resolveBudget(ctx, args.budget),
        args.scheduled_transaction_id,
      );
    },
  }),

  defineOp({
    id: "scheduled.create",
    group: "scheduled",
    command: "create",
    summary: "Create a scheduled transaction",
    mutates: true,
    args: z.object({
      account_id: z.string().describe("Account id"),
      date: z.string().describe("First/next date (YYYY-MM-DD)"),
      amount: z.coerce.number().describe("Amount in currency units; negative for outflow"),
      payee_id: z.string().optional(),
      payee_name: z.string().optional(),
      category_id: z.string().optional(),
      memo: z.string().optional(),
      flag_color: flagColorArg,
      frequency,
      budget: budgetArg,
    }),
    run(ctx, args) {
      const { budget, amount, ...rest } = args;
      return ctx.client.createScheduledTransaction(resolveBudget(ctx, budget), {
        ...rest,
        amount: decimalToMilli(amount),
      } as SaveScheduledTransaction);
    },
  }),

  defineOp({
    id: "scheduled.update",
    group: "scheduled",
    command: "update",
    summary: "Update a scheduled transaction (only provided fields change)",
    mutates: true,
    args: z.object({
      scheduled_transaction_id: z.string().describe("Scheduled transaction id"),
      account_id: z.string().optional(),
      date: z.string().optional().describe("Next date (YYYY-MM-DD)"),
      amount: z.coerce.number().optional().describe("Amount in currency units"),
      payee_id: z.string().optional(),
      payee_name: z.string().optional(),
      category_id: z.string().optional(),
      memo: z.string().optional(),
      flag_color: flagColorArg,
      frequency,
      budget: budgetArg,
    }),
    positionals: ["scheduled_transaction_id"],
    run(ctx, args) {
      const { budget, scheduled_transaction_id, amount, ...rest } = args;
      const body: Partial<SaveScheduledTransaction> = { ...rest };
      if (typeof amount === "number") body.amount = decimalToMilli(amount);
      return ctx.client.updateScheduledTransaction(
        resolveBudget(ctx, budget),
        scheduled_transaction_id,
        body,
      );
    },
  }),

  defineOp({
    id: "scheduled.delete",
    group: "scheduled",
    command: "delete",
    summary: "Delete a scheduled transaction",
    mutates: true,
    args: z.object({
      scheduled_transaction_id: z.string().describe("Scheduled transaction id"),
      budget: budgetArg,
    }),
    positionals: ["scheduled_transaction_id"],
    run(ctx, args) {
      return ctx.client.deleteScheduledTransaction(
        resolveBudget(ctx, args.budget),
        args.scheduled_transaction_id,
      );
    },
  }),
];
