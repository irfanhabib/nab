/**
 * YNAB API entity and request-body types. Monetary fields are integer
 * milliunits as returned by the API (humanized for display elsewhere).
 * Not every nested field is enumerated; unknown extras pass through.
 */

export type AccountType =
  | "checking"
  | "savings"
  | "cash"
  | "creditCard"
  | "lineOfCredit"
  | "otherAsset"
  | "otherLiability"
  | "mortgage"
  | "autoLoan"
  | "studentLoan"
  | "personalLoan"
  | "medicalDebt"
  | "otherDebt";

export type ClearedStatus = "cleared" | "uncleared" | "reconciled";
export type FlagColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple" | null;
export type TransactionType = "uncategorized" | "unapproved";

export interface User {
  id: string;
}

export interface BudgetSummary {
  id: string;
  name: string;
  last_modified_on?: string;
  first_month?: string;
  last_month?: string;
  currency_format?: CurrencyFormat | null;
  [k: string]: unknown;
}

export interface CurrencyFormat {
  iso_code: string;
  example_format: string;
  decimal_digits: number;
  decimal_separator: string;
  symbol_first: boolean;
  group_separator: string;
  currency_symbol: string;
  display_symbol: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  on_budget: boolean;
  closed: boolean;
  note?: string | null;
  balance: number;
  cleared_balance: number;
  uncleared_balance: number;
  transfer_payee_id?: string | null;
  deleted: boolean;
  [k: string]: unknown;
}

export interface SaveAccount {
  name: string;
  type: AccountType;
  balance: number; // milliunits
}

export interface Category {
  id: string;
  category_group_id: string;
  name: string;
  hidden: boolean;
  note?: string | null;
  budgeted: number;
  activity: number;
  balance: number;
  goal_type?: string | null;
  deleted: boolean;
  [k: string]: unknown;
}

export interface SaveCategory {
  name?: string;
  note?: string | null;
  category_group_id?: string;
}

export interface SaveMonthCategory {
  budgeted: number; // milliunits
}

export interface SaveCategoryGroup {
  name: string;
}

export interface Payee {
  id: string;
  name: string;
  transfer_account_id?: string | null;
  deleted: boolean;
  [k: string]: unknown;
}

export interface SavePayee {
  name: string;
}

export interface PayeeLocation {
  id: string;
  payee_id: string;
  latitude: string;
  longitude: string;
  deleted: boolean;
}

export interface SubTransaction {
  amount: number;
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
}

export interface SaveTransaction {
  account_id: string;
  date: string; // ISO date
  amount: number; // milliunits
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
  cleared?: ClearedStatus;
  approved?: boolean;
  flag_color?: FlagColor;
  import_id?: string | null;
  subtransactions?: SubTransaction[];
}

export interface SaveTransactionWithId extends Partial<SaveTransaction> {
  id: string;
}

export interface TransactionDetail extends SaveTransaction {
  id: string;
  deleted: boolean;
  [k: string]: unknown;
}

export interface SaveScheduledTransaction {
  account_id: string;
  date: string;
  amount: number;
  payee_id?: string | null;
  payee_name?: string | null;
  category_id?: string | null;
  memo?: string | null;
  flag_color?: FlagColor;
  frequency?: string;
}
