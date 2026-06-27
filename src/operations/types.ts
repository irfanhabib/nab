import { z } from "zod";
import type { YnabClient } from "../client/ynab.ts";

export interface OpContext {
  client: YnabClient;
  /** Default budget id resolved from config, if any. */
  defaultBudget?: string;
}

/**
 * A single API operation, defined once and consumed by both the CLI builder and
 * the MCP server. The Zod `args` schema is the source of truth for validation,
 * CLI option/argument generation, and MCP JSON-schema generation.
 */
export interface Operation<A = any> {
  /** Dotted id, e.g. "transactions.create". */
  id: string;
  /** Top-level group / noun, e.g. "transactions". */
  group: string;
  /** Verb shown as the CLI subcommand, e.g. "create". */
  command: string;
  /** One-line description for --help and MCP tool description. */
  summary: string;
  /** Validated argument schema. */
  args: z.ZodObject<z.ZodRawShape>;
  /** Keys (in order) rendered as positional CLI arguments instead of options. */
  positionals?: string[];
  /** Whether the operation mutates data (used for MCP annotations). */
  mutates?: boolean;
  /** If true, exposed only on the CLI and skipped by the MCP server. */
  cliOnly?: boolean;
  /** If true, attached directly to the program (e.g. `nab raw ...`) not under a group. */
  topLevel?: boolean;
  run(ctx: OpContext, args: A): Promise<unknown>;
}

export function defineOp<S extends z.ZodObject<z.ZodRawShape>>(op: {
  id: string;
  group: string;
  command: string;
  summary: string;
  args: S;
  positionals?: string[];
  mutates?: boolean;
  cliOnly?: boolean;
  topLevel?: boolean;
  run(ctx: OpContext, args: z.infer<S>): Promise<unknown>;
}): Operation {
  return op as Operation;
}

/** Resolve which budget to use: explicit arg > configured default > "last-used". */
export function resolveBudget(ctx: OpContext, budget?: string): string {
  return budget || ctx.defaultBudget || "last-used";
}

export type FieldKind = "string" | "number" | "boolean" | "enum" | "json";

export interface FieldInfo {
  base: z.ZodTypeAny;
  kind: FieldKind;
  optional: boolean;
  hasDefault: boolean;
  default?: unknown;
  description?: string;
  enumValues?: string[];
}

/** Peel Optional/Nullable/Default/Effects wrappers to classify a Zod field. */
export function inspectField(schema: z.ZodTypeAny): FieldInfo {
  let optional = false;
  let hasDefault = false;
  let def: unknown;
  let description: string | undefined = schema.description;
  let cur: z.ZodTypeAny = schema;

  // Peel wrappers.
  for (;;) {
    const tn = (cur._def as any).typeName as string;
    description = description ?? cur.description;
    if (tn === "ZodOptional") {
      optional = true;
      cur = (cur._def as any).innerType;
    } else if (tn === "ZodNullable") {
      cur = (cur._def as any).innerType;
    } else if (tn === "ZodDefault") {
      optional = true;
      hasDefault = true;
      def = (cur._def as any).defaultValue();
      cur = (cur._def as any).innerType;
    } else if (tn === "ZodEffects") {
      cur = (cur._def as any).schema;
    } else {
      break;
    }
  }
  description = description ?? cur.description;

  const tn = (cur._def as any).typeName as string;
  let kind: FieldKind = "string";
  let enumValues: string[] | undefined;
  switch (tn) {
    case "ZodNumber":
      kind = "number";
      break;
    case "ZodBoolean":
      kind = "boolean";
      break;
    case "ZodEnum":
      kind = "enum";
      enumValues = (cur._def as any).values as string[];
      break;
    case "ZodNativeEnum":
      kind = "enum";
      enumValues = Object.values((cur._def as any).values) as string[];
      break;
    case "ZodArray":
    case "ZodObject":
    case "ZodRecord":
    case "ZodAny":
    case "ZodUnknown":
      kind = "json";
      break;
    default:
      kind = "string";
  }

  return { base: cur, kind, optional, hasDefault, default: def, description, enumValues };
}
