/**
 * Shared pieces for `*.stories.tsx` (docs/storybook.md). Storybook only: the
 * library build and its declarations skip this directory.
 */
import { useState } from "react";
import type { Decorator } from "@storybook/react-vite";

/**
 * Local state that starts from an arg and resets when the arg changes in the
 * Controls panel.
 *
 * React state, not Storybook's `useArgs`: the global decorator re-renders the
 * story (dark mode, a locale catalog arriving), and Storybook hooks throw when
 * React re-renders a story outside Storybook's own render pass.
 */
export function useArgState<T>(arg: T) {
  const [value, setValue] = useState(arg);
  const [prevArg, setPrevArg] = useState(arg);
  if (arg !== prevArg) {
    setPrevArg(arg);
    setValue(arg);
  }
  return [value, setValue] as const;
}

/**
 * An overlay's open state, from its `isOpen` arg. The setter also reports to
 * `onOpenChange`, so the Actions panel logs every change.
 */
export function useOpenState(
  isOpen: boolean | undefined,
  onOpenChange: (isOpen: boolean) => void,
) {
  const [open, setOpen] = useArgState(Boolean(isOpen));
  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };
  return [open, change] as const;
}

/**
 * For overlays that portal to the page body or float in the viewport: on the
 * Documentation page each story gets its own frame of this height instead of
 * covering the page.
 */
export const overlayDocs = (height: string) => ({
  docs: { story: { inline: false, height } },
});

/** Limits a story's width, for components that fill their container. */
export function withMaxWidth<TArgs>(maxWidth: number): Decorator<TArgs> {
  return (Story) => (
    <div style={{ maxWidth }}>
      <Story />
    </div>
  );
}
