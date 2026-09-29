/**
 * TextHighlighter
 *
 * Marks every case-insensitive occurrence of `keyword` in a string, for search
 * results. The keyword is matched literally (regex characters are escaped).
 * Without a keyword the text renders plain; without text nothing renders.
 *
 * The mark's background is `--uic-text-highlighter-background`, by default
 * Astryx `--color-warning-muted`; set it on any ancestor to change it.
 *
 * @example
 * <TextHighlighter keyword={search}>{row.name}</TextHighlighter>
 */
import { memo, type CSSProperties, type ReactElement } from "react";

import "./TextHighlighter.css";

export interface TextHighlighterProps {
  /** The text to search in. */
  children?: string | null;
  /** The text to mark. */
  keyword?: string;
  /** Class on the outer span. */
  className?: string;
  /** Inline style of each marked part. */
  highlightStyle?: CSSProperties;
}

const escapeRegExp = (text: string) => text.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

function TextHighlighterBase({
  children,
  keyword,
  className,
  highlightStyle,
}: TextHighlighterProps): ReactElement | null {
  if (!children) return null;
  const rootClassName = ["uic-text-highlighter", className].filter(Boolean).join(" ");
  if (!keyword) return <span className={rootClassName}>{children}</span>;

  const lowerKeyword = keyword.toLowerCase();
  const parts = children.split(new RegExp(`(${escapeRegExp(keyword)})`, "gi"));
  return (
    <span className={rootClassName}>
      {parts.map((part, index) =>
        part.toLowerCase() === lowerKeyword ? (
          <span
            key={index}
            className="uic-text-highlighter__match"
            style={highlightStyle}
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export const TextHighlighter = memo(TextHighlighterBase);
TextHighlighter.displayName = "TextHighlighter";
