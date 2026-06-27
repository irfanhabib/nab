import { z } from "zod";

/** Optional budget selector shared by nearly every operation. */
export const budgetArg = z
  .string()
  .optional()
  .describe("Budget id (defaults to the configured default, or 'last-used')");

export const sinceKnowledgeArg = z.coerce
  .number()
  .int()
  .optional()
  .describe("Only return entities changed since this server_knowledge (delta sync)");

export const sinceDateArg = z
  .string()
  .optional()
  .describe("Only return transactions on/after this date (YYYY-MM-DD)");

export const txnTypeArg = z
  .enum(["uncategorized", "unapproved"])
  .optional()
  .describe("Filter transactions by type");

export const clearedArg = z
  .enum(["cleared", "uncleared", "reconciled"])
  .optional()
  .describe("Cleared status");

export const flagColorArg = z
  .enum(["red", "orange", "yellow", "green", "blue", "purple"])
  .optional()
  .describe("Flag color");
