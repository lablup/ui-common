/**
 * The 0.1 -> 0.2 upgrade step: ui-common moves onto Astryx.
 */
import transformComponents, { meta as componentsMeta } from "./components.mjs";
import { transformPackageJson } from "./package-json.mjs";
import { CATEGORIES, scanFile } from "./scan.mjs";
import {
  cssMeta,
  jsMeta,
  transformScriptImports,
  transformStylesheet,
} from "./stylesheets.mjs";

/** @type {import('../registry.mjs').Step} */
export default {
  title: "0.1 → 0.2: ui-common on Astryx",
  transforms: [
    { ...componentsMeta, run: transformComponents, parse: true },
    { ...jsMeta, run: transformScriptImports, parse: true },
    { ...cssMeta, run: transformStylesheet, parse: false },
  ],
  packageJson: transformPackageJson,
  scan: scanFile,
  categories: CATEGORIES,
  notes: [
    "Badge: the codemod keeps Badge. Astryx reserves Badge for counts and loud status; a settled value (a tag, a category, a state label) reads better as Token (`@lablup/ui-common/Token`, `label` + `color`). Decide per call site.",
    "Button: children became `label` (the accessible name, required). `title` became `tooltip`. Sizes collapse onto sm/md/lg (xsmall → sm).",
    "Select → Selector: `onChange` receives a string value. A 0.1 Select typed over a non-string value needs its own mapping.",
    "StatusTag → StatusDot: a dot with an accessible label, no visible text.",
    "Tabs → TabList and DataTable → Table are reshaped only partly: the TODO markers say what is left.",
    "Drawer → @lablup/ui-common/lab Drawer: `@astryxdesign/lab` is an optional peer of ui-common, pinned to the canary ui-common is built against. The codemod adds it to package.json when it moved a Drawer, and adds `@lablup/ui-common/lab/lab.css` to the stylesheet entry it rewrites; import lab.css yourself if your entry is elsewhere.",
    "Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps library reads resolving until 0.3.",
  ],
};
