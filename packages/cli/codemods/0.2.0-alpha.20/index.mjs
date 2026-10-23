/**
 * The 0.2.0-alpha.20 step, ui-common's own part (Astryx's codemods for the
 * same release are in ./upstream.json): the Drawer leaves the lab mirror.
 */
import { CATEGORIES, moveDrawerImports, scanDrawer } from "./drawer.mjs";

/** @type {import('../registry.mjs').Step} */
export default {
  title: "0.2.0-alpha.20: Drawer moves from /lab to /Drawer",
  transforms: [
    {
      id: "drawer-from-lab",
      title: "Import Drawer and DrawerHeader from @lablup/ui-common/Drawer",
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"],
      parse: true,
      run: moveDrawerImports,
    },
  ],
  scan: scanDrawer,
  categories: CATEGORIES,
  notes: [
    "Drawer and DrawerHeader are core components since Astryx 0.7.2: they come from @lablup/ui-common/Drawer (or the root) and no longer need @astryxdesign/lab or lab.css. A project that used lab only for the Drawer can drop both.",
  ],
};
