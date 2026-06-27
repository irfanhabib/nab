import { Command, Option } from "commander";
import { z } from "zod";
import { operationsByGroup, type Operation } from "../operations/index.ts";
import { inspectField, type OpContext } from "../operations/types.ts";
import { YnabClient } from "../client/ynab.ts";
import { loadConfig, resolveToken } from "../config.ts";
import { printResult, printError, type OutputOptions } from "./output.ts";
import { toAppError } from "../util/errors.ts";

/** kebab flag name + camelCase attribute commander will store the value under. */
function flagNames(key: string): { flag: string; attr: string } {
  const flag = key.replace(/_/g, "-");
  const attr = flag.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return { flag, attr };
}

interface OptionMeta {
  key: string;
  attr: string;
  isJson: boolean;
}

/** Output/formatting options, attached to every leaf so they work anywhere on the line. */
function attachOutputOptions(cmd: Command): void {
  cmd
    .option("-c, --compact", "Minified single-line JSON output")
    .option("-m, --milliunits", "Show raw milliunit amounts instead of decimals")
    .option("-f, --fields <list>", "Comma-separated list of top-level fields to keep")
    .option("--base-url <url>", "Override the YNAB API base URL");
}

/** Attach an operation as a leaf subcommand under its group command. */
function addOperation(groupCmd: Command, op: Operation): void {
  const sub = groupCmd.command(op.command).description(op.summary);
  attachOutputOptions(sub);
  const shape = op.args.shape as Record<string, z.ZodTypeAny>;
  const positionals = new Set(op.positionals ?? []);
  const optionMetas: OptionMeta[] = [];

  // Positional arguments, in declared order.
  for (const key of op.positionals ?? []) {
    const info = inspectField(shape[key]!);
    const token = info.optional ? `[${key}]` : `<${key}>`;
    sub.argument(token, info.description ?? key);
  }

  // Everything else becomes an option.
  for (const [key, schema] of Object.entries(shape)) {
    if (positionals.has(key)) continue;
    const info = inspectField(schema);
    const { flag, attr } = flagNames(key);
    const isJson = info.kind === "json";
    let desc = info.description ?? "";
    if (info.kind === "json") desc += desc ? " (JSON)" : "JSON value";

    let option: Option;
    if (info.kind === "boolean") {
      option = new Option(`--${flag}`, desc);
    } else {
      option = new Option(`--${flag} <value>`, desc);
      if (info.enumValues) option.choices(info.enumValues);
      if (!info.optional && !info.hasDefault) option.makeOptionMandatory();
    }
    sub.addOption(option);
    optionMetas.push({ key, attr, isJson });
  }

  sub.action(async (...actionArgs) => {
    const command = actionArgs[actionArgs.length - 1] as Command;
    const positionalValues = command.processedArgs as unknown[];
    const options = command.opts();
    const global = command.optsWithGlobals() as Record<string, unknown>;

    try {
      // Assemble raw args from positionals + options.
      const raw: Record<string, unknown> = {};
      (op.positionals ?? []).forEach((key, i) => {
        if (positionalValues[i] !== undefined) raw[key] = positionalValues[i];
      });
      for (const m of optionMetas) {
        const val = options[m.attr];
        if (val === undefined) continue;
        raw[m.key] = m.isJson && typeof val === "string" ? JSON.parse(val) : val;
      }

      const parsed = op.args.parse(raw);
      const ctx = await buildContext(op, global);
      const result = await op.run(ctx, parsed);

      const out: OutputOptions = {
        compact: Boolean(global.compact),
        milliunits: Boolean(global.milliunits),
        fields:
          typeof global.fields === "string"
            ? (global.fields as string).split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
      };
      printResult(result, out);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const detail = err.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ");
        printError(toAppError(new Error(`Invalid arguments: ${detail}`)), Boolean(global.compact));
      } else {
        printError(toAppError(err), Boolean(global.compact));
      }
      process.exitCode = err instanceof Error && "exitCode" in err ? (err as any).exitCode : 1;
    }
  });
}

/** Build the run context: auth ops need no client; everything else does. */
async function buildContext(op: Operation, global: Record<string, unknown>): Promise<OpContext> {
  const cfg = await loadConfig();
  if (op.group === "auth") {
    return { client: undefined as unknown as YnabClient, defaultBudget: cfg.default_budget };
  }
  const token = await resolveToken(cfg);
  const baseUrl = typeof global.baseUrl === "string" ? global.baseUrl : undefined;
  return { client: new YnabClient(token, baseUrl), defaultBudget: cfg.default_budget };
}

/** Build the full nab CLI program from the operation registry. */
export function buildProgram(version: string): Command {
  const program = new Command();
  program
    .name("nab")
    .description(
      "A feature-complete, LLM-optimized YNAB CLI. Output is JSON; amounts are shown in currency units (use --milliunits for raw).",
    )
    .version(version, "-v, --version")
    .option("-c, --compact", "Minified single-line JSON output")
    .option("-m, --milliunits", "Show raw milliunit amounts instead of decimals")
    .option("-f, --fields <list>", "Comma-separated list of top-level fields to keep")
    .option("--base-url <url>", "Override the YNAB API base URL")
    .enablePositionalOptions()
    .showHelpAfterError();

  for (const [group, ops] of operationsByGroup()) {
    if (ops.every((o) => o.topLevel)) {
      // Top-level operations attach directly to the program (e.g. `nab raw ...`).
      for (const op of ops) addOperation(program, op);
      continue;
    }
    const groupCmd = program.command(group).description(`${group} operations`);
    for (const op of ops) addOperation(groupCmd, op);
  }

  // `nab mcp` is wired in the entrypoint to avoid importing the server eagerly.
  return program;
}
