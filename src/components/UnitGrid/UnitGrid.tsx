/**
 * UnitGrid
 *
 * Groups of unit squares packed onto one shared lattice (serpentine or
 * word-wrap), each group merged into a tinted rounded plate, with a hover card
 * anchored to the group, an optional palette picker in it, and a legend row.
 * It knows nothing about what a unit is: callers pass the resolved colour of
 * every unit, the legend entries and the hover card body.
 *
 * Unit colours may be `var()` or `color-mix()` strings. The component resolves
 * them against its own cascade to pick, per group initial, the ink with the
 * better WCAG contrast.
 *
 * @example
 * <UnitGrid
 *   aria-label="GPU allocation"
 *   groups={[{ key: "a", label: "Alpha", units: [{ color: "var(--color-icon-blue)" }] }]}
 * />
 */
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import {
  deriveMetrics,
  extractSegments,
  gridSize,
  groupConsecutiveSegments,
  latticeColsForWidth,
  letterCellIndices,
  packGroups,
  placeCells,
  platePath,
  type UnitGridLayout,
  type UnitGridMetrics,
} from "./UnitGrid.geometry";
import "./UnitGrid.css";

export type { UnitGridLayout } from "./UnitGrid.geometry";

const DEFAULT_MAX_UNITS_PER_GROUP = 256;
/** The seven hues declared in UnitGrid.css. */
const DEFAULT_PALETTE = Array.from(
  { length: 7 },
  (_, i) => `var(--uic-unit-grid-group-${i + 1})`,
);
// Hover card geometry: clamp width, flip threshold, anchor offset, and the
// hide delay that lets the pointer travel onto the card.
const POPOVER_CLAMP_WIDTH = 330;
const POPOVER_FLIP_MIN_TOP = 340;
const POPOVER_OFFSET = 6;
const POPOVER_HIDE_DELAY_MS = 150;
// Legible at both plate stroke widths (1.5 at rest, 2.5 on hover).
const PLATE_DASH_PATTERN = "6 4";
// The initial is vertically centred and fills grow bottom-up, so below this
// fraction the initial sits on the empty underlay: pick ink against that.
const LETTER_ON_EMPTY_MAX_FRACTION = 0.6;
const EMPTY_FILL_COLOR = "var(--uic-unit-grid-cell-empty)";
// The empty fill is translucent; composite it over this before judging it.
const EMPTY_FILL_BACKDROP = "var(--color-background-card)";
const INK_DARK = "var(--uic-unit-grid-ink-dark)";
const INK_LIGHT = "var(--uic-unit-grid-ink-light)";

const cx = (...names: Array<string | false | undefined>) =>
  names.filter(Boolean).join(" ");

const parseAlpha = (raw: string | undefined): number => {
  if (raw === undefined) return 1;
  const v = parseFloat(raw);
  if (!Number.isFinite(v)) return 1;
  return raw.endsWith("%") ? v / 100 : v;
};

/** `[r, g, b (0..255), alpha (0..1)]` of `#rrggbb`, `rgb()` or `color(srgb)`. */
const parseColorChannels = (color: string): [number, number, number, number] | null => {
  const trimmed = color.trim();
  const hex = /^#?([0-9a-f]{6})$/i.exec(trimmed);
  if (hex) {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16));
    return [r!, g!, b!, 1];
  }
  const rgb =
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.%]+))?/.exec(
      trimmed,
    );
  if (rgb) {
    return [
      parseFloat(rgb[1]!),
      parseFloat(rgb[2]!),
      parseFloat(rgb[3]!),
      parseAlpha(rgb[4]),
    ];
  }
  // color-mix() and color() fills serialize as `color(srgb r g b / a)`, 0..1.
  const srgb =
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?/.exec(trimmed);
  if (srgb) {
    return [
      parseFloat(srgb[1]!) * 255,
      parseFloat(srgb[2]!) * 255,
      parseFloat(srgb[3]!) * 255,
      parseAlpha(srgb[4]),
    ];
  }
  return null;
};

const luminanceOfChannels = (channels: [number, number, number]): number => {
  const [r, g, b] = channels.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

/** WCAG relative luminance, alpha ignored. */
const relativeLuminance = (color: string | undefined): number | null => {
  const channels = color === undefined ? null : parseColorChannels(color);
  return channels ? luminanceOfChannels([channels[0], channels[1], channels[2]]) : null;
};

const contrastRatio = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Keyboard activation for the SVG `role="button"` picker controls. */
const activateOnKey = (e: KeyboardEvent<SVGSVGElement>, action: () => void): void => {
  if (e.key === "Enter" || e.key === " ") {
    // Space must not scroll the page while it activates the control.
    if (e.key === " ") e.preventDefault();
    action();
  }
};

/**
 * Resolve CSS colour strings, `var()` included, to computed colours through
 * hidden probes under `host`, so they see the component's own cascade.
 */
const resolveColorsInDOM = (
  host: HTMLElement,
  colors: readonly string[],
): Record<string, string> => {
  const probeHost = document.createElement("div");
  probeHost.setAttribute("aria-hidden", "true");
  probeHost.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;overflow:hidden";
  const probes = colors.map((color) => {
    const el = document.createElement("div");
    el.style.color = color;
    probeHost.appendChild(el);
    return el;
  });
  host.appendChild(probeHost);
  const out: Record<string, string> = {};
  colors.forEach((color, i) => {
    out[color] = getComputedStyle(probes[i]!).color;
  });
  host.removeChild(probeHost);
  return out;
};

/**
 * Origin of the hover card's `position: fixed` containing block, in viewport
 * coordinates. A transformed ancestor (a drawer panel is one) takes over from
 * the viewport, so measured viewport rects are rebased onto it. (0, 0) when
 * the viewport is the origin.
 */
const fixedOriginIn = (host: HTMLElement): { left: number; top: number } => {
  const probe = document.createElement("div");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none";
  host.appendChild(probe);
  const r = probe.getBoundingClientRect();
  host.removeChild(probe);
  return { left: r.left, top: r.top };
};

const readMetricsFromDOM = (host: HTMLElement): UnitGridMetrics => {
  const cs = getComputedStyle(host);
  const len = (name: string, fallback: number): number => {
    const v = parseFloat(cs.getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  };
  return deriveMetrics(
    len("--spacing-4", 16),
    len("--spacing-0-5", 2),
    Math.min(len("--radius-element", 4), 4),
  );
};

export interface UnitGridUnit {
  /** Fill colour of this unit's cell. */
  color: string;
  /** 0..1 partial fill; a fractional cell fills bottom-up. */
  fraction?: number;
}

export interface UnitGridGroup {
  key: string;
  /** The group initial and the hover card title. @default key */
  label?: string;
  units: UnitGridUnit[];
  /** Plate outline; `dashed` marks a group as tentative. @default 'solid' */
  plateVariant?: "solid" | "dashed";
}

export interface UnitGridLegendItem {
  color: string;
  label: string;
}

export interface UnitGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  groups: UnitGridGroup[];
  /** How groups flow along the lattice. @default 'serpentine' */
  layout?: UnitGridLayout;
  /** Group hues, cycled in flow order. @default the seven --uic-unit-grid-group-N hues */
  groupPalette?: string[];
  /** Controlled palette-index overrides, keyed by group key. */
  hueOverrides?: Record<string, number>;
  /** Shows the palette picker in the hover card. */
  onHueOverrideChange?: (key: string, paletteIndex: number) => void;
  legendItems?: UnitGridLegendItem[];
  /** The hover card body for a group. */
  renderGroupPopover?: (
    group: UnitGridGroup,
    context: { hue: string; closePopover: () => void },
  ) => ReactNode;
  onClickGroup?: (key: string) => void;
  /** Rendered instead of the grid when no group has a unit. */
  emptyFallback?: ReactNode;
  /** Units drawn per group at most. @default 256 */
  maxUnitsPerGroup?: number;
  /**
   * Fixed lattice column count. Without it the count follows the measured
   * width (ResizeObserver); pass it for fixed layouts and in jsdom.
   */
  columns?: number;
  /** @default the catalog's uic.UnitGrid.changeGroupColor ("Change group color") */
  changeGroupColorLabel?: string;
  /** @default the catalog's uic.UnitGrid.useColor ("Use color {index}") */
  colorSwatchLabel?: (index: number) => string;
}

export function UnitGrid({
  groups,
  layout = "serpentine",
  groupPalette,
  hueOverrides,
  onHueOverrideChange,
  legendItems,
  renderGroupPopover,
  onClickGroup,
  emptyFallback,
  maxUnitsPerGroup = DEFAULT_MAX_UNITS_PER_GROUP,
  columns,
  changeGroupColorLabel,
  colorSwatchLabel,
  className,
  ...divProps
}: UnitGridProps) {
  const t = useUicTranslator();
  const palette =
    groupPalette && groupPalette.length > 0 ? groupPalette : DEFAULT_PALETTE;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [wrapperWidth, setWrapperWidth] = useState(0);

  const visibleGroups = groups.filter((g) => g.units.length > 0);
  const hasGroups = visibleGroups.length > 0;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWrapperWidth(entries[0]?.contentRect.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasGroups]);

  // Concrete colours (for the ink decision) and token-derived metrics,
  // resolved against the live cascade. Paint uses the raw strings, so var()
  // fills keep following the theme; only the ink decision is a snapshot.
  const [metrics, setMetrics] = useState<UnitGridMetrics>(() => deriveMetrics());
  const [resolvedColors, setResolvedColors] = useState<Record<string, string>>({});
  const distinctColors = Array.from(
    new Set(visibleGroups.flatMap((g) => g.units.map((u) => u.color))),
  );
  const colorsKey = distinctColors.join(" ");
  const refreshResolved = useEffectEvent(() => {
    const host = rootRef.current;
    if (!host) return;
    const nextMetrics = readMetricsFromDOM(host);
    setMetrics((prev) =>
      prev.cellPx === nextMetrics.cellPx &&
      prev.gapPx === nextMetrics.gapPx &&
      prev.radiusPx === nextMetrics.radiusPx
        ? prev
        : nextMetrics,
    );
    const next = resolveColorsInDOM(host, [
      ...distinctColors,
      EMPTY_FILL_COLOR,
      EMPTY_FILL_BACKDROP,
      INK_DARK,
      INK_LIGHT,
    ]);
    setResolvedColors((prev) => {
      const keys = Object.keys(next);
      const same =
        keys.length === Object.keys(prev).length &&
        keys.every((k) => prev[k] === next[k]);
      return same ? prev : next;
    });
  });
  // A theme flip changes what the same var() strings resolve to, so the ink
  // snapshot re-probes when the root's theme attributes change.
  const [themeEpoch, setThemeEpoch] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeEpoch((e) => e + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-astryx-theme", "class", "style"],
    });
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    refreshResolved();
    // refreshResolved is an effect event: it is never a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorsKey, themeEpoch]);

  // Hover card: hiding is delayed so the pointer can travel onto it.
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = setTimeout(() => {
      setHoverKey(null);
      setPickerFor(null);
    }, POPOVER_HIDE_DELAY_MS);
  };
  useEffect(() => cancelHide, []);

  // The group the picker was opened for; hovering another group closes it.
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const pickerOpen = pickerFor !== null && pickerFor === hoverKey;

  const [wrapperRect, setWrapperRect] = useState<{
    left: number;
    top: number;
    originLeft: number;
    originTop: number;
  } | null>(null);
  useEffect(() => {
    if (hoverKey !== null) {
      const host = wrapperRef.current;
      const r = host?.getBoundingClientRect();
      const origin = host ? fixedOriginIn(host) : null;
      setWrapperRect(
        r && origin
          ? { left: r.left, top: r.top, originLeft: origin.left, originTop: origin.top }
          : null,
      );
    }
  }, [hoverKey]);

  // The card is fixed, so any scroll moves its anchor: dismiss it.
  const hoverOpen = hoverKey !== null;
  useEffect(() => {
    if (!hoverOpen) return;
    const onScroll = () => {
      setHoverKey(null);
      setPickerFor(null);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [hoverOpen]);

  const groupByKey = new Map(visibleGroups.map((g) => [g.key, g]));
  const flowIndexByKey = new Map(visibleGroups.map((g, i) => [g.key, i]));

  // Default hues cycle the palette in flow order, so neighbours differ;
  // overrides are keyed by the group's stable key.
  const hueIndexFor = (key: string): number => {
    const base = hueOverrides?.[key] ?? flowIndexByKey.get(key) ?? 0;
    return ((base % palette.length) + palette.length) % palette.length;
  };
  const hueFor = (key: string): string => palette[hueIndexFor(key)]!;

  const letterFor = (key: string): string => {
    const group = groupByKey.get(key);
    return ((group?.label || key).charAt(0) || "?").toUpperCase();
  };

  const inkDarkLuminance = relativeLuminance(resolvedColors[INK_DARK]) ?? 0;
  const inkLightLuminance = relativeLuminance(resolvedColors[INK_LIGHT]) ?? 1;
  const inkForLuminance = (fillLuminance: number | null): string => {
    // An unresolved fill (first paint, jsdom) is taken as light.
    const lum = fillLuminance ?? 0.8;
    return contrastRatio(lum, inkDarkLuminance) >= contrastRatio(lum, inkLightLuminance)
      ? INK_DARK
      : INK_LIGHT;
  };

  const inkFor = (color: string): string =>
    inkForLuminance(relativeLuminance(resolvedColors[color] ?? color));

  const emptyFillLuminance = ((): number | null => {
    const fg = parseColorChannels(resolvedColors[EMPTY_FILL_COLOR] ?? "");
    if (!fg) return null;
    if (fg[3] >= 1) return luminanceOfChannels([fg[0], fg[1], fg[2]]);
    const bg = parseColorChannels(resolvedColors[EMPTY_FILL_BACKDROP] ?? "");
    if (!bg) return null;
    const a = fg[3];
    return luminanceOfChannels([
      fg[0] * a + bg[0] * (1 - a),
      fg[1] * a + bg[1] * (1 - a),
      fg[2] * a + bg[2] * (1 - a),
    ]);
  })();

  const letterInkFor = (unit: UnitGridUnit): string =>
    unit.fraction !== undefined && unit.fraction < LETTER_ON_EMPTY_MAX_FRACTION
      ? inkForLuminance(emptyFillLuminance)
      : inkFor(unit.color);

  const latticeCols = columns ?? latticeColsForWidth(wrapperWidth, metrics);
  const packed = packGroups(visibleGroups, maxUnitsPerGroup);
  const placed = placeCells(packed, layout, latticeCols, metrics);
  const { width: svgWidth, height: svgHeight } = gridSize(placed, latticeCols, metrics);
  const segGroups = groupConsecutiveSegments(extractSegments(placed, metrics));
  const letterIdx = letterCellIndices(placed);

  const hoveredGroup = hoverKey === null ? null : (groupByKey.get(hoverKey) ?? null);
  const hoverAnchorIdx = hoverKey === null ? undefined : letterIdx.get(hoverKey);
  const hoverAnchor =
    hoverAnchorIdx === undefined ? null : (placed[hoverAnchorIdx] ?? null);
  const closePopover = () => {
    setHoverKey(null);
    setPickerFor(null);
  };

  const groupKeyFromEvent = (e: MouseEvent): string | null =>
    (e.target as Element).getAttribute?.("data-group-key") ?? null;

  const showGrid = hasGroups && (columns !== undefined || wrapperWidth > 0);
  const showPopover =
    hoveredGroup !== null &&
    hoverKey !== null &&
    hoverAnchor !== null &&
    wrapperRect !== null &&
    (renderGroupPopover !== undefined || onHueOverrideChange !== undefined);

  const togglePicker = () => setPickerFor((v) => (v === hoverKey ? null : hoverKey));

  return (
    <VStack
      ref={rootRef}
      gap={3}
      align="stretch"
      className={cx("uic-unit-grid", className)}
      {...divProps}
    >
      {legendItems && legendItems.length > 0 && (
        <HStack gap={3} wrap="wrap" align="center">
          {legendItems.map((item, i) => (
            <HStack key={i} gap={1} align="center">
              <svg width={10} height={10} role="img" aria-label={item.label}>
                <rect width={10} height={10} rx={2} style={{ fill: item.color }} />
              </svg>
              <Text size="sm" color="secondary">
                {item.label}
              </Text>
            </HStack>
          ))}
        </HStack>
      )}
      {!hasGroups ? (
        (emptyFallback ?? null)
      ) : (
        <div ref={wrapperRef} className="uic-unit-grid__wrapper">
          {showGrid && (
            <svg
              width={svgWidth}
              height={svgHeight}
              role="img"
              aria-label={divProps["aria-label"] ?? t("uic.UnitGrid.label")}
              className={cx(
                "uic-unit-grid__svg",
                onClickGroup !== undefined && "uic-unit-grid__svg--clickable",
              )}
              onMouseMove={(e) => {
                const key = groupKeyFromEvent(e);
                if (key === null) {
                  scheduleHide();
                } else {
                  cancelHide();
                  setHoverKey(key);
                }
              }}
              onMouseLeave={scheduleHide}
              onClick={(e) => {
                const key = groupKeyFromEvent(e);
                if (key !== null && onClickGroup) onClickGroup(key);
              }}
            >
              {segGroups.map((segs) => {
                const key = segs[0]!.groupKey;
                const group = groupByKey.get(key);
                const hue = hueFor(key);
                const hovered = hoverKey === key;
                // Hover strengthens the hovered group's tint and border
                // rather than dimming the others.
                return (
                  <path
                    key={key}
                    data-group-key={key}
                    d={platePath(segs, metrics)}
                    style={{ fill: hue, stroke: hue }}
                    fillOpacity={hovered ? 0.32 : 0.15}
                    strokeWidth={hovered ? 2.5 : 1.5}
                    strokeDasharray={
                      group?.plateVariant === "dashed" ? PLATE_DASH_PATTERN : undefined
                    }
                  />
                );
              })}
              {placed.map((cell, i) => {
                const isPartial =
                  cell.unit.fraction !== undefined && cell.unit.fraction < 1;
                const cellHovered = hoverKey === cell.groupKey;
                return (
                  <g key={i}>
                    <rect
                      className="uic-unit-grid__cell"
                      data-group-key={cell.groupKey}
                      x={cell.px}
                      y={cell.py}
                      width={metrics.cellPx}
                      height={metrics.cellPx}
                      rx={metrics.radiusPx}
                      style={{
                        fill: isPartial ? EMPTY_FILL_COLOR : cell.unit.color,
                        stroke: cellHovered
                          ? hueFor(cell.groupKey)
                          : "var(--uic-unit-grid-cell-stroke)",
                      }}
                      strokeWidth={cellHovered ? 1 : 0.5}
                    />
                    {isPartial && (
                      <rect
                        data-group-key={cell.groupKey}
                        x={cell.px}
                        y={cell.py + metrics.cellPx * (1 - (cell.unit.fraction ?? 0))}
                        width={metrics.cellPx}
                        height={metrics.cellPx * (cell.unit.fraction ?? 0)}
                        rx={1}
                        style={{ fill: cell.unit.color }}
                      />
                    )}
                    {letterIdx.get(cell.groupKey) === i && (
                      <text
                        x={cell.px + metrics.cellPx / 2}
                        y={cell.py + metrics.cellPx / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={metrics.cellPx * 0.62}
                        fontWeight={700}
                        pointerEvents="none"
                        style={{ fill: letterInkFor(cell.unit) }}
                      >
                        {letterFor(cell.groupKey)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
          {/* role="img" flattens the svg for assistive technology, so the
              groups are listed here as well. */}
          <VisuallyHidden as="ul">
            {visibleGroups.map((g) => (
              <li key={g.key}>{g.label || g.key}</li>
            ))}
          </VisuallyHidden>
          {showPopover && (
            <div
              className="uic-unit-grid__popover"
              onMouseEnter={cancelHide}
              onMouseLeave={scheduleHide}
              style={{
                borderColor: hueFor(hoverKey),
                ...(() => {
                  const viewportLeft =
                    wrapperRect.left +
                    Math.max(
                      0,
                      Math.min(
                        hoverAnchor.px - metrics.platePadX,
                        Math.max(0, wrapperWidth - POPOVER_CLAMP_WIDTH),
                      ),
                    );
                  const cellTop = wrapperRect.top + hoverAnchor.py;
                  // Above the cell when the viewport has room, else below;
                  // decided in viewport space, then rebased onto the block
                  // the offsets resolve against.
                  const flipAbove = cellTop >= POPOVER_FLIP_MIN_TOP;
                  const viewportTop = flipAbove
                    ? cellTop - metrics.platePadY - POPOVER_OFFSET
                    : cellTop + metrics.cellPx + metrics.platePadY + POPOVER_OFFSET;
                  const left = viewportLeft - wrapperRect.originLeft;
                  const top = viewportTop - wrapperRect.originTop;
                  return flipAbove
                    ? { left, top, transform: "translateY(-100%)" }
                    : { left, top };
                })(),
              }}
            >
              <VStack gap={1.5} align="stretch">
                {pickerOpen && onHueOverrideChange && (
                  <HStack gap={1} align="center">
                    {palette.map((hue, pi) => {
                      const pickThis = () => {
                        onHueOverrideChange(hoverKey, pi);
                        setPickerFor(null);
                      };
                      const selected = hueIndexFor(hoverKey) === pi;
                      return (
                        <svg
                          key={pi}
                          width={20}
                          height={20}
                          role="button"
                          tabIndex={0}
                          aria-label={
                            colorSwatchLabel
                              ? colorSwatchLabel(pi + 1)
                              : t("uic.UnitGrid.useColor", { index: pi + 1 })
                          }
                          className="uic-unit-grid__swatch"
                          onClick={pickThis}
                          onKeyDown={(e) => activateOnKey(e, pickThis)}
                        >
                          <rect
                            x={1}
                            y={1}
                            width={18}
                            height={18}
                            rx={5}
                            style={{ fill: hue, stroke: hue }}
                            fillOpacity={0.35}
                            strokeWidth={selected ? 2 : 1}
                          />
                          {selected && (
                            <text
                              x={10}
                              y={10.5}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={11}
                              fontWeight={700}
                              pointerEvents="none"
                              style={{ fill: hue }}
                            >
                              ✓
                            </text>
                          )}
                        </svg>
                      );
                    })}
                  </HStack>
                )}
                {onHueOverrideChange && (
                  <HStack gap={1.5} align="center">
                    <svg
                      width={16}
                      height={16}
                      role="button"
                      tabIndex={0}
                      aria-label={
                        changeGroupColorLabel ?? t("uic.UnitGrid.changeGroupColor")
                      }
                      className="uic-unit-grid__swatch"
                      onClick={togglePicker}
                      onKeyDown={(e) => activateOnKey(e, togglePicker)}
                    >
                      <rect
                        x={1}
                        y={1}
                        width={14}
                        height={14}
                        rx={4}
                        style={{ fill: hueFor(hoverKey), stroke: hueFor(hoverKey) }}
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                      />
                    </svg>
                    <Text size="sm" weight="semibold">
                      {hoveredGroup.label || hoveredGroup.key}
                    </Text>
                  </HStack>
                )}
                {renderGroupPopover?.(hoveredGroup, {
                  hue: hueFor(hoverKey),
                  closePopover,
                })}
              </VStack>
            </div>
          )}
        </div>
      )}
    </VStack>
  );
}

UnitGrid.displayName = "UnitGrid";
