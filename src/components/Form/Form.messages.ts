import { defineMessages } from "../../i18n/catalog";

/**
 * The form engine's built-in strings: the validation message templates and
 * the `requiredMark="optional"` suffix. Placeholders are the rule's values:
 * `{label}` (the item's label, or its name), `{type}`, `{len}`, `{min}`,
 * `{max}` and `{pattern}`.
 */
export const formMessages = defineMessages({
  "uic.Form.optional": {
    defaultMessage: "(optional)",
    description:
      'Suffix after the label of an optional field when requiredMark="optional"',
  },
  "uic.Form.default": {
    defaultMessage: "Field validation error for {label}",
    description: "Validation error when a rule failed without a more specific message",
  },
  "uic.Form.required": {
    defaultMessage: "Please enter {label}",
    description: "Validation error for an empty required field",
  },
  "uic.Form.whitespace": {
    defaultMessage: "{label} cannot be a blank character",
    description: "Validation error for a required field that holds only whitespace",
  },
  "uic.Form.typeString": {
    defaultMessage: "{label} is not a valid {type}",
    description:
      "Validation error for a value that is not a string; {type} is the type name",
  },
  "uic.Form.typeNumber": {
    defaultMessage: "{label} is not a valid {type}",
    description:
      "Validation error for a value that is not a number; {type} is the type name",
  },
  "uic.Form.typeObject": {
    defaultMessage: "{label} is not a valid {type}",
    description:
      "Validation error for a value that is not an object; {type} is the type name",
  },
  "uic.Form.typeEmail": {
    defaultMessage: "{label} is not a valid {type}",
    description:
      "Validation error for an invalid email address; {type} is the type name",
  },
  "uic.Form.typeUrl": {
    defaultMessage: "{label} is not a valid {type}",
    description: "Validation error for an invalid URL; {type} is the type name",
  },
  "uic.Form.stringLen": {
    defaultMessage: "{label} must be {len} characters",
    description: "Validation error for text of the wrong exact length",
  },
  "uic.Form.stringMin": {
    defaultMessage: "{label} must be at least {min} characters",
    description: "Validation error for text shorter than the minimum",
  },
  "uic.Form.stringMax": {
    defaultMessage: "{label} must be up to {max} characters",
    description: "Validation error for text longer than the maximum",
  },
  "uic.Form.stringRange": {
    defaultMessage: "{label} must be between {min}-{max} characters",
    description: "Validation error for text outside a length range",
  },
  "uic.Form.numberLen": {
    defaultMessage: "{label} must be equal to {len}",
    description: "Validation error for a number that must equal a value",
  },
  "uic.Form.numberMin": {
    defaultMessage: "{label} must be minimum {min}",
    description: "Validation error for a number below the minimum",
  },
  "uic.Form.numberMax": {
    defaultMessage: "{label} must be maximum {max}",
    description: "Validation error for a number above the maximum",
  },
  "uic.Form.numberRange": {
    defaultMessage: "{label} must be between {min}-{max}",
    description: "Validation error for a number outside a range",
  },
  "uic.Form.arrayLen": {
    defaultMessage: "Must be {len} {label}",
    description: "Validation error for a list with the wrong number of items",
  },
  "uic.Form.arrayMin": {
    defaultMessage: "At least {min} {label}",
    description: "Validation error for a list with too few items",
  },
  "uic.Form.arrayMax": {
    defaultMessage: "At most {max} {label}",
    description: "Validation error for a list with too many items",
  },
  "uic.Form.arrayRange": {
    defaultMessage: "The amount of {label} must be between {min}-{max}",
    description: "Validation error for a list whose item count is outside a range",
  },
  "uic.Form.patternMismatch": {
    defaultMessage: "{label} does not match the pattern {pattern}",
    description: "Validation error for text that does not match a pattern",
  },
});
