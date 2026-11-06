// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Forked from @astryxdesign/core 0.7.7, src/TabList/Tab.tsx
// (MIT; see NOTICE). Provenance and the drift guard: src/forks/provenance.json.

"use client";

/**
 * Tab, ui-common's copy of Astryx's, with one addition (not yet upstream):
 * `actions`, interactive controls at the tab's trailing edge (an
 * `IconWithTooltip` explaining the tab, a menu). Upstream renders `label`
 * and `endContent` inside the tab's `<button>` / `<a>`, so a control there
 * nests one interactive element in another. With `actions` the tab renders
 * as a non-interactive `<span>` that paints the tab (hover, press, selected
 * indicator, focus ring), holding the tab's button or link and, beside it,
 * the actions: clicking an action does not select the tab, arrow keys still
 * move between tabs only, and each action is its own Tab stop. Arrow keys
 * pressed on an action stay with it. `className`, `style` and `xstyle` style
 * that span; `ref` and every other prop stay on the button or link. The
 * pattern is SideNavItem's `actions`. Without `actions` the markup is
 * upstream's.
 *
 * Everything else is upstream's. Its style namespaces are Astryx's compiled
 * output (src/forks/compiled.ts); the two inline paddings the actions layout
 * needs are the only styles of its own.
 *
 * Delete this fork, and its exports.exclude.json entry, once Astryx's Tab can
 * hold an interactive trailing control (CONTRIBUTING, "Forks of Astryx
 * components").
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

import { useCallback, useRef, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import type { BaseProps } from "@astryxdesign/core/BaseProps";
import {
  useDevWarning,
  useMergedRefs,
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
   * Content rendered after the label (e.g. a badge or status dot). Rendered
   * inside the tab's button or link, so it must not be interactive: put
   * controls in `actions`.
   */
  endContent?: ReactNode;
  /**
   * ui-common: interactive controls (an `IconWithTooltip`, an icon button, a
   * menu) at the tab's trailing edge, after `endContent`. Rendered beside
   * the tab's button or link, never inside it, in a non-interactive wrapper
   * that paints the tab's hover, selected indicator and focus ring around
   * both. Clicking an action does not select the tab; each action is its
   * own Tab stop, outside the strip's arrow-key navigation. Content is
   * passthrough: each control owns its accessible name and keyboard
   * behaviour. With it, `className`, `style` and `xstyle` style the wrapper.
   */
  actions?: ReactNode;
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

// ui-common: with `actions`, the wrapper supplies the trailing inline
// padding and the button the leading one, so the hit area of the tab's own
// control starts at the tab's edge and the actions sit `--spacing-1` after
// its content, as `endContent` does.
const ACTIONS_WRAPPER_STYLE = { paddingInlineStart: 0 } as const;
const ACTIONS_CONTROL_STYLE = { paddingInlineEnd: 0 } as const;
const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

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
  actions,
  xstyle,
  className,
  style,
  onClick,
  ...restProps
}: TabProps) {
  const pressable = usePressFeedback();
  const tabListCtx = useTabListContext();
  const LinkComponent = useLinkComponent(as);
  const controlRef = useRef<HTMLElement | null>(null);
  const mergedRef = useMergedRefs<HTMLElement>(
    ref as React.Ref<HTMLElement> | undefined,
    controlRef,
  );

  const isSelected = tabListCtx.value === value;
  const size: TabListSize = tabListCtx.size;
  const isFill = tabListCtx.layout === "fill";
  const isTabsPattern = tabListCtx.pattern === "tabs";
  const isLink = href != null && !isTabsPattern;
  const isTabRole = isTabsPattern && !isLink;
  const displayIcon = isSelected && isRenderable(selectedIcon) ? selectedIcon : icon;
  const hasVisibleLabel = !isLabelHidden && label !== "";
  const hasActions = isRenderable(actions);

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
  // or, with `actions`, on the wrapper around it.
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

  const endContentElement = isRenderable(endContent) ? (
    <span className={CLASS_NAME.endContentWrapper}>{endContent}</span>
  ) : null;

  // A disabled link tab must not reach a router component: some routers reject
  // a missing destination, while others treat it as the current route. A
  // plain anchor without href preserves the element shape but cannot navigate.
  const LinkRoot = isDisabled ? "a" : LinkComponent;

  if (hasActions) {
    // ui-common: the tab's button or link and its actions are siblings in a
    // non-interactive span that paints the tab. The span rings while its first
    // child, the tab's control, is focus-visible (SideNavItem's pattern), so
    // the control suppresses its own ring.
    const control = {
      ...restProps,
      ...(isLabelHidden ? { "aria-label": label } : {}),
      ...semantics,
      ...mergeProps(
        focusOutlineProps.suppressed(
          styles.base,
          sizeStyles[size],
          isSelected && styles.selected,
          layoutStyles.hug,
        ),
        undefined,
        ACTIONS_CONTROL_STYLE,
      ),
    };
    const content = (
      <>
        {iconElement}
        {labelElement}
        {endContentElement}
      </>
    );
    return (
      <span
        {...pressable}
        {...{ [EDGE_COMP_ATTR]: "" }}
        data-tab-actions=""
        // A press in the wrapper's own padding, outside both the control and
        // the actions, selects the tab as a press anywhere on a tab does.
        onClick={(event) => {
          if (event.target === event.currentTarget) controlRef.current?.click();
        }}
        {...mergeProps(
          surfaceThemeProps,
          focusOutlineProps.focusWithinFirstChild(...surfaceStyles),
          className,
          { ...ACTIONS_WRAPPER_STYLE, ...style },
        )}
      >
        {isLink ? (
          <LinkRoot
            ref={mergedRef as React.Ref<HTMLAnchorElement>}
            href={isDisabled ? undefined : href}
            onClick={handleSelect}
            {...control}
          >
            {content}
          </LinkRoot>
        ) : (
          <button
            ref={mergedRef as React.Ref<HTMLButtonElement>}
            type="button"
            onClick={handleSelect}
            {...control}
          >
            {content}
          </button>
        )}
        <span
          className={CLASS_NAME.endContentWrapper}
          // The strip's arrow keys move between tabs; on an action they would
          // jump to the first or last tab, so they stay with the action.
          onKeyDown={(event) => {
            if (NAVIGATION_KEYS.has(event.key)) event.stopPropagation();
          }}
        >
          {actions}
        </span>
        {hoverBgElement}
        {indicatorElement}
      </span>
    );
  }

  if (isLink) {
    return (
      <LinkRoot
        ref={ref}
        href={isDisabled ? undefined : href}
        onClick={handleSelect}
        {...sharedProps}
      >
        {hoverBgElement}
        {iconElement}
        {labelElement}
        {endContentElement}
        {indicatorElement}
      </LinkRoot>
    );
  }

  return (
    <button ref={ref} type="button" onClick={handleSelect} {...sharedProps}>
      {hoverBgElement}
      {iconElement}
      {labelElement}
      {endContentElement}
      {indicatorElement}
    </button>
  );
}

Tab.displayName = "Tab";
