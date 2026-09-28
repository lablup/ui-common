/**
 * `${type}` interpolation for rules whose type is inferred rather than
 * declared: `validateRule` normalises `{}` to a `string` rule, so the message
 * names the normalised type, not `undefined`.
 */
import { defaultValidateMessages } from "./messages";
import { validateRules } from "./validate";
import { describe, expect, it } from "vitest";

// Default (parallel) mode always rejects with the per-rule summaries.
const collectErrors = (value: unknown, rules: any[]) =>
  validateRules(["resource_slots", "cuda.device"], value, rules, {
    ...defaultValidateMessages,
  }).then(
    () => {
      throw new Error("validateRules resolved in parallel mode");
    },
    (summaries: { errors: any[] }[]) => summaries.flatMap((s) => s.errors),
  );

describe("validateRules — inferred-type message interpolation", () => {
  it("interpolates ${type} as the normalised type for an empty rule", async () => {
    const errors = await collectErrors(1, [{}]);
    // No `label` variable: `{label}` falls back to the field's name.
    expect(errors).toEqual(["resource_slots.cuda.device is not a valid string"]);
  });

  it("still resolves ${type} for an explicitly typed rule", async () => {
    const errors = await collectErrors("one", [{ type: "number" }]);
    expect(errors).toEqual(["resource_slots.cuda.device is not a valid number"]);
  });

  it("accepts a number under a declared number rule", async () => {
    const errors = await collectErrors(1, [{ type: "number" }]);
    expect(errors).toEqual([]);
  });
});
