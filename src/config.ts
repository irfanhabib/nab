import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, readFile, writeFile, chmod, unlink } from "node:fs/promises";
import { AppError } from "./util/errors.ts";

export interface Config {
  token?: string;
  default_budget?: string;
}

/** Directory holding nab's config, honoring XDG_CONFIG_HOME. */
export function configDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.trim() ? xdg : join(homedir(), ".config");
  return join(base, "nab");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await readFile(configPath(), "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as Config) : {};
  } catch (err: any) {
    if (err?.code === "ENOENT") return {};
    throw new AppError({
      id: "config",
      name: "ConfigError",
      detail: `Could not read config at ${configPath()}: ${err.message}`,
    });
  }
}

/** Merge and persist config, writing the file with 0600 permissions. */
export async function saveConfig(patch: Partial<Config>): Promise<Config> {
  const current = await loadConfig();
  const next: Config = { ...current, ...patch };
  // Drop keys explicitly set to undefined so they don't linger in the file.
  for (const k of Object.keys(next) as (keyof Config)[]) {
    if (next[k] === undefined) delete next[k];
  }
  await mkdir(configDir(), { recursive: true });
  await writeFile(configPath(), JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
  await chmod(configPath(), 0o600).catch(() => {});
  return next;
}

export async function clearConfig(): Promise<void> {
  await unlink(configPath()).catch((err: any) => {
    if (err?.code !== "ENOENT") throw err;
  });
}

/**
 * Resolve the API token: the YNAB_API_KEY env var wins over the config file so
 * callers (CI, agents) can override without touching disk.
 */
export async function resolveToken(cfg?: Config): Promise<string> {
  const env = process.env.YNAB_API_KEY;
  if (env && env.trim()) return env.trim();
  const config = cfg ?? (await loadConfig());
  if (config.token && config.token.trim()) return config.token.trim();
  throw new AppError({
    id: "unauthorized",
    name: "NoToken",
    detail:
      "No YNAB token found. Run `nab auth login`, or set the YNAB_API_KEY environment variable. Create a Personal Access Token at https://app.ynab.com/settings/developer",
    exitCode: 2,
  });
}
