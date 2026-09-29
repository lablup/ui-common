/**
 * ListBanner
 *
 * A `Banner` whose description is a list of items, for "these N things will
 * be affected" notices in a dialog. The list scrolls once it passes
 * `maxHeight`, so the dialog does not grow with the selection, and the
 * scrolling list is reachable by keyboard. Say how many items there are in
 * the `title`.
 *
 * Without a `title` the list takes the banner's title slot. Without items
 * there is no list.
 *
 * @example
 * <ListBanner
 *   status="warning"
 *   title={`${users.length} users will be updated`}
 *   items={users.map((user) => ({ key: user.id, content: user.email }))}
 * />
 */
import type { CSSProperties, Key, ReactElement, ReactNode } from "react";
import { Banner, type BannerProps } from "@astryxdesign/core/Banner";

import "./ListBanner.css";

export interface ListBannerItem {
  /** Default: the item's position. */
  key?: Key | null;
  content: ReactNode;
}

export interface ListBannerProps extends Omit<BannerProps, "title" | "description"> {
  title?: ReactNode;
  items: ReadonlyArray<ListBannerItem>;
  /** Height at which the list scrolls. Default: 165 (about seven rows) */
  maxHeight?: number | string;
}

const DEFAULT_MAX_HEIGHT = 165;

export function ListBanner({
  title,
  items,
  maxHeight = DEFAULT_MAX_HEIGHT,
  ...bannerProps
}: ListBannerProps): ReactElement {
  const list =
    items.length === 0 ? undefined : (
      <ul
        // Keyboard users can scroll it.
        tabIndex={0}
        className="uic-list-banner__list"
        style={
          {
            "--uic-list-banner-max-height":
              typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
            // Inline: product sheets reset `ul` unlayered, which beats any layer.
            listStyle: "circle inside",
          } as CSSProperties
        }
      >
        {items.map((item, index) => (
          <li key={item.key ?? `__index-${index}`}>{item.content}</li>
        ))}
      </ul>
    );
  const hasTitle = title !== undefined && title !== null;

  return (
    <Banner
      {...bannerProps}
      title={hasTitle ? title : list}
      description={hasTitle ? list : undefined}
    />
  );
}

ListBanner.displayName = "ListBanner";
