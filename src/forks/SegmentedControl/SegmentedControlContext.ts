// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.3, src/SegmentedControl/SegmentedControlContext.ts
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

import { createContext, use } from "react";

export type SegmentedControlSize = "sm" | "md" | "lg";
export type SegmentedControlLayout = "hug" | "fill";

export interface SegmentedControlContextValue {
  value: string;
  onChange: (value: string) => void;
  size: SegmentedControlSize;
  layout: SegmentedControlLayout;
  isDisabled: boolean;
  /**
   * True when the whole control is disabled *and* a `disabledMessage` is set.
   * In that mode the selected segment stays focusable (via `aria-disabled`
   * rather than being dropped from the tab order) so the group's disabled-reason
   * tooltip is keyboard-discoverable; selection is still blocked.
   */
  hasDisabledMessage?: boolean;
}

// Upstream's is layer-scoped (`createLayerScopedContext`, not exported), so a
// layer opened inside the control starts without it. Segments are never
// rendered in such a layer, so a plain context behaves the same.
export const SegmentedControlContext =
  createContext<SegmentedControlContextValue | null>(null);
SegmentedControlContext.displayName = "SegmentedControlContext";

export function useSegmentedControlContext(): SegmentedControlContextValue {
  const ctx = use(SegmentedControlContext);
  if (ctx == null) {
    throw new Error(
      "useSegmentedControlContext must be used within SegmentedControl. " +
        "Wrap your SegmentedControlItem in <SegmentedControl>.",
    );
  }
  return ctx;
}
