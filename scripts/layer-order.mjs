/**
 * The cascade layer order ui-common is built for, in one place.
 *
 * `ui-common` must sit after Astryx's `astryx-base` and `astryx-theme` so the
 * composites beat the primitives they restyle, and before the consumer's
 * `components` and `utilities`. A layer's position is fixed by the first
 * stylesheet that names it, and every component module imports its own
 * stylesheet, so a consumer's order statement in the app entry CSS usually
 * arrives after `@layer ui-common{…}` already did, which makes `ui-common` the
 * lowest layer of all. The build therefore puts this statement at the top of
 * every stylesheet the package ships (`vite.config.ts`, `layerOrderPreamble`).
 * Repeating an identical statement is a no-op.
 */

/** Layer names, lowest priority first. */
export const LAYER_ORDER = Object.freeze([
  "reset",
  "theme",
  "base",
  "astryx-base",
  "astryx-theme",
  "ui-common",
  "components",
  "utilities",
]);

/** The statement, byte for byte what README and the fixture declare. */
export const LAYER_ORDER_STATEMENT = `@layer ${LAYER_ORDER.join(", ")};`;

/**
 * `css` with the order statement in front. A leading `@charset` stays first,
 * as the spec requires; a sheet that already starts with the statement is
 * returned unchanged. A layer statement may precede `@import`, so the one-line
 * Astryx mirrors take it too.
 */
export function withLayerOrder(css) {
  const charset = css.match(/^@charset\s+"[^"]*";\s*/);
  const head = charset ? charset[0] : "";
  const rest = css.slice(head.length);
  if (rest.startsWith(LAYER_ORDER_STATEMENT)) return css;
  return `${head}${LAYER_ORDER_STATEMENT}\n${rest}`;
}

/**
 * Whether `css` declares the full order before it opens or names any layer.
 * Leading comments and an `@charset` are skipped.
 */
export function startsWithLayerOrder(css) {
  const stripped = css
    .replace(/^\uFEFF/, "")
    .replace(/^(?:\s*\/\*[\s\S]*?\*\/)*\s*/, "")
    .replace(/^@charset\s+"[^"]*";\s*/, "");
  return stripped.startsWith(LAYER_ORDER_STATEMENT);
}

/**
 * The order a stylesheet actually establishes for its top-level layers: each
 * name in the order its first `@layer` rule (statement or block) names it.
 * This is what the cascade uses, and it survives minifiers that rewrite or
 * fold layer statements (Lightning CSS turns a leading statement into the
 * blocks that follow it), so it is what a consumer bundle is checked by.
 */
export function effectiveLayerOrder(css) {
  const source = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
  const order = [];
  let depth = 0;
  const token = /@layer\s*([^;{]*)([;{])|[{}]/g;
  for (const match of source.matchAll(token)) {
    if (match[0] === "{") depth += 1;
    else if (match[0] === "}") depth -= 1;
    else {
      if (depth === 0) {
        for (const name of match[1].split(",").map((n) => n.trim())) {
          if (name && !order.includes(name)) order.push(name);
        }
      }
      if (match[2] === "{") depth += 1;
    }
  }
  return order;
}
