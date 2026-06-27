import { z } from "zod";
import { defineOp, resolveBudget, type Operation, type OpContext } from "./types.ts";
import {
  budgetArg,
  sinceDateArg,
  sinceKnowledgeArg,
  txnTypeArg,
  clearedArg,
  flagColorArg,
} from "./common.ts";
import { decimalToMilli } from "../util/money.ts";
import type { SaveTransaction, SaveTransactionWithId } from "../client/types.ts";

/** Convert a transaction's user-facing decimal amounts to integer milliunits. */
function toMilli<T extends Record<string, any>>(t: T): T {
  const out: Record<string, any> = { ...t };
  if (typeof out.amount === "number") out.amount = decimalToMilli(out.amount);
  if (Array.isArray(out.subtransactions)) {
    out.subtransactions = out.subtransactions.map((s: any) =>
      typeof s?.amount === "number" ? { ...s, amount: decimalToMilli(s.amount) } : s,
    );
  }
  return out as T;
}

const subtransaction = z.object({
  amount: z.number().describe("Amount in currency units"),
  payee_id: z.string().nullish(),
  payee_name: z.string().nullish(),
  category_id: z.string().nullish(),
  memo: z.string().nullish(),
});

const listFilterArgs = {
  budget: budgetArg,
  account_id: z.string().optional().describe("Filter to one account"),
  category_id: z.string().optional().describe("Filter to one category"),
  payee_id: z.string().optional().describe("Filter to one payee"),
  month: z.string().optional().describe("Filter to one budget month (YYYY-MM-DD)"),
  since_date: sinceDateArg,
  type: txnTypeArg,
  since_knowledge: sinceKnowledgeArg,
};

function listTransactions(ctx: OpContext, args: z.infer<z.ZodObject<typeof listFilterArgs>>) {
  const budget = resolveBudget(ctx, args.budget);
  const opts = { sinceDate: args.since_date, type: args.type, lastKnowledge: args.since_knowledge };
  if (args.account_id) return ctx.client.listTransactionsByAccount(budget, args.account_id, opts);
  if (args.category_id) return ctx.client.listTransactionsByCategory(budget, args.category_id, opts);
  if (args.payee_id) return ctx.client.listTransactionsByPayee(budget, args.payee_id, opts);
  if (args.month) return ctx.client.listTransactionsByMonth(budget, args.month, opts);
  return ctx.client.listTransactions(budget, opts);
}

export const transactionOps: Operation[] = [
  defineOp({
    id: "transactions.list",
    group: "transactions",
    command: "list",
    summary: "List transactions, optionally filtered by account/category/payee/month",
    args: z.object(listFilterArgs),
    run: listTransactions,
  }),

  defineOp({
    id: "transactions.get",
    group: "transactions",
    command: "get",
    summary: "Get a single transaction",
    args: z.object({
      transaction_id: z.string().describe("Transaction id"),
      budget: budgetArg,
    }),
    positionals: ["transaction_id"],
    run(ctx, args) {
      return ctx.client.getTransaction(resolveBudget(ctx, args.budget), args.transaction_id);
    },
  }),

  defineOp({
    id: "transactions.create",
    group: "transactions",
    command: "create",
    summary: "Create a single transaction (amounts in currency units, e.g. -12.34)",
    mutates: true,
    args: z.object({
      account_id: z.string().describe("Account id"),
      date: z.string().describe("Transaction date (YYYY-MM-DD)"),
      amount: z.coerce.number().describe("Amount in currency units; negative for outflow"),
      payee_id: z.string().optional().describe("Existing payee id"),
      payee_name: z.string().optional().describe("Payee name (creates payee if new)"),
      category_id: z.string().optional().describe("Category id"),
      memo: z.string().optional().describe("Memo"),
      cleared: clearedArg,
      approved: z.boolean().optional().describe("Mark as approved"),
      flag_color: flagColorArg,
      import_id: z.string().optional().describe("Import id for dedupe"),
      subtransactions: z
        .array(subtransaction)
        .optional()
        .describe("Split into sub-transactions (JSON array)"),
      budget: budgetArg,
    }),
    run(ctx, args) {
      const { budget, ...rest } = args;
      return ctx.client.createTransaction(resolveBudget(ctx, budget), toMilli(rest) as SaveTransaction);
    },
  }),

  defineOp({
    id: "transactions.create-many",
    group: "transactions",
    command: "create-many",
    summary: "Create multiple transactions at once (JSON array)",
    mutates: true,
    args: z.object({
      transactions: z
        .array(z.record(z.any()))
        .describe("JSON array of transaction objects (amounts in currency units)"),
      budget: budgetArg,
    }),
    run(ctx, args) {
      return ctx.client.createTransactions(
        resolveBudget(ctx, args.budget),
        args.transactions.map((t) => toMilli(t)) as SaveTransaction[],
      );
    },
  }),

  defineOp({
    id: "transactions.update",
    group: "transactions",
    command: "update",
    summary: "Update a single transaction (only provided fields change)",
    mutates: true,
    args: z.object({
      transaction_id: z.string().describe("Transaction id"),
      account_id: z.string().optional(),
      date: z.string().optional().describe("Transaction date (YYYY-MM-DD)"),
      amount: z.coerce.number().optional().describe("Amount in currency units"),
      payee_id: z.string().optional(),
      payee_name: z.string().optional(),
      category_id: z.string().optional(),
      memo: z.string().optional(),
      cleared: clearedArg,
      approved: z.boolean().optional(),
      flag_color: flagColorArg,
      budget: budgetArg,
    }),
    positionals: ["transaction_id"],
    run(ctx, args) {
      const { budget, transaction_id, ...rest } = args;
      return ctx.client.updateTransaction(
        resolveBudget(ctx, budget),
        transaction_id,
        toMilli(rest),
      );
    },
  }),

  defineOp({
    id: "transactions.update-many",
    group: "transactions",
    command: "update-many",
    summary: "Update multiple transactions at once (JSON array; each needs an id)",
    mutates: true,
    args: z.object({
      transactions: z
        .array(z.record(z.any()))
        .describe("JSON array of transaction objects, each with an 'id'"),
      budget: budgetArg,
    }),
    run(ctx, args) {
      return ctx.client.updateTransactions(
        resolveBudget(ctx, args.budget),
        args.transactions.map((t) => toMilli(t)) as SaveTransactionWithId[],
      );
    },
  }),

  defineOp({
    id: "transactions.delete",
    group: "transactions",
    command: "delete",
    summary: "Delete a transaction",
    mutates: true,
    args: z.object({
      transaction_id: z.string().describe("Transaction id"),
      budget: budgetArg,
    }),
    positionals: ["transaction_id"],
    run(ctx, args) {
      return ctx.client.deleteTransaction(resolveBudget(ctx, args.budget), args.transaction_id);
    },
  }),

  defineOp({
    id: "transactions.import",
    group: "transactions",
    command: "import",
    summary: "Import transactions from linked accounts",
    mutates: true,
    args: z.object({ budget: budgetArg }),
    run(ctx, args) {
      return ctx.client.importTransactions(resolveBudget(ctx, args.budget));
    },
  }),
];
