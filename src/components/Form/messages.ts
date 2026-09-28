/**
 * Validate-message templates.
 *
 * The strings live in ui-common's catalog (`./Form.messages.ts`) as ICU
 * messages. The engine interpolates rule values itself, with `${name}`-style
 * placeholders (see `validate.ts`), so a template is the catalog message
 * formatted with each placeholder standing for itself: `{label}` becomes
 * `${label}`.
 */
import IntlMessageFormat from "intl-messageformat";

import { formMessages } from "./Form.messages";
import type { ValidateMessages } from "./interface";

/** Formats a catalog key with the given values, like `useUicTranslator`'s `t`. */
export type ValidateMessageTranslate = (
  key: keyof typeof formMessages,
  values: Record<string, string>,
) => string;

const PLACEHOLDERS = ["label", "type", "len", "min", "max", "pattern"] as const;
const TEMPLATE_VALUES = Object.fromEntries(PLACEHOLDERS.map((p) => [p, `\${${p}}`]));

/** The engine's template table, in the language `translate` resolves. */
export function buildValidateMessages(
  translate: ValidateMessageTranslate,
): ValidateMessages {
  const m = (key: keyof typeof formMessages) => translate(key, TEMPLATE_VALUES);
  const lengths = (group: "string" | "number" | "array") => ({
    len: m(`uic.Form.${group}Len`),
    min: m(`uic.Form.${group}Min`),
    max: m(`uic.Form.${group}Max`),
    range: m(`uic.Form.${group}Range`),
  });
  return {
    default: m("uic.Form.default"),
    required: m("uic.Form.required"),
    whitespace: m("uic.Form.whitespace"),
    types: {
      string: m("uic.Form.typeString"),
      number: m("uic.Form.typeNumber"),
      object: m("uic.Form.typeObject"),
      email: m("uic.Form.typeEmail"),
      url: m("uic.Form.typeUrl"),
    },
    string: lengths("string"),
    number: lengths("number"),
    array: lengths("array"),
    pattern: { mismatch: m("uic.Form.patternMismatch") },
  };
}

/** The English templates: the fallback under every other table. */
export const defaultValidateMessages: ValidateMessages = buildValidateMessages(
  (key, values) =>
    String(
      new IntlMessageFormat(formMessages[key].defaultMessage, "en").format(values),
    ),
);

/**
 * Shallow-per-section merge, matching async-validator's `deepMerge`: a
 * provided `types` object is spread over the default `types` object rather
 * than replacing it, so a table that only sets `required` keeps the other
 * templates.
 */
export function mergeValidateMessages(
  ...sources: (ValidateMessages | undefined | null)[]
): ValidateMessages {
  const target: ValidateMessages = { ...defaultValidateMessages };
  sources.forEach((source) => {
    if (!source) return;
    Object.keys(source).forEach((key) => {
      const value = source[key];
      const existing = target[key];
      if (
        value &&
        typeof value === "object" &&
        existing &&
        typeof existing === "object"
      ) {
        target[key] = { ...existing, ...value };
      } else {
        target[key] = value;
      }
    });
  });
  return target;
}
