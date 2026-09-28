/**
 * `Form.ErrorList`: the errors of a list-level rule, which belong to the
 * collection rather than to any row. Uses the item shell's explain classes.
 */
import * as React from "react";

import "./FormItemVisual.css";

export interface ErrorListProps {
  errors?: React.ReactNode[];
  warnings?: React.ReactNode[];
  className?: string;
  style?: React.CSSProperties;
}

const ErrorList: React.FC<ErrorListProps> = ({
  errors = [],
  warnings = [],
  className,
  style,
}) => {
  if (!errors.length && !warnings.length) {
    return null;
  }
  return (
    <div
      className={["uic-form-item__explain", className].filter(Boolean).join(" ")}
      role="alert"
      style={style}
    >
      {errors.map((error, index) => (
        <div key={`e-${index}`} className="uic-form-item__explain-error">
          {error}
        </div>
      ))}
      {warnings.map((warning, index) => (
        <div key={`w-${index}`} className="uic-form-item__explain-warning">
          {warning}
        </div>
      ))}
    </div>
  );
};

export default ErrorList;
