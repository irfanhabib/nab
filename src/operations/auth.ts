import { z } from "zod";
import { defineOp, type Operation } from "./types.ts";
import { loadConfig, saveConfig, clearConfig, configPath } from "../config.ts";
import { promptHidden } from "../util/prompt.ts";
import { YnabClient } from "../client/ynab.ts";
import { AppError } from "../util/errors.ts";

export const authOps: Operation[] = [
  defineOp({
    id: "auth.login",
    group: "auth",
    command: "login",
    summary: "Save a YNAB Personal Access Token to the config file",
    cliOnly: true,
    mutates: true,
    args: z.object({
      token: z
        .string()
        .optional()
        .describe("Personal Access Token (prompted securely if omitted)"),
    }),
    async run(_ctx, args) {
      let token = args.token?.trim();
      if (!token) {
        token = await promptHidden("YNAB Personal Access Token: ");
      }
      if (!token) {
        throw new AppError({ id: "auth", name: "NoToken", detail: "No token provided." });
      }
      // Validate the token by hitting /user before persisting it.
      const user = (await new YnabClient(token).getUser()) as { user?: { id: string } };
      await saveConfig({ token });
      return {
        status: "logged in",
        config: configPath(),
        user_id: user?.user?.id,
      };
    },
  }),

  defineOp({
    id: "auth.status",
    group: "auth",
    command: "status",
    summary: "Show whether a token is configured and where it comes from",
    cliOnly: true,
    args: z.object({}),
    async run() {
      const cfg = await loadConfig();
      const envSet = Boolean(process.env.YNAB_API_KEY?.trim());
      const fileSet = Boolean(cfg.token?.trim());
      return {
        authenticated: envSet || fileSet,
        source: envSet ? "env:YNAB_API_KEY" : fileSet ? "config" : "none",
        config: configPath(),
        default_budget: cfg.default_budget ?? null,
      };
    },
  }),

  defineOp({
    id: "auth.logout",
    group: "auth",
    command: "logout",
    summary: "Remove the saved config file (token + default budget)",
    cliOnly: true,
    mutates: true,
    args: z.object({}),
    async run() {
      await clearConfig();
      return { status: "logged out", removed: configPath() };
    },
  }),

  defineOp({
    id: "auth.set-default-budget",
    group: "auth",
    command: "set-default-budget",
    summary: "Persist a default budget id so --budget can be omitted",
    cliOnly: true,
    mutates: true,
    args: z.object({
      budget_id: z.string().describe("Budget id to use as the default"),
    }),
    positionals: ["budget_id"],
    async run(_ctx, args) {
      const cfg = await saveConfig({ default_budget: args.budget_id });
      return { status: "default budget set", default_budget: cfg.default_budget };
    },
  }),
];
