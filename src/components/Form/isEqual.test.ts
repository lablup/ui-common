import { describe, expect, it } from "vitest";

import { isEqual } from "./isEqual";

describe("isEqual", () => {
  it("compares primitives, with NaN equal to itself", () => {
    expect(isEqual(1, 1)).toBe(true);
    expect(isEqual("a", "b")).toBe(false);
    expect(isEqual(NaN, NaN)).toBe(true);
    expect(isEqual(0, -0)).toBe(true);
    expect(isEqual(null, undefined)).toBe(false);
    expect(isEqual(undefined, undefined)).toBe(true);
  });

  it("compares arrays and plain objects deeply", () => {
    expect(isEqual([1, { a: [2, 3] }], [1, { a: [2, 3] }])).toBe(true);
    expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(isEqual({ a: 1, b: undefined }, { a: 1 })).toBe(false);
    expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("compares dates, regexps and boxed values by value", () => {
    expect(isEqual(new Date(5), new Date(5))).toBe(true);
    expect(isEqual(new Date(5), new Date(6))).toBe(false);
    expect(isEqual(/a/g, /a/g)).toBe(true);
    expect(isEqual(/a/g, /a/i)).toBe(false);
  });

  it("compares maps and sets regardless of order", () => {
    expect(isEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(isEqual(new Map([["a", { x: 1 }]]), new Map([["a", { x: 1 }]]))).toBe(true);
    expect(isEqual(new Set([1]), new Set([2]))).toBe(false);
  });

  it("compares class instances by own keys and constructor", () => {
    class A {
      constructor(public v: number) {}
    }
    class B {
      constructor(public v: number) {}
    }
    expect(isEqual(new A(1), new A(1))).toBe(true);
    expect(isEqual(new A(1), new B(1))).toBe(false);
  });

  it("does not compare functions or opaque built-ins by content", () => {
    expect(
      isEqual(
        () => 1,
        () => 1,
      ),
    ).toBe(false);
    const blob = new Blob(["x"]);
    expect(isEqual(blob, blob)).toBe(true);
    expect(isEqual(blob, new Blob(["x"]))).toBe(false);
  });

  it("survives cycles", () => {
    const a: Record<string, unknown> = { v: 1 };
    a.self = a;
    const b: Record<string, unknown> = { v: 1 };
    b.self = b;
    expect(isEqual(a, b)).toBe(true);
  });
});
