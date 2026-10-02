/**
 * BooleanToken
 *
 * An on/off value as a Token: green for true, the quiet default outline for
 * false, and `fallback` when the value is not a boolean (unknown, not loaded).
 *
 * @example
 * <BooleanToken value={user.isAdmin} trueLabel="Admin" falseLabel="Member" />
 */
import type { ReactNode } from "react";
import { Token } from "@astryxdesign/core/Token";

import { useUicTranslator } from "../../i18n/useUicTranslator";

export interface BooleanTokenProps {
  /** The value. Anything but a boolean renders `fallback`. */
  value: boolean | null | undefined;
  /** Label for `true`. @default the catalog's uic.BooleanToken.true ("True") */
  trueLabel?: string;
  /** Label for `false`. @default the catalog's uic.BooleanToken.false ("False") */
  falseLabel?: string;
  /** Rendered when `value` is not a boolean. @default "-" */
  fallback?: ReactNode;
}

export function BooleanToken({
  value,
  trueLabel,
  falseLabel,
  fallback = "-",
}: BooleanTokenProps) {
  const t = useUicTranslator();
  if (typeof value !== "boolean") {
    return fallback;
  }
  return value ? (
    <Token color="green" label={trueLabel ?? t("uic.BooleanToken.true")} />
  ) : (
    <Token color="default" label={falseLabel ?? t("uic.BooleanToken.false")} />
  );
}

BooleanToken.displayName = "BooleanToken";
