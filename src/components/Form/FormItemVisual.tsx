/**
 * The presentational shell of a form item: label, control, explain and extra,
 * laid out the way antd lays out `Form.Item` (`layout`, `labelCol` /
 * `wrapperCol` spans, `colon`, `labelAlign`, `labelWrap`, `size`,
 * `hasFeedback`, `validateStatus`), so a form moved onto the engine keeps its
 * geometry. Styles are in `FormItemVisual.css`.
 *
 *   .uic-form-item
 *     .uic-form-item__row
 *       .uic-form-item__label-col
 *         label.uic-form-item__label        (+ .uic-form-item__tooltip)
 *         .uic-form-item__label-extra
 *       .uic-form-item__control
 *         .uic-form-item__control-input
 *           .uic-form-item__control-input-content
 *           .uic-form-item__feedback-icon
 *         .uic-form-item__additional
 *           .uic-form-item__explain         (.uic-form-item__explain-error / -warning rows)
 *           .uic-form-item__extra
 *     .uic-form-item__margin-offset
 */
import { CircleHelp } from "lucide-react";
import * as React from "react";
import { Tooltip } from "@astryxdesign/core/Tooltip";

import getFeedbackIcon from "./feedbackIcons";
import "./FormItemVisual.css";

export type FormItemLayout = "vertical" | "horizontal" | "inline";
export type FormItemSize = "small" | "middle" | "large";
export type FormItemStatus = "success" | "warning" | "error" | "validating" | "";

/** antd's `Col` props, reduced to `span`, `offset`, `flex`, `className` and `style`. */
export interface FormItemCol {
  span?: number;
  offset?: number;
  flex?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export interface FormItemVisualProps {
  label?: React.ReactNode;
  /**
   * `<label title>`. Separate from `label` because it is taken from the
   * original prop, before `requiredMark` wraps it: a function mark turns the
   * label into an element and the title would disappear.
   */
  labelTitle?: string;
  /** The tooltip body, rendered behind a help glyph after the label. */
  tooltip?: React.ReactNode;
  /** The tooltip trigger glyph. Defaults to a question mark in a circle. */
  tooltipIcon?: React.ReactNode;
  /**
   * Actions that belong to the label row (e.g. a filter button). Rendered
   * outside the `<label>`, so they stay out of the control's accessible name:
   * at the far end of the row in vertical layout, right after the label
   * otherwise. Needs a `label`.
   */
  labelExtra?: React.ReactNode;
  extra?: React.ReactNode;
  help?: React.ReactNode;
  /** Renders the required marker. Independent of the `required` rule. */
  required?: boolean;
  /**
   * How the marker is drawn: `'optional'` and `'hidden'` hide the asterisk (a
   * function or `'optional'` `requiredMark` puts the hint in the label).
   */
  requiredMarkType?: "optional" | "hidden";
  layout?: FormItemLayout;
  size?: FormItemSize;
  colon?: boolean;
  labelAlign?: "left" | "right";
  labelCol?: FormItemCol;
  wrapperCol?: FormItemCol;
  labelWrap?: boolean;
  errors?: React.ReactNode[];
  warnings?: React.ReactNode[];
  /** Merged validation status; drives colours, the feedback icon and controls. */
  status?: FormItemStatus;
  hasFeedback?: boolean;
  fieldId?: string;
  /** Same handle as the control's `data-uic-field-id`, for a child that forwards nothing to the DOM. */
  fieldHandle?: string;
  htmlFor?: string;
  className?: string;
  style?: React.CSSProperties;
  hidden?: boolean;
  children?: React.ReactNode;
}

const cx = (...names: (string | false | undefined)[]) =>
  names.filter(Boolean).join(" ");

/**
 * antd grid: `span` / `offset` are 24ths. On the label a span is a fixed
 * basis; on the control it is only a max-width, because antd's horizontal
 * control rule (`flex: 1 1 0`) outranks the column's basis.
 */
const GRID_MAX = 24;
const colStyle = (
  col: FormItemCol | undefined,
  role: "label" | "control",
): React.CSSProperties | undefined => {
  if (!col) return undefined;
  const style: React.CSSProperties = { ...col.style };
  if (col.span !== undefined) {
    const pct = `${(col.span / GRID_MAX) * 100}%`;
    style.maxWidth = pct;
    if (role === "label") style.flex = `0 0 ${pct}`;
  }
  if (col.flex !== undefined) {
    style.flex =
      typeof col.flex === "number" ? `${col.flex} ${col.flex} auto` : col.flex;
  }
  if (col.offset !== undefined) {
    style.marginInlineStart = `${(col.offset / GRID_MAX) * 100}%`;
  }
  return style;
};

export const FormItemVisual: React.FC<FormItemVisualProps> = ({
  label,
  labelTitle,
  tooltip,
  tooltipIcon,
  labelExtra,
  extra,
  help,
  required,
  requiredMarkType,
  layout = "vertical",
  size,
  colon,
  labelAlign,
  labelCol,
  wrapperCol,
  labelWrap,
  errors = [],
  warnings = [],
  status,
  hasFeedback,
  fieldId,
  fieldHandle,
  htmlFor,
  className,
  style,
  hidden,
  children,
}) => {
  const hasHelp = help !== undefined && help !== null && help !== false;
  // antd's trigger for the reserved-space / margin-offset pair.
  const hasExplain = hasHelp || errors.length > 0 || warnings.length > 0;

  /**
   * antd reserves the item's own computed `margin-bottom` inside the
   * additional block while an explain block shows, and cancels it with a
   * negative-margin spacer, so one line of error causes no layout jump. The
   * computed value is read, so a `style.marginBottom` override still nets out.
   */
  const itemRef = React.useRef<HTMLDivElement>(null);
  const extraRef = React.useRef<HTMLDivElement>(null);
  const [marginBottom, setMarginBottom] = React.useState<number | null>(null);
  const [extraHeight, setExtraHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    if (hasExplain && itemRef.current) {
      setMarginBottom(
        Number.parseInt(getComputedStyle(itemRef.current).marginBottom, 10) || 0,
      );
    } else {
      setMarginBottom(null);
    }
  }, [hasExplain]);

  React.useLayoutEffect(() => {
    setExtraHeight(extra && extraRef.current ? extraRef.current.clientHeight : 0);
  }, [extra]);

  const hasLabelExtra =
    labelExtra !== undefined && labelExtra !== null && labelExtra !== false;

  const labelNode =
    label === undefined || label === null ? null : (
      <div
        className={cx("uic-form-item__label-col", labelCol?.className)}
        data-align={labelAlign === "left" ? "left" : undefined}
        data-wrap={labelWrap ? "" : undefined}
        data-has-label-extra={hasLabelExtra ? "" : undefined}
        style={colStyle(labelCol, "label")}
      >
        <label
          htmlFor={htmlFor ?? fieldId}
          className={cx(
            "uic-form-item__label",
            required && "uic-form-item__label--required",
          )}
          data-required-mark={requiredMarkType}
          // The colon is drawn in every layout and hidden in vertical, as in
          // antd, so a vertical label measures the same.
          data-no-colon={colon === false ? "" : undefined}
          title={labelTitle ?? (typeof label === "string" ? label : undefined)}
        >
          {label}
          {tooltip ? (
            <Tooltip content={tooltip}>
              <span
                className="uic-form-item__tooltip"
                role="button"
                tabIndex={0}
                aria-label={typeof label === "string" ? `${label} — info` : "info"}
                // The label is a `<label htmlFor>`: a click inside it would
                // move focus to the control the moment the hint is tapped.
                onClick={(e) => e.preventDefault()}
              >
                {tooltipIcon ?? <CircleHelp size="1em" />}
              </span>
            </Tooltip>
          ) : null}
        </label>
        {hasLabelExtra ? (
          // The colon moves here so it still ends the row in horizontal layout.
          <span
            className="uic-form-item__label-extra"
            data-no-colon={colon === false ? "" : undefined}
          >
            {labelExtra}
          </span>
        ) : null}
      </div>
    );

  // antd's `ErrorList`: `help` replaces the error/warning list and takes the
  // item's status, so `validateStatus="error" help="…"` paints the help red.
  const helpKind =
    status === "error" ? "error" : status === "warning" ? "warning" : null;
  const explainRows: Array<{
    key: string;
    node: React.ReactNode;
    kind: "error" | "warning" | null;
  }> = hasHelp
    ? [{ key: "help", node: help, kind: helpKind }]
    : [
        ...errors.map((e, i) => ({ key: `e-${i}`, node: e, kind: "error" as const })),
        ...warnings.map((w, i) => ({
          key: `w-${i}`,
          node: w,
          kind: "warning" as const,
        })),
      ];

  const explainNode = explainRows.length ? (
    <div
      id={fieldId ? `${fieldId}_help` : undefined}
      className="uic-form-item__explain"
    >
      {explainRows.map((row) => (
        <div
          key={row.key}
          className={row.kind ? `uic-form-item__explain-${row.kind}` : undefined}
        >
          {row.node}
        </div>
      ))}
    </div>
  ) : null;

  const extraNode = extra ? (
    <div
      ref={extraRef}
      id={fieldId ? `${fieldId}_extra` : undefined}
      className="uic-form-item__extra"
    >
      {extra}
    </div>
  ) : null;

  const feedbackNode =
    hasFeedback && status ? (
      <span className="uic-form-item__feedback-icon" data-status={status}>
        {getFeedbackIcon(status)}
      </span>
    ) : null;

  const control = (
    <div
      className={cx("uic-form-item__control", wrapperCol?.className)}
      data-span={wrapperCol?.span !== undefined ? "" : undefined}
      style={colStyle(wrapperCol, "control")}
    >
      <div className="uic-form-item__control-input">
        <div className="uic-form-item__control-input-content">{children}</div>
        {feedbackNode}
      </div>
      {explainNode || extraNode ? (
        <div
          className="uic-form-item__additional"
          style={marginBottom ? { minHeight: marginBottom + extraHeight } : undefined}
        >
          {explainNode}
          {extraNode}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      ref={itemRef}
      className={cx("uic-form-item", className)}
      data-uic-field-item={fieldHandle}
      data-layout={layout}
      data-size={size}
      data-status={status || undefined}
      data-feedback={feedbackNode ? "" : undefined}
      data-hidden={hidden ? "" : undefined}
      // `display: none` inline too: hiding a field is a correctness property
      // and must hold even without the stylesheet.
      style={hidden ? { display: "none", ...style } : style}
    >
      <div className="uic-form-item__row">
        {labelNode}
        {control}
      </div>
      {marginBottom ? (
        <div
          aria-hidden
          className="uic-form-item__margin-offset"
          style={{ marginBottom: -marginBottom }}
        />
      ) : null}
    </div>
  );
};

export default FormItemVisual;
