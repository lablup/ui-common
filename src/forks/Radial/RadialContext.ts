// Copyright (c) Meta Platforms, Inc. and affiliates.
//
// Forked from @astryxdesign/lab 0.7.7-canary.273ec43, src/Radial/RadialContext.ts
// (MIT; see NOTICE). Unchanged: forked with RadialChart, which provides it.
// Provenance and the drift guard: src/forks/provenance.json.

/**
 * @file RadialContext.ts
 * @output React context for radial chart components
 */

import { createContext, useContext } from "react";
import type { RadialContext } from "./types";

const RadialCtx = createContext<RadialContext | null>(null);

export const RadialProvider = RadialCtx.Provider;

/** Access the radial chart context. Throws if used outside RadialChart. */
export function useRadial(): RadialContext {
  const ctx = useContext(RadialCtx);
  if (!ctx) {
    throw new Error("Radial components must be used inside <RadialChart>");
  }
  return ctx;
}
