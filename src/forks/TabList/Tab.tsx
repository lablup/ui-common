// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.7, src/TabList/Tab.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * Tab, ui-common's copy of Astryx's, with one change (not yet upstream):
 * `endContent` renders beside the tab's `<button>` / `<a>`, not inside it.
 * Upstream renders it inside, so an interactive control there (an
 * `IconWithTooltip` explaining the tab) nests one interactive element in
 * another. With `endContent` the tab renders as a non-interactive `<span>`
 * that paints the tab (hover, press, selected indicator, focus ring) and
 * holds the tab's control and, beside it, the end content, which describes
 * the control (`aria-describedby`) rather than adding to its name. A click
 * on the end content selects the tab, unless it lands in an interactive
 * element there; arrow keys still move between tabs only, and an
 * interactive element in the end content is its own Tab stop. `className`,
 * `style` and `xstyle` style that span; `ref` and every other prop stay on
 * the control (a label-less tab is named by it instead). Keeping focus when
 * `endContent` comes or goes, and revealing the whole wrapper in a scrolling
 * strip, follow from the swap. The layout is the one SideNavItem uses for its
 * trailing controls. Without `endContent`
 * the markup is upstream's.
 *
 * Everything else is upstream's. Its style namespaces are Astryx's compiled
 * output (src/forks/compiled.ts); its only style of its own is the control's
 * inline style with end content (no padding; colour and font inherited).
 *
 * Delete this fork, and its exports.exclude.json entry, once Astryx's Tab
 * keeps interactive end content out of the tab's control (CONTRIBUTING,
 * "Forks of Astryx components").
 */

/*
 * Upstream's file notes, kept:
 *
 * @file Tab.tsx
 * @input Uses React, StyleX, TabListContext
 * @output Exports Tab component and TabProps type
 * @position Core tab item; renders as button or anchor in navigation with a
 *   divider-overlay selected indicator. Where the TabList speaks the tabs
 *   pattern it is a button with role="tab".
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import * as stylex from "@stylexjs/stylex";
import type { BaseProps } from "@astryxdesign/core/BaseProps";
import {
  hasInteractiveAncestor,
  hasTextSelection,
  useDevWarning,
  usePressFeedback,
} from "@astryxdesign/core/hooks";
import { EDGE_COMP_ATTR } from "@astryxdesign/core/Layout";
import { useLinkComponent, type LinkComponentType } from "@astryxdesign/core/Link";
import { useTabListContext, type TabListSize } from "@astryxdesign/core/TabList";
import {
  focusOutlineProps,
  interactionOverlayStyles,
  isRenderable,
  mergeProps,
  themeProps,
} from "@astryxdesign/core/utils";

import { compiledStyles } from "../compiled";
import * as compiled from "./Tab.styles";

export interface TabProps extends BaseProps<HTMLButtonElement> {
  /**
   * Custom component to render instead of `<a>` for link tabs.
   * Overrides the provider-level default set by LinkProvider.
   * Only applies when `href` is provided. Must accept href, className, style, and children props.
   */
  as?: LinkComponentType;
  ref?: React.Ref<HTMLButtonElement>;
  /**
   * Unique value for this tab. Matched against TabListContext.value.
   */
  value: string;
  /**
   * Accessible label for this tab. Used as visible text by default, or
   * as aria-label when isLabelHidden is true.
   */
  label: string;
  /**
   * Whether the label is visually hidden. When true, only the icon and
   * endContent are displayed, and label is used as aria-label for accessibility.
   * @default false
   */
  isLabelHidden?: boolean;
  /**
   * URL to navigate to. When provided, renders as an anchor element.
   *
   * Ignored in a TabList given an explicit `role="tablist"`: activating a tab
   * there swaps a panel in place, so a tab that navigates would be a false
   * statement.
   */
  href?: string;
  /**
   * Id of the panel this tab controls, wired up as `aria-controls` where the
   * TabList speaks the tabs pattern. Put the same id on the panel element.
   *
   * Has no effect under the navigation pattern, where there is no panel to
   * associate — a development warning says so.
   */
  panelId?: string;
  /**
   * Icon element shown when tab is not selected.
   */
  icon?: ReactNode;
  /**
   * Icon element shown when tab is selected. Falls back to `icon` if not provided.
   */
  selectedIcon?: ReactNode;
  /**
   * Content rendered after the label (e.g. a badge, a status dot, or an
   * `IconWithTooltip` explaining the tab).
   *
   * ui-common: rendered beside the tab's button or link, not inside it, so it
   * may hold interactive controls; it describes the tab (`aria-describedby`)
   * instead of adding to its accessible name. A click on it selects the tab,
   * except inside an interactive element there, and such an element is its
   * own Tab stop, outside the strip's arrow-key navigation. With it,
   * `className`, `style` and `xstyle` style the wrapper around both.
   */
  endContent?: ReactNode;
}

// =============================================================================
// Styles
// =============================================================================

// @astryxdesign/core dist/TabList/Tab.js `styles`, `sizeStyles`,
// `hoverSizeStyles`, `layoutStyles` and `iconSizeStyles`, and
// dist/TabList/tab.markers.stylex.js `tabScope`.
const styles = compiledStyles(compiled.styles);
const sizeStyles = compiledStyles(compiled.sizeStyles);
const hoverSizeStyles = compiledStyles(compiled.hoverSizeStyles);
const layoutStyles = compiledStyles(compiled.layoutStyles);
const iconSizeStyles = compiledStyles(compiled.iconSizeStyles);
const tabScope = compiledStyles({ tabScope: compiled.tabScope }).tabScope;

// Upstream's `indicator` (+ `indicatorSelected` / `indicatorUnselected`),
// `labelContainer`, `labelText`, `labelSizer` and `endContentWrapper` styles,
// which its compiler folded into these class lists (dist/TabList/Tab.js).
const CLASS_NAME = {
  indicatorSelected:
    "x10l6tqk xyi47jn x1ybfrjj x1mcfs9z x36qwtl xjspbzw x47corl xnpjden xuedmi6 xlr8y92 x1ewilqj x1hc1fzr",
  indicatorUnselected:
    "x10l6tqk xyi47jn x1ybfrjj x1mcfs9z x36qwtl xjspbzw x47corl xnpjden xuedmi6 xlr8y92 xjbqb8w xg01cxk",
  labelContainer: "xwz0xwf",
  labelText: "x1agbcgv xcrlgei",
  labelSizer: "x1agbcgv xcrlgei xlshs6z x47corl x2mo6ok",
  endContentWrapper: "x3nfvp2 x6s0dn4 x2lah0s",
};

// ui-common: with `endContent`, the wrapper is the tab's box (its padding,
// colour and font, the consumer's `className`, `style` and `xstyle`); the
// control inside takes upstream's layout classes but inherits those, so the
// wrapper's styling and theme selectors on `.astryx-tab` reach the label.
const END_CONTROL_STYLE = {
  paddingInline: 0,
  color: "inherit",
  fontSize: "inherit",
  lineHeight: "inherit",
  fontWeight: "inherit",
} as const;
// The keys TabList's roving focus handles (useListFocus: arrows, Home, End).
const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);
const CONTROL_SELECTOR = ":scope > [data-tab-value]";
// Elements in the end content that own their click besides core's
// INTERACTIVE_SELECTORS (hasInteractiveAncestor): anything focusable, a label,
// a disclosure summary, an editor.
const OWNS_CLICK_SELECTOR =
  'label, summary, [tabindex], [contenteditable]:not([contenteditable="false"])';

/** The control for `value` among `container`'s descendants, either shape. */
function findControl(container: Element | null, value: string) {
  if (!container) return null;
  for (const el of container.querySelectorAll<HTMLElement>("[data-tab-value]")) {
    if (el.dataset.tabValue === value) return el;
  }
  return null;
}

/**
 * Scrolls the strip so the whole wrapper (control and end content) is in
 * view. TabList's own reveal measures the `[data-tab-value]` control only; it
 * runs after this one and then has nothing left to do. Same arithmetic as
 * TabList's `revealStop`.
 */
function revealInStrip(wrapper: HTMLElement | null) {
  const strip = wrapper?.closest<HTMLElement>(".astryx-tab-strip");
  if (!wrapper || !strip || strip.scrollWidth <= strip.clientWidth) return;
  const stripBox = strip.getBoundingClientRect();
  const box = wrapper.getBoundingClientRect();
  const inset = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
  const pastEnd = box.right - (stripBox.right - inset);
  const pastStart = box.left - (stripBox.left + inset);
  const tooWide = box.width > stripBox.width - 2 * inset;
  const isRtl = getComputedStyle(strip).direction === "rtl";
  const delta = tooWide
    ? isRtl
      ? pastEnd
      : pastStart
    : pastEnd > 0
      ? pastEnd
      : pastStart < 0
        ? pastStart
        : 0;
  if (delta !== 0) strip.scrollBy({ left: delta, behavior: "instant" });
}

/**
 * Tab item component. Renders as an anchor when `href` is provided,
 * otherwise as a button.
 *
 * @example
 * ```
 * <TabList value={tab} onChange={setTab}>
 *   <Tab value="general" label="General" />
 *   <Tab value="advanced" label="Advanced" />
 * </TabList>
 * ```
 */
export function Tab({
  as,
  ref,
  value,
  label,
  isLabelHidden = false,
  href,
  panelId,
  icon,
  selectedIcon,
  endContent,
  xstyle,
  className,
  style,
  onClick,
  onFocus,
  onBlur,
  ...restProps
}: TabProps) {
  const pressable = usePressFeedback();
  const tabListCtx = useTabListContext();
  const LinkComponent = useLinkComponent(as);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  // The focused control and the element holding it (the strip), set on focus
  // and cleared on blur; see the restore below.
  const focusedRef = useRef<{ control: HTMLElement; container: Element | null } | null>(
    null,
  );
  const isRestoringFocusRef = useRef(false);
  const endContentId = useId();

  const isSelected = tabListCtx.value === value;
  const size: TabListSize = tabListCtx.size;
  const isFill = tabListCtx.layout === "fill";
  const isTabsPattern = tabListCtx.pattern === "tabs";
  const isLink = href != null && !isTabsPattern;
  const isTabRole = isTabsPattern && !isLink;
  const displayIcon = isSelected && isRenderable(selectedIcon) ? selectedIcon : icon;
  const hasVisibleLabel = !isLabelHidden && label !== "";
  const hasEndContent = isRenderable(endContent);

  const isDisabled =
    restProps["aria-disabled"] === true || restProps["aria-disabled"] === "true";

  const handleSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event as React.MouseEvent<HTMLButtonElement>);
      if (!event.defaultPrevented) {
        tabListCtx.onChange(value);
      }
    },
    [isDisabled, onClick, tabListCtx, value],
  );

  // ui-common: `endContent` coming or going swaps the root element (button or
  // link vs wrapper), which remounts the control. A removed node's blur never
  // reaches React, so the record of the focused control survives the swap,
  // and the new control takes focus back, if focus fell to the document
  // meanwhile. The consumer's onFocus is not called again for that, since
  // its onBlur was not called for the removal.
  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    const control = event.currentTarget;
    focusedRef.current = {
      control,
      container:
        (hasEndContent
          ? control.parentElement?.parentElement
          : control.parentElement) ?? null,
    };
    if (!isRestoringFocusRef.current) onFocus?.(event);
    if (hasEndContent) revealInStrip(wrapperRef.current);
  };
  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    focusedRef.current = null;
    onBlur?.(event);
  };
  const hadEndContentRef = useRef(hasEndContent);
  useLayoutEffect(() => {
    const isSwap = hadEndContentRef.current !== hasEndContent;
    hadEndContentRef.current = hasEndContent;
    const focused = focusedRef.current;
    if (!focused || focused.control.isConnected) return;
    // The focused control is gone: restore it only across this swap, and
    // only while nothing else has focus. Any other remount forgets it.
    focusedRef.current = null;
    const active = document.activeElement;
    if (!isSwap || (active != null && active !== document.body)) return;
    const control = findControl(focused.container, value);
    if (!control) return;
    isRestoringFocusRef.current = true;
    try {
      control.focus({ preventScroll: true });
    } finally {
      isRestoringFocusRef.current = false;
    }
  });

  // ui-common: the selected tab is revealed whole, end content included: in
  // the next frame, as TabList does after a press, so a selection does not
  // force layout before it paints; and again when the strip resizes, which
  // TabList re-reveals the control alone for.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!hasEndContent || !isSelected || !wrapper) return;
    const frame = requestAnimationFrame(() => revealInStrip(wrapper));
    const strip = wrapper.closest(".astryx-tab-strip");
    const observer =
      strip && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => revealInStrip(wrapper))
        : null;
    if (strip) observer?.observe(strip);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [hasEndContent, isSelected]);

  useDevWarning(
    "Tab",
    'href is ignored in a role="tablist" TabList — a tab swaps a panel in ' +
      "place rather than navigating. Drop the href, or drop the role for the " +
      "navigation pattern.",
    isTabRole && href != null,
  );

  // A consumer who wired aria-controls by hand already said which panel this
  // is, so panelId is the sugar, not the only way in.
  const controls = panelId ?? restProps["aria-controls"];

  useDevWarning(
    "Tab",
    'a tab in a role="tablist" TabList controls nothing: pass panelId with ' +
      "the id of the panel it opens, so assistive technology can associate " +
      "the two.",
    isTabRole && controls == null,
  );

  useDevWarning(
    "Tab",
    'panelId does nothing outside a role="tablist" TabList — the navigation ' +
      'pattern has no panel to associate. Give the TabList role="tablist", ' +
      "or drop the panelId.",
    !isTabsPattern && panelId != null,
  );

  const iconElement = isRenderable(displayIcon) ? (
    <span {...stylex.props(styles.icon, iconSizeStyles[size])}>{displayIcon}</span>
  ) : null;

  const semantics = {
    "data-tab-value": value,
    ...(isTabRole
      ? {
          role: "tab" as const,
          "aria-selected": isSelected,
          // Only when there is a panel to point at: an aria-controls whose
          // target does not exist is an invalid attribute value, which is a
          // worse state than saying nothing. The dev warning above asks for
          // the id instead.
          "aria-controls": controls,
        }
      : {
          // Generic `true` ("the current item within a set"), not `page`: the
          // strip switches views in place at least as often as it navigates,
          // and claiming "current page" when no page changed is a false
          // statement to a screen reader. Stays truthful for the `href` case
          // too, just less specific. A tab role states this with
          // aria-selected instead.
          "aria-current": isSelected ? ("true" as const) : undefined,
        }),
    // Roving tabindex: the tab strip is a single Tab stop. The selected tab is
    // the tabbable one; the rest are reachable via arrow keys (handled by
    // TabList's onKeyDown). When no tab is selected, TabList's repair effect
    // makes the first stop tabbable.
    tabIndex: isSelected ? 0 : -1,
  };

  // ui-common: the classes that paint the tab. On the button or link itself,
  // or, with `endContent`, on the wrapper around it.
  const surfaceStyles = [
    styles.base,
    sizeStyles[size],
    isSelected && styles.selected,
    isFill ? layoutStyles.fill : layoutStyles.hug,
    !isDisabled && tabScope,
    // The touch press's strength and release live on the tab the
    // controller writes to; the hover layer inherits and paints it.
    !isDisabled && interactionOverlayStyles.pressedAlpha,
    xstyle,
  ];
  const surfaceThemeProps = themeProps("tab", {
    selected: isSelected ? "selected" : null,
  });

  const sharedProps = {
    ...restProps,
    ...pressable,
    ...(isLabelHidden ? { "aria-label": label } : {}),
    [EDGE_COMP_ATTR]: "",
    ...semantics,
    onFocus: handleFocus,
    onBlur: handleBlur,
    ...mergeProps(
      surfaceThemeProps,
      focusOutlineProps.focusVisible(...surfaceStyles),
      className,
      style,
    ),
  };

  const hoverBgElement = (
    <span aria-hidden="true" {...stylex.props(styles.hoverBg, hoverSizeStyles[size])} />
  );

  const indicatorElement = (
    <span
      {...mergeProps(
        themeProps("tab-indicator", {
          selected: isSelected ? "selected" : null,
        }),
        {
          className: isSelected
            ? CLASS_NAME.indicatorSelected
            : CLASS_NAME.indicatorUnselected,
        },
      )}
    />
  );

  const labelElement = hasVisibleLabel ? (
    <span className={CLASS_NAME.labelContainer}>
      <span className={CLASS_NAME.labelText}>{label}</span>
      <span aria-hidden="true" className={CLASS_NAME.labelSizer}>
        {label}
      </span>
    </span>
  ) : null;

  // A disabled link tab must not reach a router component: some routers reject
  // a missing destination, while others treat it as the current route. A
  // plain anchor without href preserves the element shape but cannot navigate.
  const LinkRoot = isDisabled ? "a" : LinkComponent;

  if (hasEndContent) {
    // ui-common: the tab's control and its end content are siblings in a
    // non-interactive span that paints the tab. The span rings while its first
    // child, the control, is focus-visible (SideNavItem's pattern), so the
    // control suppresses its own ring. The end content describes the control,
    // or names it when the tab has no label.
    const isNamedByEndContent =
      label === "" &&
      restProps["aria-label"] == null &&
      restProps["aria-labelledby"] == null;
    const describedBy =
      [restProps["aria-describedby"], isNamedByEndContent ? null : endContentId]
        .filter(Boolean)
        .join(" ") || undefined;
    const controlProps = {
      ...restProps,
      ...(isLabelHidden ? { "aria-label": label } : {}),
      ...(isNamedByEndContent ? { "aria-labelledby": endContentId } : {}),
      "aria-describedby": describedBy,
      ...semantics,
      onFocus: handleFocus,
      onBlur: handleBlur,
      ...mergeProps(
        focusOutlineProps.suppressed(styles.base, sizeStyles[size], layoutStyles.hug),
        undefined,
        END_CONTROL_STYLE,
      ),
    };
    const content = (
      <>
        {iconElement}
        {labelElement}
      </>
    );
    // A press anywhere on the tab selects it, as on upstream's: a click in the
    // span outside the control is re-dispatched on the control, with its
    // modifier keys and button (useClickableContainer's rule), unless it
    // belongs to an interactive element or layer surface in the end content,
    // came through a portal, or ends a text selection. A middle click there
    // does nothing (no click event fires); on the link itself it opens a tab.
    const handleWrapperClick = (event: React.MouseEvent<HTMLSpanElement>) => {
      const wrapper = event.currentTarget;
      const target = event.target;
      if (!(target instanceof Element) || !wrapper.contains(target)) return;
      if (target !== wrapper) {
        if (hasInteractiveAncestor(target, wrapper)) return;
        const owner = target.closest(OWNS_CLICK_SELECTOR);
        if (owner && owner !== wrapper && wrapper.contains(owner)) return;
      }
      if (hasTextSelection(wrapper)) return;
      const control = wrapper.querySelector<HTMLElement>(CONTROL_SELECTOR);
      if (!control) return;
      // A disabled tab selects nothing, and the click goes on as it would from
      // the control.
      if (isDisabled) return;
      event.stopPropagation();
      control.focus({ preventScroll: true });
      control.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          button: event.button,
          detail: event.detail,
        }),
      );
    };
    return (
      <span
        ref={wrapperRef}
        // A disabled wrapper is no press surface and shows the default cursor;
        // aria-disabled stays on the control, a generic span cannot carry it.
        {...(isDisabled ? {} : pressable)}
        {...{ [EDGE_COMP_ATTR]: "" }}
        data-tab-end-content=""
        data-disabled={isDisabled ? "" : undefined}
        onClick={handleWrapperClick}
        {...mergeProps(
          surfaceThemeProps,
          focusOutlineProps.focusWithinFirstChild(...surfaceStyles),
          className,
          isDisabled ? { cursor: "default", ...style } : style,
        )}
      >
        {isLink ? (
          <LinkRoot
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={isDisabled ? undefined : href}
            onClick={handleSelect}
            {...controlProps}
          >
            {content}
          </LinkRoot>
        ) : (
          <button ref={ref} type="button" onClick={handleSelect} {...controlProps}>
            {content}
          </button>
        )}
        <span
          id={endContentId}
          className={CLASS_NAME.endContentWrapper}
          // The strip's arrow keys move between tabs; on a control in the end
          // content they would jump to the first or last tab, so they stay
          // with it. Every other key goes on to TabList and the page.
          onKeyDown={(event) => {
            if (NAVIGATION_KEYS.has(event.key)) event.stopPropagation();
          }}
        >
          {endContent}
        </span>
        {hoverBgElement}
        {indicatorElement}
      </span>
    );
  }

  if (isLink) {
    return (
      <LinkRoot
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={isDisabled ? undefined : href}
        onClick={handleSelect}
        {...sharedProps}
      >
        {hoverBgElement}
        {iconElement}
        {labelElement}
        {indicatorElement}
      </LinkRoot>
    );
  }

  return (
    <button ref={ref} type="button" onClick={handleSelect} {...sharedProps}>
      {hoverBgElement}
      {iconElement}
      {labelElement}
      {indicatorElement}
    </button>
  );
}

Tab.displayName = "Tab";
