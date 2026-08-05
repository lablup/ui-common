/**
 * StatusTag Component (epic #2730 / issue #2738)
 *
 * Status badge with the canonical color semantics shared by every list /
 * table that has to render lifecycle state. Mirrors the Backend.AI WebUI
 * `SessionStatusTag` color choices so users carry a single mental model
 * across products: blue for transient/preparing, green for healthy
 * running, red for error, neutral for terminated, yellow for stopping.
 *
 * The component intentionally builds on the existing {@link Badge}
 * primitive — it does not duplicate Badge's color tokens. Instead it
 * adds:
 *
 * 1. A canonical `state` enum surface (`running`, `preparing`,
 *    `stopping`, `error`, `terminated`, `idle`, `busy`) so callers
 *    don't have to map their domain state onto Badge variants by hand.
 * 2. An optional pulsing dot indicator for transient states (preparing,
 *    stopping) so the UI visibly communicates "in motion" alongside
 *    the static color.
 *
 * This is a domain-agnostic primitive — it MUST NOT carry Session,
 * Model, Agent, or Squad-specific knowledge.
 */

import { memo } from "react";
import { Badge } from "../Badge";
import type { BadgeProps } from "../Badge";
import "./StatusTag.css";

/**
 * Canonical lifecycle state surface accepted by {@link StatusTag}.
 *
 * The names are deliberately broad so domain types can map onto them:
 * - SessionState `"starting"`           → `"preparing"`
 * - SessionState `"running"` (healthy)  → `"running"`
 * - SessionState `"idle"`               → `"idle"`
 * - SessionState `"busy"`               → `"busy"`
 * - SessionState `"stopping"`           → `"stopping"`
 * - SessionState `"terminated"`         → `"terminated"`
 * - SessionState `"error"`              → `"error"`
 */
export type StatusKind =
  "running" | "preparing" | "idle" | "busy" | "stopping" | "terminated" | "error";

export interface StatusTagProps {
  /** Canonical lifecycle state. Drives color and indicator behavior. */
  state: StatusKind;
  /** Display label. Callers are responsible for i18n at the call site. */
  label: string;
  /** Override the underlying Badge size. Defaults to `"small"`. */
  size?: BadgeProps["size"];
  /**
   * When `true`, render a small pulsing dot before the label to
   * communicate that the state is in motion. Defaults to a sensible
   * choice based on `state` (transient states pulse, terminal ones
   * don't).
   */
  pulse?: boolean;
  /** Extra class names appended to the root span. */
  className?: string;
}

/**
 * Map a {@link StatusKind} onto a {@link BadgeProps.variant}. Centralizes
 * the canonical color mapping so consumers can't drift.
 */
function variantForState(state: StatusKind): BadgeProps["variant"] {
  switch (state) {
    case "running":
      return "success";
    case "preparing":
      return "info";
    case "idle":
      return "default";
    case "busy":
      return "primary";
    case "stopping":
      return "warning";
    case "terminated":
      return "default";
    case "error":
      return "danger";
  }
}

/**
 * Default for the dot-pulse indicator. Transient states pulse, terminal
 * ones don't. Callers can override via the `pulse` prop.
 */
function defaultPulseForState(state: StatusKind): boolean {
  return state === "preparing" || state === "stopping" || state === "busy";
}

function StatusTagComponent({
  state,
  label,
  size = "small",
  pulse,
  className = "",
}: StatusTagProps) {
  const showPulse = pulse ?? defaultPulseForState(state);
  const composedClassName = ["status-tag", `status-tag--${state}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Badge variant={variantForState(state)} size={size} className={composedClassName}>
      {showPulse && (
        <span
          className="status-tag__indicator"
          aria-hidden="true"
          data-testid="status-tag-indicator"
        />
      )}
      <span className="status-tag__label">{label}</span>
    </Badge>
  );
}

/**
 * Memoized to avoid re-rendering rows that didn't change. The component
 * is a pure function of its props.
 */
export const StatusTag = memo(StatusTagComponent);
export default StatusTag;
