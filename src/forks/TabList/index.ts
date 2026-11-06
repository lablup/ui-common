/**
 * `@lablup/ui-common/TabList`: Astryx's TabList subpath, same names and
 * types, with ui-common's copy of `Tab` in place of Astryx's
 * (exports.exclude.json). `TabList`, `TabMenu` and `useTabListContext` are
 * Astryx's own, re-exported unchanged.
 */
export { Tab } from "./Tab";
export type { TabProps } from "./Tab";
export { TabList, TabMenu, useTabListContext } from "@astryxdesign/core/TabList";
export type {
  TabListProps,
  TabListOverflow,
  TabMenuProps,
  TabMenuOption,
  TabListSize,
  TabListLayout,
  TabListPattern,
} from "@astryxdesign/core/TabList";
