import type { Operation } from "./types.ts";
import { authOps } from "./auth.ts";
import { userOps } from "./user.ts";
import { budgetOps } from "./budgets.ts";
import { accountOps } from "./accounts.ts";
import { categoryOps } from "./categories.ts";
import { payeeOps } from "./payees.ts";
import { payeeLocationOps } from "./payee-locations.ts";
import { monthOps } from "./months.ts";
import { transactionOps } from "./transactions.ts";
import { scheduledOps } from "./scheduled.ts";
import { moneyMovementOps } from "./money-movements.ts";
import { rawOps } from "./raw.ts";

/** The complete, ordered list of operations exposed by both CLI and MCP. */
export const operations: Operation[] = [
  ...authOps,
  ...userOps,
  ...budgetOps,
  ...accountOps,
  ...categoryOps,
  ...payeeOps,
  ...payeeLocationOps,
  ...monthOps,
  ...transactionOps,
  ...scheduledOps,
  ...moneyMovementOps,
  ...rawOps,
];

/** Operations grouped by their top-level noun, preserving order. */
export function operationsByGroup(): Map<string, Operation[]> {
  const map = new Map<string, Operation[]>();
  for (const op of operations) {
    const list = map.get(op.group) ?? [];
    list.push(op);
    map.set(op.group, list);
  }
  return map;
}

export type { Operation } from "./types.ts";
