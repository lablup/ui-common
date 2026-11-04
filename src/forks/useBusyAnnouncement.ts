// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Adapted from @astryxdesign/core 0.7.7, src/hooks/useBusyAnnouncement.ts
// (MIT; see NOTICE), which core does not export. Used by the ComplexSelector
// and FileInput forks.

"use client";

import { useEffect, useRef } from "react";
import { useAnnounce } from "@astryxdesign/core/hooks";

/**
 * Announces each busy start of a control once, politely, through the public
 * `useAnnounce`; a re-render or a StrictMode replay does not repeat it, and
 * the settle re-arms it. Inside ui-common's `Modal` it is still spoken: the
 * modal stack leaves Astryx's live regions out of the page it inerts
 * (modalStack.ts). Upstream's route through a region inside an open native
 * modal `<dialog>` (a scrimmed Drawer), and its withdrawal of a not-yet-exposed
 * message, use private parts of core's announcement channel, so they are not
 * copied.
 */
export function useBusyAnnouncement(isBusy: boolean, message: string): void {
  const announce = useAnnounce();
  const hasAnnouncedRef = useRef(false);
  useEffect(() => {
    if (!isBusy) {
      hasAnnouncedRef.current = false;
      return;
    }
    if (hasAnnouncedRef.current) return;
    // A frame later, as upstream: a dialog opening in the same commit shows
    // in its own effect, after this one.
    const frame = requestAnimationFrame(() => {
      hasAnnouncedRef.current = true;
      announce(message, "polite");
    });
    return () => cancelAnimationFrame(frame);
  }, [announce, isBusy, message]);
}
