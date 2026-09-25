/**
 * The 0.1 -> 0.2 upgrade step: ui-common moves onto Astryx. Its data is
 * `migration/0.1-to-0.2.json` (see ./map.mjs).
 */
import transformComponents, { meta as componentsMeta } from "./components.mjs";
import { LAB_CSS, LAB_PACKAGE, REMOVED, UIC } from "./map.mjs";
import { transformPackageJson } from "./package-json.mjs";
import { CATEGORIES, scanFile } from "./scan.mjs";
import {
  cssMeta,
  jsMeta,
  transformScriptImports,
  transformStylesheet,
} from "./stylesheets.mjs";

/**
 * One note per removed component the run met: where it went, the map's
 * alternatives, and its manual notes.
 *
 * @param {{flags: {touched: Set<string>, packages: Map<string, string>}}} ctx
 */
function notes(ctx) {
  const out = [];
  for (const name of [...ctx.flags.touched].sort()) {
    const removed = REMOVED.get(name);
    if (!removed) continue;
    const alternatives = removed.spec.alternatives.map(
      (a) => `${Object.values(a.names)[0]} (${a.specifier}) when ${a.when}`,
    );
    out.push(
      `${name} → ${removed.to} (${removed.subpath ? `${UIC}/${removed.subpath}` : UIC})` +
        `${alternatives.length > 0 ? `; or ${alternatives.join("; ")}` : ""}. ` +
        removed.spec.manual.join(" "),
    );
  }
  if (ctx.flags.packages.has(LAB_PACKAGE)) {
    out.push(
      `A Drawer moved to ${UIC}/lab: ${LAB_PACKAGE} is an optional peer of ui-common, pinned to the canary it is built against. The codemod added it to package.json and ${LAB_CSS} to the stylesheet entry it rewrote; import lab.css yourself if your entry is elsewhere.`,
    );
  }
  out.push(
    "Products' own `--token-*` reads were not rewritten: they belong to your token system. `legacy-tokens.css` keeps them resolving until 0.3.",
  );
  return out;
}

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
  notes,
};
