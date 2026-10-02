/**
 * DoubleToken
 *
 * A run of Tokens welded into one chip, for a settled pair such as a type and
 * its version, or a scope and its name. Its live counterpart is `DoubleBadge`.
 * Neighbours overlap by one border width and square their inner corners.
 *
 * A string value is a blue Token. Values with an empty label are skipped, and
 * an empty list renders nothing. With `highlightKeyword` each label marks the
 * keyword (`TextHighlighter`), and the plain label stays the accessible name.
 * A value's `endContent` takes the place of its visible label (a copy
 * control around the text, say); the caller renders the label in it,
 * highlighted or not, and the plain label stays the accessible name.
 *
 * @example
 * <DoubleToken values={[{ label: "CUDA", color: "green" }, "12.4"]} />
 */
import type { ReactElement, ReactNode } from "react";
import { HStack } from "@astryxdesign/core/Stack";
import { Token, type TokenProps } from "@astryxdesign/core/Token";

import { TextHighlighter } from "../TextHighlighter/TextHighlighter";
import "./DoubleToken.css";

export type DoubleTokenColor = NonNullable<TokenProps["color"]>;

export interface DoubleTokenValue {
  label: string;
  /** @default 'blue' */
  color?: DoubleTokenColor;
  /**
   * Rendered in place of the visible label, which stays the accessible name.
   * The caller renders the label inside it; `highlightKeyword` does not
   * reach into it.
   */
  endContent?: ReactNode;
}

export interface DoubleTokenProps {
  /** The tokens, in order. */
  values?: Array<string | DoubleTokenValue>;
  /** Marks this text in every label. */
  highlightKeyword?: string;
}

export function DoubleToken({
  values = [],
  highlightKeyword,
}: DoubleTokenProps): ReactElement | null {
  if (values.length === 0) return null;
  const objectValues = values.map((value): DoubleTokenValue =>
    typeof value === "string" ? { label: value, color: "blue" } : value,
  );
  const isHighlighting = highlightKeyword !== undefined;

  return (
    <HStack gap={0} align="center" className="uic-double-token">
      {objectValues.map((value, idx) => {
        if (!value.label) return null;
        // Token.label is a string: anything richer is a hidden label plus
        // endContent, so the plain string stays the accessible name.
        const endContent =
          value.endContent !== undefined ? (
            value.endContent
          ) : isHighlighting ? (
            <TextHighlighter keyword={highlightKeyword}>{value.label}</TextHighlighter>
          ) : undefined;
        return (
          <Token
            key={idx}
            className="uic-double-token__item"
            color={value.color ?? "blue"}
            label={value.label}
            isLabelHidden={endContent !== undefined}
            endContent={endContent}
          />
        );
      })}
    </HStack>
  );
}

DoubleToken.displayName = "DoubleToken";
