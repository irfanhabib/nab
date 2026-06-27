import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg, sinceKnowledgeArg } from "./common.ts";
import { decimalToMilli } from "../util/money.ts";
import type { AccountType } from "../client/types.ts";

const accountType = z.enum([
  "checking",
  "savings",
  "cash",
  "creditCard",
  "lineOfCredit",
  "otherAsset",
  "otherLiability",
  "mortgage",
  "autoLoan",
  "studentLoan",
  "personalLoan",
  "medicalDebt",
  "otherDebt",
]);

export const accountOps: Operation[] = [
  defineOp({
    id: "accounts.list",
    group: "accounts",
    command: "list",
    summary: "List all accounts in a budget",
    args: z.object({ budget: budgetArg, since_knowledge: sinceKnowledgeArg }),
    run(ctx, args) {
      return ctx.client.listAccounts(resolveBudget(ctx, args.budget), args.since_knowledge);
    },
  }),

  defineOp({
    id: "accounts.get",
    group: "accounts",
    command: "get",
    summary: "Get a single account",
    args: z.object({ account_id: z.string().describe("Account id"), budget: budgetArg }),
    positionals: ["account_id"],
    run(ctx, args) {
      return ctx.client.getAccount(resolveBudget(ctx, args.budget), args.account_id);
    },
  }),

  defineOp({
    id: "accounts.create",
    group: "accounts",
    command: "create",
    summary: "Create a new account with a starting balance",
    mutates: true,
    args: z.object({
      name: z.string().describe("Account name"),
      type: accountType.describe("Account type"),
      balance: z.coerce.number().describe("Starting balance in currency units (e.g. 100.50)"),
      budget: budgetArg,
    }),
    run(ctx, args) {
      return ctx.client.createAccount(resolveBudget(ctx, args.budget), {
        name: args.name,
        type: args.type as AccountType,
        balance: decimalToMilli(args.balance),
      });
    },
  }),
];
