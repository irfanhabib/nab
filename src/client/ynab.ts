import { request, type HttpMethod } from "./http.ts";
import type {
  SaveAccount,
  SaveCategory,
  SaveCategoryGroup,
  SaveMonthCategory,
  SavePayee,
  SaveScheduledTransaction,
  SaveTransaction,
  SaveTransactionWithId,
} from "./types.ts";

const enc = encodeURIComponent;

/** Thin, fully-typed wrapper exposing one method per YNAB API endpoint. */
export class YnabClient {
  constructor(
    private readonly token: string,
    private readonly baseUrl?: string,
  ) {}

  private call<T = unknown>(
    method: HttpMethod,
    path: string,
    extra?: { query?: Record<string, unknown>; body?: unknown },
  ): Promise<T> {
    return request<T>({
      method,
      path,
      token: this.token,
      baseUrl: this.baseUrl,
      query: extra?.query as any,
      body: extra?.body,
    });
  }

  // ---- User ----
  getUser() {
    return this.call("GET", "/user");
  }

  // ---- Budgets ----
  listBudgets(includeAccounts?: boolean) {
    return this.call("GET", "/budgets", { query: { include_accounts: includeAccounts } });
  }
  getBudget(budget = "last-used", lastKnowledge?: number) {
    return this.call("GET", `/budgets/${enc(budget)}`, {
      query: { last_knowledge_of_server: lastKnowledge },
    });
  }
  getBudgetSettings(budget = "last-used") {
    return this.call("GET", `/budgets/${enc(budget)}/settings`);
  }

  // ---- Accounts ----
  listAccounts(budget = "last-used", lastKnowledge?: number) {
    return this.call("GET", `/budgets/${enc(budget)}/accounts`, {
      query: { last_knowledge_of_server: lastKnowledge },
    });
  }
  getAccount(budget: string, accountId: string) {
    return this.call("GET", `/budgets/${enc(budget)}/accounts/${enc(accountId)}`);
  }
  createAccount(budget: string, account: SaveAccount) {
    return this.call("POST", `/budgets/${enc(budget)}/accounts`, { body: { account } });
  }

  // ---- Categories ----
  listCategories(budget = "last-used", lastKnowledge?: number) {
    return this.call("GET", `/budgets/${enc(budget)}/categories`, {
      query: { last_knowledge_of_server: lastKnowledge },
    });
  }
  getCategory(budget: string, categoryId: string) {
    return this.call("GET", `/budgets/${enc(budget)}/categories/${enc(categoryId)}`);
  }
  createCategory(budget: string, category: SaveCategory) {
    return this.call("POST", `/budgets/${enc(budget)}/categories`, { body: { category } });
  }
  updateCategory(budget: string, categoryId: string, category: SaveCategory) {
    return this.call("PATCH", `/budgets/${enc(budget)}/categories/${enc(categoryId)}`, {
      body: { category },
    });
  }
  createCategoryGroup(budget: string, group: SaveCategoryGroup) {
    return this.call("POST", `/budgets/${enc(budget)}/category_groups`, {
      body: { category_group: group },
    });
  }
  updateCategoryGroup(budget: string, groupId: string, group: SaveCategoryGroup) {
    return this.call("PATCH", `/budgets/${enc(budget)}/category_groups/${enc(groupId)}`, {
      body: { category_group: group },
    });
  }
  getMonthCategory(budget: string, month: string, categoryId: string) {
    return this.call(
      "GET",
      `/budgets/${enc(budget)}/months/${enc(month)}/categories/${enc(categoryId)}`,
    );
  }
  updateMonthCategory(budget: string, month: string, categoryId: string, data: SaveMonthCategory) {
    return this.call(
      "PATCH",
      `/budgets/${enc(budget)}/months/${enc(month)}/categories/${enc(categoryId)}`,
      { body: { category: data } },
    );
  }

  // ---- Payees ----
  listPayees(budget = "last-used", lastKnowledge?: number) {
    return this.call("GET", `/budgets/${enc(budget)}/payees`, {
      query: { last_knowledge_of_server: lastKnowledge },
    });
  }
  getPayee(budget: string, payeeId: string) {
    return this.call("GET", `/budgets/${enc(budget)}/payees/${enc(payeeId)}`);
  }
  createPayee(budget: string, payee: SavePayee) {
    return this.call("POST", `/budgets/${enc(budget)}/payees`, { body: { payee } });
  }
  updatePayee(budget: string, payeeId: string, payee: SavePayee) {
    return this.call("PATCH", `/budgets/${enc(budget)}/payees/${enc(payeeId)}`, {
      body: { payee },
    });
  }

  // ---- Payee Locations ----
  listPayeeLocations(budget = "last-used") {
    return this.call("GET", `/budgets/${enc(budget)}/payee_locations`);
  }
  getPayeeLocation(budget: string, payeeLocationId: string) {
    return this.call("GET", `/budgets/${enc(budget)}/payee_locations/${enc(payeeLocationId)}`);
  }
  listPayeeLocationsByPayee(budget: string, payeeId: string) {
    return this.call("GET", `/budgets/${enc(budget)}/payees/${enc(payeeId)}/payee_locations`);
  }

  // ---- Months ----
  listMonths(budget = "last-used", lastKnowledge?: number) {
    return this.call("GET", `/budgets/${enc(budget)}/months`, {
      query: { last_knowledge_of_server: lastKnowledge },
    });
  }
  getMonth(budget: string, month: string) {
    return this.call("GET", `/budgets/${enc(budget)}/months/${enc(month)}`);
  }

  // ---- Money Movements (newer API) ----
  listMoneyMovements(budget = "last-used") {
    return this.call("GET", `/budgets/${enc(budget)}/money_movements`);
  }
  listMoneyMovementsByMonth(budget: string, month: string) {
    return this.call("GET", `/budgets/${enc(budget)}/months/${enc(month)}/money_movements`);
  }
  listMoneyMovementGroups(budget = "last-used") {
    return this.call("GET", `/budgets/${enc(budget)}/money_movement_groups`);
  }
  listMoneyMovementGroupsByMonth(budget: string, month: string) {
    return this.call("GET", `/budgets/${enc(budget)}/months/${enc(month)}/money_movement_groups`);
  }

  // ---- Transactions ----
  listTransactions(
    budget = "last-used",
    opts?: { sinceDate?: string; type?: string; lastKnowledge?: number },
  ) {
    return this.call("GET", `/budgets/${enc(budget)}/transactions`, {
      query: {
        since_date: opts?.sinceDate,
        type: opts?.type,
        last_knowledge_of_server: opts?.lastKnowledge,
      },
    });
  }
  listTransactionsByAccount(
    budget: string,
    accountId: string,
    opts?: { sinceDate?: string; type?: string; lastKnowledge?: number },
  ) {
    return this.call("GET", `/budgets/${enc(budget)}/accounts/${enc(accountId)}/transactions`, {
      query: {
        since_date: opts?.sinceDate,
        type: opts?.type,
        last_knowledge_of_server: opts?.lastKnowledge,
      },
    });
  }
  listTransactionsByCategory(
    budget: string,
    categoryId: string,
    opts?: { sinceDate?: string; type?: string; lastKnowledge?: number },
  ) {
    return this.call("GET", `/budgets/${enc(budget)}/categories/${enc(categoryId)}/transactions`, {
      query: {
        since_date: opts?.sinceDate,
        type: opts?.type,
        last_knowledge_of_server: opts?.lastKnowledge,
      },
    });
  }
  listTransactionsByPayee(
    budget: string,
    payeeId: string,
    opts?: { sinceDate?: string; type?: string; lastKnowledge?: number },
  ) {
    return this.call("GET", `/budgets/${enc(budget)}/payees/${enc(payeeId)}/transactions`, {
      query: {
        since_date: opts?.sinceDate,
        type: opts?.type,
        last_knowledge_of_server: opts?.lastKnowledge,
      },
    });
  }
  listTransactionsByMonth(
    budget: string,
    month: string,
    opts?: { sinceDate?: string; type?: string; lastKnowledge?: number },
  ) {
    return this.call("GET", `/budgets/${enc(budget)}/months/${enc(month)}/transactions`, {
      query: {
        since_date: opts?.sinceDate,
        type: opts?.type,
        last_knowledge_of_server: opts?.lastKnowledge,
      },
    });
  }
  getTransaction(budget: string, transactionId: string) {
    return this.call("GET", `/budgets/${enc(budget)}/transactions/${enc(transactionId)}`);
  }
  createTransaction(budget: string, transaction: SaveTransaction) {
    return this.call("POST", `/budgets/${enc(budget)}/transactions`, { body: { transaction } });
  }
  createTransactions(budget: string, transactions: SaveTransaction[]) {
    return this.call("POST", `/budgets/${enc(budget)}/transactions`, { body: { transactions } });
  }
  updateTransaction(budget: string, transactionId: string, transaction: Partial<SaveTransaction>) {
    return this.call("PUT", `/budgets/${enc(budget)}/transactions/${enc(transactionId)}`, {
      body: { transaction },
    });
  }
  updateTransactions(budget: string, transactions: SaveTransactionWithId[]) {
    return this.call("PATCH", `/budgets/${enc(budget)}/transactions`, { body: { transactions } });
  }
  deleteTransaction(budget: string, transactionId: string) {
    return this.call("DELETE", `/budgets/${enc(budget)}/transactions/${enc(transactionId)}`);
  }
  importTransactions(budget = "last-used") {
    return this.call("POST", `/budgets/${enc(budget)}/transactions/import`);
  }

  // ---- Scheduled Transactions ----
  listScheduledTransactions(budget = "last-used", lastKnowledge?: number) {
    return this.call("GET", `/budgets/${enc(budget)}/scheduled_transactions`, {
      query: { last_knowledge_of_server: lastKnowledge },
    });
  }
  getScheduledTransaction(budget: string, scheduledId: string) {
    return this.call(
      "GET",
      `/budgets/${enc(budget)}/scheduled_transactions/${enc(scheduledId)}`,
    );
  }
  createScheduledTransaction(budget: string, scheduled_transaction: SaveScheduledTransaction) {
    return this.call("POST", `/budgets/${enc(budget)}/scheduled_transactions`, {
      body: { scheduled_transaction },
    });
  }
  updateScheduledTransaction(
    budget: string,
    scheduledId: string,
    scheduled_transaction: Partial<SaveScheduledTransaction>,
  ) {
    return this.call(
      "PUT",
      `/budgets/${enc(budget)}/scheduled_transactions/${enc(scheduledId)}`,
      { body: { scheduled_transaction } },
    );
  }
  deleteScheduledTransaction(budget: string, scheduledId: string) {
    return this.call(
      "DELETE",
      `/budgets/${enc(budget)}/scheduled_transactions/${enc(scheduledId)}`,
    );
  }

  // ---- Raw passthrough ----
  raw(method: HttpMethod, path: string, opts?: { query?: Record<string, unknown>; body?: unknown }) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return this.call(method, normalized, opts);
  }
}
