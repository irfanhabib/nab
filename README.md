# nab

A **feature-complete, LLM-optimized [YNAB](https://www.ynab.com) command-line client** — manage budgets, accounts, categories, payees, transactions, and scheduled transactions straight from your terminal, or expose the whole API to an AI agent as MCP tools.

[![CI](https://github.com/irfanhabib/nab/actions/workflows/ci.yml/badge.svg)](https://github.com/irfanhabib/nab/actions/workflows/ci.yml)

## Why "LLM-optimized"?

- **JSON by default.** Every command prints structured JSON to stdout. Use `--compact` for single-line output and `--fields a,b,c` to keep only the fields you need (fewer tokens).
- **Human/agent-friendly money.** YNAB stores amounts as integer *milliunits* (1000 = £1.00). `nab` shows decimals by default (`-12.34`) and accepts decimals on input; pass `--milliunits` to see raw values.
- **Structured errors.** Failures print `{ "error": { id, name, detail } }` to stderr with a non-zero exit code — never a silent failure.
- **One source of truth.** The CLI and the MCP server are generated from a single operation registry, so they always expose the same capabilities.
- **MCP server built in.** `nab mcp` runs a [Model Context Protocol](https://modelcontextprotocol.io) stdio server so Claude and other agents can call YNAB directly.

## Install

Requires [Bun](https://bun.sh) ≥ 1.1.

```bash
bun install -g @irfanhabib/nab
nab --help
```

<details>
<summary>Other ways to run it</summary>

From source (no install):

```bash
git clone https://github.com/irfanhabib/nab.git && cd nab
bun install
bun run src/index.ts --help
```

Compile a standalone, dependency-free binary:

```bash
bun run build        # produces ./nab
./nab --help
```

</details>

## Authentication

Create a Personal Access Token at <https://app.ynab.com/settings/developer>, then:

```bash
nab auth login                 # prompts for the token (hidden), validates, saves to ~/.config/nab/config.json (chmod 600)
nab auth status                # shows whether/where a token is configured
nab auth logout                # removes the config file
nab auth set-default-budget <budget_id>   # so you can omit --budget
```

The `YNAB_API_KEY` environment variable always overrides the config file — ideal for CI and agents.

## Usage

Most commands accept an optional `--budget <id>`. If omitted, `nab` uses your configured default budget, or the literal `last-used` budget.

```bash
nab user get                                   # whoami
nab budgets list --fields id,name              # list budgets, trimmed
nab budgets get                                # full export of the default budget
nab accounts list                              # accounts (decimal balances)
nab accounts create --name "Savings" --type savings --balance 1000.00

nab categories list
nab categories month-set current <category_id> --budgeted 250.00

nab transactions list --since-date 2026-06-01
nab transactions list --account-id <id>        # filter by account/category/payee/month
nab transactions create --account-id <id> --date 2026-06-27 --amount -12.34 --payee-name "Coffee" --memo "flat white"
nab transactions update <txn_id> --cleared cleared --approved
nab transactions delete <txn_id>

nab scheduled list
nab money-movements list --month current

nab raw GET /user                              # call any endpoint directly
nab raw POST /budgets/last-used/payees --data '{"payee":{"name":"New Payee"}}'
```

Global formatting flags work on any command: `--compact`, `--milliunits`, `--fields <list>`, `--base-url <url>`.

Run `nab <group> --help` or `nab <group> <command> --help` for the full, self-describing reference.

## Command coverage

`nab` maps **every** YNAB API endpoint:

| Group | Commands |
|---|---|
| `auth` | `login`, `status`, `logout`, `set-default-budget` |
| `user` | `get` |
| `budgets` | `list`, `get`, `settings` |
| `accounts` | `list`, `get`, `create` |
| `categories` | `list`, `get`, `create`, `update`, `group-create`, `group-update`, `month-get`, `month-set` |
| `payees` | `list`, `get`, `create`, `update` |
| `payee-locations` | `list`, `get`, `by-payee` |
| `months` | `list`, `get` |
| `transactions` | `list`, `get`, `create`, `create-many`, `update`, `update-many`, `delete`, `import` |
| `scheduled` | `list`, `get`, `create`, `update`, `delete` |
| `money-movements` | `list`, `groups` |
| `raw` | call any path/method directly |

List commands support delta sync via `--since-knowledge <n>` (echoing YNAB's `server_knowledge`).

## MCP server

Run `nab` as an MCP stdio server exposing every (non-auth) operation as a tool:

```bash
nab mcp
```

Register it with Claude Code:

```bash
claude mcp add nab -- nab mcp
```

Or add it to an MCP client config (e.g. Claude Desktop):

```json
{
  "mcpServers": {
    "nab": {
      "command": "nab",
      "args": ["mcp"],
      "env": { "YNAB_API_KEY": "your-token" }
    }
  }
}
```

Tools are named after operations (`budgets_list`, `transactions_create`, …); read-only operations are annotated as such.

## Development

```bash
bun run typecheck     # tsc --noEmit
bun test              # unit tests; live integration tests run only if YNAB_API_KEY is set
bun run build         # compile a standalone binary
```

Integration tests are read-only or self-cleaning (they create then immediately delete a clearly-marked test transaction) and skip automatically without a token.

## License

MIT
