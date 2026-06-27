import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { operations } from "../operations/index.ts";
import type { OpContext } from "../operations/types.ts";
import { YnabClient } from "../client/ynab.ts";
import { loadConfig, resolveToken } from "../config.ts";
import { humanizeAmounts } from "../util/money.ts";
import { toAppError } from "../util/errors.ts";

/** MCP tool names must avoid dots; map "transactions.create" -> "transactions_create". */
function toolName(id: string): string {
  return id.replace(/\./g, "_");
}

/** Resolve a fresh client per call so the server can start before auth exists. */
async function context(): Promise<OpContext> {
  const cfg = await loadConfig();
  const token = await resolveToken(cfg);
  return { client: new YnabClient(token), defaultBudget: cfg.default_budget };
}

export async function startMcpServer(version: string): Promise<void> {
  const server = new McpServer({ name: "nab", version });

  for (const op of operations) {
    if (op.cliOnly) continue; // auth/config ops are CLI-only
    server.registerTool(
      toolName(op.id),
      {
        description: op.summary,
        inputSchema: op.args.shape,
        annotations: {
          readOnlyHint: !op.mutates,
          destructiveHint: op.command === "delete",
        },
      },
      async (args: unknown) => {
        try {
          const ctx = await context();
          const result = await op.run(ctx, args);
          const text = JSON.stringify(humanizeAmounts(result), null, 2);
          return { content: [{ type: "text" as const, text }] };
        } catch (err) {
          const e = toAppError(err);
          return {
            isError: true,
            content: [{ type: "text" as const, text: JSON.stringify({ error: e.toJSON() }, null, 2) }],
          };
        }
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep the process alive; the transport handles stdin/stdout.
}
