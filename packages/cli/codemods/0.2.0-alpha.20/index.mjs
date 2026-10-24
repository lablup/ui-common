/**
 * The 0.2.0-alpha.20 step, ui-common's own part (Astryx's codemods for the
 * same release are in ./upstream.json): the Drawer leaves the lab mirror, and
 * the form controls hand their field chrome to Form.Item (#72).
 */
import {
  CATEGORIES as DRAWER_CATEGORIES,
  moveDrawerImports,
  scanDrawer,
} from "./drawer.mjs";
import {
  CATEGORIES as FIELD_CHROME_CATEGORIES,
  migrateFieldChrome,
  scanFieldChrome,
} from "./field-chrome.mjs";

/** @type {import('../registry.mjs').Step} */
export default {
  title:
    "0.2.0-alpha.20: Drawer moves from /lab to /Drawer; form controls leave their field chrome to Form.Item",
  transforms: [
    {
      id: "drawer-from-lab",
      title: "Import Drawer and DrawerHeader from @lablup/ui-common/Drawer",
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"],
      parse: true,
      run: moveDrawerImports,
    },
    {
      id: "field-chrome",
      title:
        "Rewrite the field chrome ui-common's form controls no longer take (hidden label, isDisabled, status object, CheckboxInput / Switch label)",
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"],
      parse: true,
      run: migrateFieldChrome,
    },
  ],
  scan: (file, source) => [
    ...scanDrawer(file, source),
    ...scanFieldChrome(file, source),
  ],
  categories: { ...DRAWER_CATEGORIES, ...FIELD_CHROME_CATEGORIES },
  notes: [
    "Drawer and DrawerHeader are core components since Astryx 0.7.2: they come from @lablup/ui-common/Drawer (or the root) and no longer need @astryxdesign/lab or lab.css. A project that used lab only for the Drawer can drop both.",
    "ui-common's form controls are Form.Item wrappers (#72): the item owns the label, description, tooltip, required mark and status message, and `disabled` replaces `isDisabled`. A wrapper drops those props even when a spread or plain JavaScript gets them past the types; in development it warns once per control.",
  ],
};
