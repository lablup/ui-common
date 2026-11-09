/**
 * IconWithTooltip
 *
 * A glyph that explains itself on hover and focus: any icon (or a status
 * mark) wrapped in an unstyled, focusable button, so the hint is reachable
 * from the keyboard. The button's accessible name is the tooltip's text.
 *
 * `focusable={false}` renders a plain `<span>` instead (hover only), for use
 * inside another interactive element such as a link or an option, where a
 * nested button is invalid. That span is `aria-hidden`: the enclosing control
 * owns the accessible name, so the hint never joins it. `announceAs`
 * hands the tooltip's text to that control instead: as its description (a
 * help icon) or as part of its name (a role mark).
 *
 * @example
 * <IconWithTooltip icon={<CircleHelp />} content="Counts only running sessions." />
 */
import {
  useId,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { Text } from "@astryxdesign/core/Text";
import { Tooltip, type TooltipProps } from "@astryxdesign/core/Tooltip";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";

import { nodeToAccessibleLabel } from "./accessibleLabel";
import "./IconWithTooltip.css";

export interface IconWithTooltipProps extends Omit<
  TooltipProps,
  "children" | "anchorRef"
> {
  /** The glyph the tooltip is attached to. */
  icon: ReactNode;
  /**
   * `false` renders the trigger as a plain `<span>` (hover only) instead of a
   * focusable `<button>`, hidden from assistive tech so the enclosing control
   * keeps its own name; `announceAs` says where the tooltip's text goes.
   * @default true
   */
  focusable?: boolean;
  /**
   * Where a `focusable={false}` trigger's tooltip text reaches assistive tech:
   *
   * - `'none'`: nowhere; the text is shown on hover only.
   * - `'description'`: wires the text into the `aria-describedby` of the
   *   nearest enclosing control (a button, link, input, or an element with a
   *   widget role or `tabindex`), so it becomes that control's accessible
   *   description. For a help icon: a
   *   segment `Serving` with
   *   `<IconWithTooltip icon={<CircleHelp />} content="Desired Replicas ≥ 1" focusable={false} announceAs="description" />`
   *   is named "Serving" and described "Desired Replicas ≥ 1". With no
   *   enclosing control it does nothing.
   * - `'name'`: adds the text, visually hidden, to the enclosing control's
   *   accessible name.
   *   For an icon that carries information: an option holding
   *   `<IconWithTooltip icon={<Shield />} content="Project Admin" focusable={false} announceAs="name" />`
   *   is named "frontend-default Project Admin".
   *
   * No effect on a focusable trigger, which the tooltip's text already names.
   * @default 'none'
   */
  announceAs?: "none" | "name" | "description";
  /** Extra class names on the trigger. */
  className?: string;
  /** Inline styles on the trigger. */
  style?: CSSProperties;
}

/** What `announceAs="description"` looks for around the trigger. */
const ENCLOSING_CONTROL = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "summary",
  // A focus-managed container (a dialog, a scroller) carries tabindex="-1".
  '[tabindex]:not([tabindex="-1"])',
  ...[
    "button",
    "link",
    "radio",
    "option",
    "tab",
    "menuitem",
    "menuitemradio",
    "menuitemcheckbox",
    "checkbox",
    "switch",
    "treeitem",
  ].map((role) => `[role="${role}"]`),
].join(", ");

function hasToken(el: Element, id: string) {
  return (el.getAttribute("aria-describedby") ?? "").split(/\s+/).includes(id);
}

function addToken(el: Element, id: string) {
  if (hasToken(el, id)) return;
  const existing = el.getAttribute("aria-describedby");
  el.setAttribute("aria-describedby", [existing, id].filter(Boolean).join(" "));
}

function removeToken(el: Element, id: string) {
  const rest = (el.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter((token) => token && token !== id);
  if (rest.length) el.setAttribute("aria-describedby", rest.join(" "));
  else el.removeAttribute("aria-describedby");
}

interface DescribedLink {
  target: Element;
  observer: MutationObserver;
}

function attach(target: Element, id: string): DescribedLink {
  addToken(target, id);
  // React rewrites the attribute when the control's own aria-describedby
  // prop changes; put the id back.
  const observer = new MutationObserver(() => addToken(target, id));
  observer.observe(target, { attributes: true, attributeFilter: ["aria-describedby"] });
  return { target, observer };
}

function detach(link: DescribedLink | null, id: string) {
  if (!link) return;
  link.observer.disconnect();
  removeToken(link.target, id);
}

/**
 * Adds `id` to the `aria-describedby` of the control enclosing `triggerRef`
 * while `isActive`, and keeps it there.
 */
function useDescribeEnclosingControl(
  triggerRef: RefObject<HTMLElement | null>,
  id: string,
  isActive: boolean,
) {
  const linkRef = useRef<DescribedLink | null>(null);
  // Every render: the control may have moved, or React may have just
  // rewritten its aria-describedby.
  useLayoutEffect(() => {
    const target =
      (isActive && triggerRef.current?.parentElement?.closest(ENCLOSING_CONTROL)) ||
      null;
    const link = linkRef.current;
    if (link?.target === target) {
      if (target) addToken(target, id);
      return;
    }
    detach(link, id);
    linkRef.current = target ? attach(target, id) : null;
  });
  useLayoutEffect(
    () => () => {
      detach(linkRef.current, id);
      linkRef.current = null;
    },
    [id],
  );
}

export function IconWithTooltip({
  icon,
  focusable = true,
  announceAs = "none",
  style,
  className,
  ...tooltipProps
}: IconWithTooltipProps) {
  const descriptionId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const mode = focusable ? "none" : announceAs;
  const contentText =
    mode === "none" ? "" : nodeToAccessibleLabel(tooltipProps.content);
  useDescribeEnclosingControl(
    triggerRef,
    descriptionId,
    mode === "description" && contentText !== "",
  );

  const iconNode = (
    <Text color="placeholder" className="uic-icon-with-tooltip__icon">
      {icon}
    </Text>
  );
  const triggerClassName = (base: string) =>
    ["uic-icon-with-tooltip", base, className].filter(Boolean).join(" ");

  // The text sits outside the Tooltip: its wrapper anchors on its first child,
  // and the popover is a sibling of that wrapper. `hidden` keeps the
  // description out of the control's name; aria-describedby still reads it.
  return (
    <>
      <Tooltip {...tooltipProps}>
        {focusable ? (
          <button
            type="button"
            aria-label={nodeToAccessibleLabel(tooltipProps.content) || undefined}
            className={triggerClassName("uic-icon-with-tooltip--button")}
            style={style}
          >
            {iconNode}
          </button>
        ) : (
          <span
            ref={triggerRef}
            aria-hidden="true"
            className={triggerClassName("")}
            style={style}
          >
            {iconNode}
          </span>
        )}
      </Tooltip>
      {contentText && mode === "name" ? (
        <VisuallyHidden>{contentText}</VisuallyHidden>
      ) : null}
      {contentText && mode === "description" ? (
        <span id={descriptionId} hidden>
          {contentText}
        </span>
      ) : null}
    </>
  );
}

IconWithTooltip.displayName = "IconWithTooltip";
