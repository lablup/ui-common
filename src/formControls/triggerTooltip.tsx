/**
 * The tooltip on a select control's trigger, shared by `Selector` and
 * `MultiSelector`. It follows the trigger's own attributes, so it is held shut
 * while the listbox is open and absent while the trigger is disabled, from the
 * first commit on.
 */
import { useLayoutEffect, useState, type ReactNode } from "react";
import { useTooltip } from "@astryxdesign/core/Tooltip";

/** What the tooltip needs from the trigger: disabled, and the listbox open. */
const readTrigger = (trigger: HTMLElement) => ({
  // A disabled InputGroup disables the trigger through context Astryx does not
  // export; the trigger's aria-disabled is where it shows.
  isDisabled: trigger.getAttribute("aria-disabled") === "true",
  isExpanded: trigger.getAttribute("aria-expanded") === "true",
});

export function TriggerTooltip({
  trigger,
  renderContent,
  onDescribedBy,
}: {
  trigger: HTMLElement;
  /** Called only while the tooltip is enabled, so a disabled trigger never runs it. */
  renderContent: () => ReactNode;
  onDescribedBy: (id: string | undefined) => void;
}) {
  const [state, setState] = useState(() => readTrigger(trigger));
  useLayoutEffect(() => {
    const sync = () =>
      setState((prev) => {
        const next = readTrigger(trigger);
        return prev.isDisabled === next.isDisabled &&
          prev.isExpanded === next.isExpanded
          ? prev
          : next;
      });
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(trigger, { attributeFilter: ["aria-disabled", "aria-expanded"] });
    return () => observer.disconnect();
  }, [trigger]);
  const isEnabled = !state.isDisabled;
  const tooltip = useTooltip({
    isEnabled,
    isOpen: state.isExpanded ? false : undefined,
  });
  const attach = tooltip.ref;
  useLayoutEffect(
    () => (isEnabled ? attach(trigger) : undefined),
    [attach, trigger, isEnabled],
  );
  const { describedBy } = tooltip;
  useLayoutEffect(() => {
    onDescribedBy(isEnabled ? describedBy : undefined);
    return () => onDescribedBy(undefined);
  }, [onDescribedBy, describedBy, isEnabled]);
  return isEnabled ? tooltip.renderTooltip(renderContent()) : null;
}

/**
 * Whether anything inside `trigger` is clipped: an element whose content is
 * wider than the box it shows. The trigger's label ellipsizes and
 * `renderValue`'s wrapper clips, so a wider scroll box than client box is the
 * sign a value is cut off.
 */
export function hasClippedContent(trigger: HTMLElement): boolean {
  return Array.from(trigger.querySelectorAll<HTMLElement>("*")).some(
    (element) => element.clientWidth > 0 && element.scrollWidth > element.clientWidth,
  );
}

/**
 * `hasClippedContent` for a trigger, kept current: a resize of the trigger or
 * a change to what it shows remeasures, so the answer follows the layout and
 * the value without the caller tracking either.
 */
export function useClippedContent(
  trigger: HTMLElement | null,
  isEnabled: boolean,
): boolean {
  const [isClipped, setIsClipped] = useState(false);
  useLayoutEffect(() => {
    if (!trigger || !isEnabled) {
      setIsClipped(false);
      return;
    }
    const measure = () => setIsClipped(hasClippedContent(trigger));
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(trigger);
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(trigger, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [trigger, isEnabled]);
  return isClipped;
}
