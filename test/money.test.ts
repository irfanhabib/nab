import { test, expect, describe } from "bun:test";
import { milliToDecimal, decimalToMilli, humanizeAmounts } from "../src/util/money.ts";

describe("money conversion", () => {
  test("milliToDecimal", () => {
    expect(milliToDecimal(1000)).toBe(1);
    expect(milliToDecimal(-12340)).toBe(-12.34);
    expect(milliToDecimal(0)).toBe(0);
  });

  test("decimalToMilli rounds without float drift", () => {
    expect(decimalToMilli(1)).toBe(1000);
    expect(decimalToMilli(-12.34)).toBe(-12340);
    expect(decimalToMilli("100.50")).toBe(100500);
    expect(decimalToMilli(0.1)).toBe(100);
  });

  test("decimalToMilli rejects non-numbers", () => {
    expect(() => decimalToMilli("abc")).toThrow();
  });

  test("round-trips", () => {
    for (const v of [-1632.31, 43.5, 0, 9999.99]) {
      expect(milliToDecimal(decimalToMilli(v))).toBeCloseTo(v, 5);
    }
  });
});

describe("humanizeAmounts", () => {
  test("converts known money fields recursively, leaves others", () => {
    const input = {
      transactions: [{ id: "x", amount: -1230, memo: "hi", age_of_money: 30 }],
      balance: 43500,
      name: "Acct",
    };
    const out = humanizeAmounts(input) as any;
    expect(out.transactions[0].amount).toBe(-1.23);
    expect(out.transactions[0].memo).toBe("hi");
    expect(out.transactions[0].age_of_money).toBe(30); // not a money field
    expect(out.balance).toBe(43.5);
    expect(out.name).toBe("Acct");
  });

  test("does not mutate input", () => {
    const input = { amount: 1000 };
    humanizeAmounts(input);
    expect(input.amount).toBe(1000);
  });
});
