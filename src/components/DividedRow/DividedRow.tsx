/**
 * DividedRow
 *
 * Lays its children out in a wrapping row and draws a vertical divider
 * between neighbours on the same line only: an item that ends a line has no
 * divider after it, so a wrapped row never starts or ends with a stray rule.
 * The divider sits in the middle of the column gap and takes no space.
 *
 * Which items end a line is measured after layout, and again whenever the row
 * or an item resizes.
 *
 * @example
 * <DividedRow>
 *   <Stat label="CPU" value="4" />
 *   <Stat label="Memory" value="16 GiB" />
 * </DividedRow>
 */
import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import "./DividedRow.css";

export interface DividedRowProps {
  children?: ReactNode;
  /** Whether items flow onto more lines. @default 'wrap' */
  wrap?: "wrap" | "nowrap";
  /** Gap between lines. A number is pixels. @default var(--spacing-8) (32px) */
  rowGap?: number | string;
  /**
   * Gap between items on a line; the divider sits in its middle. A number is
   * pixels. @default var(--spacing-12) (48px)
   */
  columnGap?: number | string;
  /** Divider thickness in pixels. @default 1 */
  dividerWidth?: number;
  /** Divider colour. @default var(--color-border) */
  dividerColor?: string;
  /** How far the divider stops short of the item's top and bottom, in pixels. @default 0 */
  dividerInset?: number;
  /** Inline styles on each item's wrapper. */
  itemStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
}

const toLength = (value: number | string) =>
  typeof value === "number" ? `${value}px` : value;

export function DividedRow({
  children,
  wrap = "wrap",
  rowGap = "var(--spacing-8)",
  columnGap = "var(--spacing-12)",
  dividerWidth = 1,
  dividerColor,
  dividerInset = 0,
  itemStyle,
  className,
  style,
}: DividedRowProps) {
  const items = Children.toArray(children).filter(Boolean);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [lineEnds, setLineEnds] = useState<boolean[]>([]);

  const measureRef = useRef(() => {});
  measureRef.current = () => {
    const nodes = itemRefs.current
      .slice(0, items.length)
      .filter((node): node is HTMLDivElement => node !== null);
    const next = nodes.map(
      (node, i) => i === nodes.length - 1 || nodes[i + 1]!.offsetTop > node.offsetTop,
    );
    setLineEnds((prev) =>
      prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next,
    );
  };

  useLayoutEffect(() => {
    itemRefs.current.length = items.length;
    measureRef.current();
  }, [items.length]);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const measure = () => measureRef.current();
    const rowObserver = new ResizeObserver(measure);
    rowObserver.observe(root);
    const itemObserver = new ResizeObserver(measure);
    itemRefs.current.forEach((node) => node && itemObserver.observe(node));
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      rowObserver.disconnect();
      itemObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={["uic-divided-row", className].filter(Boolean).join(" ")}
      style={
        {
          flexWrap: wrap,
          rowGap: toLength(rowGap),
          columnGap: toLength(columnGap),
          "--uic-divided-row-column-gap": toLength(columnGap),
          ...style,
        } as CSSProperties
      }
    >
      {items.map((child, i) => (
        <div
          key={isValidElement(child) && child.key !== null ? child.key : i}
          ref={(node) => {
            itemRefs.current[i] = node;
          }}
          className="uic-divided-row__item"
          style={itemStyle}
        >
          {child}
          <span
            aria-hidden
            className="uic-divided-row__divider"
            style={{
              top: dividerInset,
              bottom: dividerInset,
              width: dividerWidth,
              background: dividerColor,
              visibility:
                (lineEnds[i] ?? i === items.length - 1) ? "hidden" : "visible",
            }}
          />
        </div>
      ))}
    </div>
  );
}

DividedRow.displayName = "DividedRow";
