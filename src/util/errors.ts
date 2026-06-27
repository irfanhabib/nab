/**
 * A structured, user-facing error. Carries an optional YNAB error payload and
 * an exit code so the CLI can emit a consistent JSON error envelope on stderr.
 */
export class AppError extends Error {
  readonly id: string;
  readonly detail: string;
  readonly status?: number;
  readonly exitCode: number;

  constructor(opts: {
    id: string;
    name: string;
    detail: string;
    status?: number;
    exitCode?: number;
  }) {
    super(opts.detail || opts.name);
    this.name = opts.name;
    this.id = opts.id;
    this.detail = opts.detail;
    this.status = opts.status;
    this.exitCode = opts.exitCode ?? 1;
  }

  /** Serializable shape used for the `{ error: ... }` envelope. */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      detail: this.detail,
      ...(this.status !== undefined ? { status: this.status } : {}),
    };
  }
}

/** Normalize any thrown value into an AppError. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError({ id: "internal", name: err.name || "Error", detail: err.message });
  }
  return new AppError({ id: "internal", name: "Error", detail: String(err) });
}
