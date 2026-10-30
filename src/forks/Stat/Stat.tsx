// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/lab 0.7.3-canary.cac3d8d, src/Stat/Stat.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * Stat, ui-common's copy of Astryx lab's, with one addition (not yet
 * upstream): `deltaTooltip`, a tooltip that explains the delta ("vs. the
 * previous 7 days: 1,204"). It is anchored to the delta, not to the whole
 * stat, so it opens next to the change it explains; the delta takes keyboard
 * focus while it has one, so the explanation is reachable without a pointer;
 * and `media` stays outside it, so a sparkline's own point tooltip is never
 * nested in it. Without `deltaTooltip` the markup is upstream's.
 *
 * Everything else is upstream's. Its style namespaces are Astryx's compiled
 * output (src/forks/compiled.ts).
 *
 * Delete this fork, and its exports.exclude.json entry, once lab ships a way
 * to explain the delta (CONTRIBUTING, "Forks of Astryx components").
 */

/*
 * Upstream's file notes, kept:
 *
 * @file Stat.tsx
 * @input Uses React, StyleX, and Astryx core theme tokens/utilities
 * @output Exports Stat component, StatProps, StatDelta, StatDeltaDirection,
 *   StatDeltaSentiment, StatSize types
 * @position Lab implementation; consumed by packages/lab/src/index.ts
 */

import { useRef, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import type { BaseProps } from "@astryxdesign/core";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { mergeProps, themeProps } from "@astryxdesign/core/utils";

import { compiledStyles } from "../compiled";
import * as compiled from "./Stat.styles";

// @astryxdesign/lab dist/Stat/Stat.js `styles`, `sizeStyles` and
// `sentimentStyles`.
const styles = compiledStyles(compiled.styles);
const sizeStyles = compiledStyles(compiled.sizeStyles);
const sentimentStyles = compiledStyles(compiled.sentimentStyles);

// Upstream's `label`, `valueRow`, `deltaGlyph`, `description`, `media` and
// `srOnly` styles, which its compiler folded into these class lists
// (dist/Stat/Stat.js).
const CLASS_NAME = {
  label: "x141an7d x1ltkj2j x1e4wzip xv1l7n4",
  valueRow: "x78zum5 x1pha0wt x1txdalj xeuugli",
  deltaGlyph: "x2lah0s",
  srOnly: "x10l6tqk x1i1rx1s xjm9jq1 x1717udv xkdpibf xb3r6kr xeh89do xuxw1ft xc342km",
  description: "x141an7d x1ltkj2j xv1l7n4",
  media: "xcsaf9d xkh2ocl xeuugli",
};

/** Trend direction of a delta; picks the glyph (up/down arrow, flat dash). */
export type StatDeltaDirection = "up" | "down" | "flat";

/** Color tone of a delta; overrides the default direction mapping. */
export type StatDeltaSentiment = "positive" | "negative" | "neutral";

/** Size variant controlling the value's font size. */
export type StatSize = "sm" | "md" | "lg";

/**
 * Change indicator rendered next to the value: a direction glyph plus
 * colored, pre-formatted change text.
 */
export interface StatDelta {
  /** Pre-formatted change text, e.g. "+12.4%" or "-8 ms". */
  value: string;
  /** Trend direction. Picks the glyph and the default sentiment. */
  direction: StatDeltaDirection;
  /**
   * Overrides the direction-to-color mapping for inverted metrics where
   * down is good (error rate, latency): up maps to positive, down to
   * negative, flat to neutral by default.
   */
  sentiment?: StatDeltaSentiment;
}

/** Default direction-to-sentiment mapping (up=good, down=bad). */
const DIRECTION_SENTIMENT: Record<StatDeltaDirection, StatDeltaSentiment> = {
  up: "positive",
  down: "negative",
  flat: "neutral",
};

/** Screen-reader text announced after the delta value. */
const DIRECTION_TEXT: Record<StatDeltaDirection, string> = {
  up: "trending up",
  down: "trending down",
  flat: "flat",
};

/** Inline glyph paths (12x12 viewBox): up-right arrow, down-right arrow, dash. */
const DELTA_GLYPH_PATHS: Record<StatDeltaDirection, string> = {
  up: "M3.5 8.5L8.5 3.5M8.5 3.5H4.75M8.5 3.5V7.25",
  down: "M3.5 3.5L8.5 8.5M8.5 8.5H4.75M8.5 8.5V4.75",
  flat: "M2.5 6H9.5",
};

export interface StatProps extends BaseProps<HTMLElement> {
  /** Ref forwarded to the root element */
  ref?: React.Ref<HTMLDivElement>;
  /**
   * Metric name shown above the value, e.g. "Total requests".
   */
  label: string;
  /**
   * The headline metric. Rendered large with tabular numerals so digits
   * keep a fixed width. Pass a pre-formatted string like "1.2M".
   */
  value: ReactNode;
  /**
   * Change indicator rendered next to the value: an up/down/flat glyph
   * plus colored text. `sentiment` overrides the direction color mapping
   * for inverted metrics like error rate.
   */
  delta?: StatDelta;
  /**
   * Explains the delta, e.g. the two ranges it compares and their values.
   * Shown in a tooltip anchored to the delta on hover, keyboard focus and
   * tap; the delta takes focus while it has one and is described by it.
   * Ignored without a `delta`. (ui-common; not in lab's Stat.)
   */
  deltaTooltip?: ReactNode;
  /**
   * Muted supporting line under the value, e.g. "vs. previous 30 days".
   */
  description?: string;
  /**
   * Trend slot rendered below the text content, e.g. a sparkline or mini
   * chart. Stat does not render a chart itself.
   */
  media?: ReactNode;
  /**
   * Size variant controlling the value's font size.
   * @default 'md'
   */
  size?: StatSize;
}

/**
 * A KPI/metric display: label, large tabular-nums value, optional
 * sentiment-aware delta, supporting description, and a trend media slot.
 *
 * The delta's color follows its direction (up=success, down=error,
 * flat=secondary) unless `sentiment` overrides it — use that for inverted
 * metrics where a drop is good (error rate, latency, churn).
 *
 * Styles use Astryx theme tokens via StyleX.
 * Wrap your app in `<Theme>` to apply a theme.
 *
 * @example
 * ```
 * <Stat label="Total requests" value="2.4M" delta={{value: '+12.4%', direction: 'up'}} />
 * <Stat
 *   label="Error rate"
 *   value="0.42%"
 *   delta={{value: '-0.08%', direction: 'down', sentiment: 'positive'}}
 *   description="vs. previous 30 days"
 *   deltaTooltip="Previous 30 days: 0.50%"
 * />
 * <Stat label="Active users" value="18,204" size="lg" media={<Sparkline />} />
 * ```
 */
export function Stat({
  label,
  value,
  delta,
  deltaTooltip,
  description,
  media,
  size = "md",
  xstyle,
  className,
  style,
  ref,
  ...props
}: StatProps) {
  const deltaRef = useRef<HTMLSpanElement>(null);
  const sentiment =
    delta == null ? null : (delta.sentiment ?? DIRECTION_SENTIMENT[delta.direction]);
  const hasDeltaTooltip = deltaTooltip != null;

  return (
    <div
      ref={ref}
      {...mergeProps(
        themeProps("stat", { size }),
        stylex.props(styles.base, xstyle),
        className,
        style,
      )}
      {...props}
    >
      <span className={CLASS_NAME.label}>{label}</span>
      <span className={CLASS_NAME.valueRow}>
        <span {...stylex.props(styles.value, sizeStyles[size])}>{value}</span>
        {delta != null && sentiment != null ? (
          <>
            <span
              ref={hasDeltaTooltip ? deltaRef : undefined}
              tabIndex={hasDeltaTooltip ? 0 : undefined}
              data-sentiment={sentiment}
              {...stylex.props(styles.delta, sentimentStyles[sentiment])}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                width={12}
                height={12}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={CLASS_NAME.deltaGlyph}
              >
                <path d={DELTA_GLYPH_PATHS[delta.direction]} />
              </svg>
              {delta.value}
              <span className={CLASS_NAME.srOnly}>
                ({DIRECTION_TEXT[delta.direction]})
              </span>
            </span>
            {hasDeltaTooltip ? (
              <Tooltip
                anchorRef={deltaRef}
                content={deltaTooltip}
                focusTrigger="always"
              />
            ) : null}
          </>
        ) : null}
      </span>
      {description != null ? (
        <span className={CLASS_NAME.description}>{description}</span>
      ) : null}
      {media != null ? <div className={CLASS_NAME.media}>{media}</div> : null}
    </div>
  );
}

Stat.displayName = "Stat";
