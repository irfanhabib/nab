import { z } from "zod";
import { defineOp, resolveBudget, type Operation } from "./types.ts";
import { budgetArg, sinceKnowledgeArg } from "./common.ts";
import { decimalToMilli } from "../util/money.ts";

export const categoryOps: Operation[] = [
  defineOp({
    id: "categories.list",
    group: "categories",
    command: "list",
    summary: "List categories grouped by category group",
    args: z.object({ budget: budgetArg, since_knowledge: sinceKnowledgeArg }),
    run(ctx, args) {
      return ctx.client.listCategories(resolveBudget(ctx, args.budget), args.since_knowledge);
    },
  }),

  defineOp({
    id: "categories.get",
    group: "categories",
    command: "get",
    summary: "Get a single category",
    args: z.object({ category_id: z.string().describe("Category id"), budget: budgetArg }),
    positionals: ["category_id"],
    run(ctx, args) {
      return ctx.client.getCategory(resolveBudget(ctx, args.budget), args.category_id);
    },
  }),

  defineOp({
    id: "categories.create",
    group: "categories",
    command: "create",
    summary: "Create a new category in a category group",
    mutates: true,
    args: z.object({
      name: z.string().describe("Category name"),
      category_group_id: z.string().describe("Parent category group id"),
      note: z.string().optional().describe("Optional note"),
      budget: budgetArg,
    }),
    run(ctx, args) {
      return ctx.client.createCategory(resolveBudget(ctx, args.budget), {
        name: args.name,
        category_group_id: args.category_group_id,
        note: args.note,
      });
    },
  }),

  defineOp({
    id: "categories.update",
    group: "categories",
    command: "update",
    summary: "Update a category's name, note, or group",
    mutates: true,
    args: z.object({
      category_id: z.string().describe("Category id"),
      name: z.string().optional().describe("New name"),
      note: z.string().optional().describe("New note"),
      category_group_id: z.string().optional().describe("Move to this category group id"),
      budget: budgetArg,
    }),
    positionals: ["category_id"],
    run(ctx, args) {
      return ctx.client.updateCategory(resolveBudget(ctx, args.budget), args.category_id, {
        name: args.name,
        note: args.note,
        category_group_id: args.category_group_id,
      });
    },
  }),

  defineOp({
    id: "categories.group-create",
    group: "categories",
    command: "group-create",
    summary: "Create a new category group",
    mutates: true,
    args: z.object({
      name: z.string().describe("Category group name"),
      budget: budgetArg,
    }),
    run(ctx, args) {
      return ctx.client.createCategoryGroup(resolveBudget(ctx, args.budget), { name: args.name });
    },
  }),

  defineOp({
    id: "categories.group-update",
    group: "categories",
    command: "group-update",
    summary: "Update a category group's name",
    mutates: true,
    args: z.object({
      category_group_id: z.string().describe("Category group id"),
      name: z.string().describe("New name"),
      budget: budgetArg,
    }),
    positionals: ["category_group_id"],
    run(ctx, args) {
      return ctx.client.updateCategoryGroup(resolveBudget(ctx, args.budget), args.category_group_id, {
        name: args.name,
      });
    },
  }),

  defineOp({
    id: "categories.month-get",
    group: "categories",
    command: "month-get",
    summary: "Get a category's data for a specific month",
    args: z.object({
      month: z.string().describe("Budget month (YYYY-MM-DD) or 'current'"),
      category_id: z.string().describe("Category id"),
      budget: budgetArg,
    }),
    positionals: ["month", "category_id"],
    run(ctx, args) {
      return ctx.client.getMonthCategory(
        resolveBudget(ctx, args.budget),
        args.month,
        args.category_id,
      );
    },
  }),

  defineOp({
    id: "categories.month-set",
    group: "categories",
    command: "month-set",
    summary: "Set the budgeted amount for a category in a month",
    mutates: true,
    args: z.object({
      month: z.string().describe("Budget month (YYYY-MM-DD) or 'current'"),
      category_id: z.string().describe("Category id"),
      budgeted: z.coerce.number().describe("Budgeted amount in currency units (e.g. 250.00)"),
      budget: budgetArg,
    }),
    positionals: ["month", "category_id"],
    run(ctx, args) {
      return ctx.client.updateMonthCategory(
        resolveBudget(ctx, args.budget),
        args.month,
        args.category_id,
        { budgeted: decimalToMilli(args.budgeted) },
      );
    },
  }),
];
