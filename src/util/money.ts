/**
 * YNAB stores all monetary amounts as integer "milliunits": 1000 milliunits = 1
 * unit of the budget's currency (e.g. $1.00). These helpers convert between
 * milliunits and human/LLM-friendly decimal values.
 */

/** Convert integer milliunits to a decimal number (e.g. -12340 -> -12.34). */
export function milliToDecimal(milli: number): number {
  return milli / 1000;
}

/**
 * Convert a decimal amount (number or string like "-12.34") to integer
 * milliunits, rounding to the nearest milliunit to avoid float drift.
 */
export function decimalToMilli(value: number | string): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid amount: ${value}`);
  }
  return Math.round(n * 1000);
}

/**
 * Field names whose values are milliunits across the YNAB API. Used to
 * recursively humanize amounts in API responses unless --milliunits is set.
 */
export const MILLIUNIT_FIELDS: ReadonlySet<string> = new Set([
  "amount",
  "balance",
  "cleared_balance",
  "uncleared_balance",
  "budgeted",
  "activity",
  "income",
  "to_be_budgeted",
  "goal_target",
  "goal_overall_funded",
  "goal_overall_left",
  "goal_under_funded",
  "debt_original_balance",
]);

/**
 * Recursively convert milliunit fields in an API result to decimals. Returns a
 * new value; does not mutate the input. Leaves non-money fields untouched.
 */
export function humanizeAmounts<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => humanizeAmounts(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "number" && MILLIUNIT_FIELDS.has(k)) {
        out[k] = milliToDecimal(v);
      } else {
        out[k] = humanizeAmounts(v);
      }
    }
    return out as T;
  }
  return value;
}
