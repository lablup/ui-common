/**
 * Shared pieces for `*.stories.tsx` (docs/storybook.md). Storybook only: the
 * library build and its declarations skip this directory.
 */
import type { Decorator } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";

/**
 * The `isOpen` arg as a setter for an overlay's `onOpenChange`: it reports to
 * the Actions panel and updates the arg, so the Controls panel stays in sync.
 */
export function useOpenArg(onOpenChange: (isOpen: boolean) => void) {
  const [, updateArgs] = useArgs();
  return (isOpen: boolean) => {
    onOpenChange(isOpen);
    updateArgs({ isOpen });
  };
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
