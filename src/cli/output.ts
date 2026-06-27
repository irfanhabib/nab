import { humanizeAmounts } from "../util/money.ts";
import type { AppError } from "../util/errors.ts";

export interface OutputOptions {
  compact?: boolean;
  milliunits?: boolean;
  fields?: string[];
}

/** Keep only the requested top-level fields from an object or array of objects. */
function pickFields(value: unknown, fields: string[]): unknown {
  const pick = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return obj;
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      if (f in (obj as Record<string, unknown>)) out[f] = (obj as Record<string, unknown>)[f];
    }
    return out;
  };
  if (Array.isArray(value)) return value.map(pick);
  // If the payload wraps a single array property (e.g. { transactions: [...] }),
  // apply field selection to that array's items for convenience.
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const arr = entries.find(([, v]) => Array.isArray(v));
    if (arr) return { [arr[0]]: (arr[1] as unknown[]).map(pick) };
    return pick(value);
  }
  return value;
}

/** Serialize a successful result to the configured shape and write to stdout. */
export function printResult(result: unknown, opts: OutputOptions): void {
  let value = opts.milliunits ? result : humanizeAmounts(result);
  if (opts.fields && opts.fields.length) value = pickFields(value, opts.fields);
  const json = opts.compact ? JSON.stringify(value) : JSON.stringify(value, null, 2);
  process.stdout.write(json + "\n");
}

/** Serialize an error to a consistent envelope on stderr. */
export function printError(err: AppError, compact?: boolean): void {
  const envelope = { error: err.toJSON() };
  const json = compact ? JSON.stringify(envelope) : JSON.stringify(envelope, null, 2);
  process.stderr.write(json + "\n");
}
