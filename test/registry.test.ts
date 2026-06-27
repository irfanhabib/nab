import { test, expect, describe } from "bun:test";
import { z } from "zod";
import { operations, operationsByGroup } from "../src/operations/index.ts";
import { inspectField } from "../src/operations/types.ts";
import { buildProgram } from "../src/cli/build.ts";

describe("operation registry", () => {
  test("has operations and unique ids", () => {
    expect(operations.length).toBeGreaterThan(30);
    const ids = operations.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every op is well-formed", () => {
    for (const op of operations) {
      expect(op.args).toBeInstanceOf(z.ZodObject);
      expect(typeof op.run).toBe("function");
      const shape = op.args.shape as Record<string, unknown>;
      for (const key of op.positionals ?? []) {
        expect(shape[key], `${op.id} positional ${key} missing from schema`).toBeDefined();
      }
    }
  });

  test("covers all expected groups", () => {
    const groups = new Set(operationsByGroup().keys());
    for (const g of [
      "auth",
      "user",
      "budgets",
      "accounts",
      "categories",
      "payees",
      "payee-locations",
      "months",
      "transactions",
      "scheduled",
      "money-movements",
      "raw",
    ]) {
      expect(groups.has(g), `missing group ${g}`).toBe(true);
    }
  });

  test("buildProgram constructs without throwing", () => {
    const program = buildProgram("0.0.0-test");
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("transactions");
    expect(names).toContain("raw"); // top-level op
  });
});

describe("inspectField", () => {
  test("classifies kinds and optionality", () => {
    expect(inspectField(z.string()).kind).toBe("string");
    expect(inspectField(z.coerce.number()).kind).toBe("number");
    expect(inspectField(z.boolean()).kind).toBe("boolean");
    expect(inspectField(z.array(z.any())).kind).toBe("json");
    expect(inspectField(z.record(z.any())).kind).toBe("json");

    const e = inspectField(z.enum(["a", "b"]));
    expect(e.kind).toBe("enum");
    expect(e.enumValues).toEqual(["a", "b"]);

    expect(inspectField(z.string()).optional).toBe(false);
    expect(inspectField(z.string().optional()).optional).toBe(true);
    const d = inspectField(z.string().default("x"));
    expect(d.optional).toBe(true);
    expect(d.hasDefault).toBe(true);
  });

  test("reads descriptions through wrappers", () => {
    const f = inspectField(z.string().describe("hello").optional());
    expect(f.description).toBe("hello");
  });
});
