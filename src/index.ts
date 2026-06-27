#!/usr/bin/env bun
import { buildProgram } from "./cli/build.ts";
import { printError } from "./cli/output.ts";
import { toAppError } from "./util/errors.ts";
import pkg from "../package.json" with { type: "json" };

async function main() {
  const program = buildProgram(pkg.version);

  program
    .command("mcp")
    .description("Run as an MCP (Model Context Protocol) stdio server for LLM agents")
    .action(async () => {
      const { startMcpServer } = await import("./mcp/server.ts");
      await startMcpServer(pkg.version);
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  printError(toAppError(err));
  process.exit(1);
});
