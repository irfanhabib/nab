import { test, expect, describe } from "bun:test";
import { YnabClient } from "../src/client/ynab.ts";

const token = process.env.YNAB_API_KEY?.trim();
const live = token ? describe : describe.skip;

/**
 * Live, read-mostly tests against the real YNAB API. Skipped automatically when
 * YNAB_API_KEY is absent (e.g. forked-PR CI), so the suite stays green offline.
 * The one write test creates and immediately deletes a clearly-marked txn.
 */
live("live YNAB API", () => {
  const client = new YnabClient(token!);

  test("getUser returns a user id", async () => {
    const res = (await client.getUser()) as { user: { id: string } };
    expect(res.user.id).toBeTruthy();
  });

  test("listBudgets returns budgets", async () => {
    const res = (await client.listBudgets()) as { budgets: unknown[] };
    expect(Array.isArray(res.budgets)).toBe(true);
    expect(res.budgets.length).toBeGreaterThan(0);
  });

  test("create then delete a transaction (self-cleaning)", async () => {
    const accounts = (await client.listAccounts("last-used")) as {
      accounts: Array<{ id: string; closed: boolean; on_budget: boolean }>;
    };
    const acct = accounts.accounts.find((a) => !a.closed && a.on_budget);
    expect(acct, "needs an open on-budget account").toBeTruthy();

    const created = (await client.createTransaction("last-used", {
      account_id: acct!.id,
      date: "2026-01-01",
      amount: -1230, // milliunits = -1.23
      memo: "NAB-CLI integration test — auto-deleted",
      cleared: "uncleared",
    })) as { transaction: { id: string; amount: number } };
    expect(created.transaction.amount).toBe(-1230);

    const deleted = (await client.deleteTransaction("last-used", created.transaction.id)) as {
      transaction: { deleted: boolean };
    };
    expect(deleted.transaction.deleted).toBe(true);
  });
});
