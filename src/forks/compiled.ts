/**
 * The forks under src/forks/ are Astryx source with upstream fixes applied.
 * ui-common has no StyleX compile step, so a fork does not run
 * `stylex.create`: each of its style namespaces is the object Astryx's own
 * build compiled for the same pinned version, copied from the package's
 * `dist/`. Its atomic class names are therefore exactly upstream's, and their
 * rules already reach the page through `@lablup/ui-common/astryx.css` (core)
 * and `@lablup/ui-common/lab/lab.css` (lab), in Astryx's own layer. A fork
 * adds no CSS of its own and cannot drift from the component it replaces
 * while the pin holds; `forks.test.ts` fails when the pin moves.
 */
import type { StyleXStyles } from "@stylexjs/stylex";

/** One compiled StyleX namespace entry: `{ <property key>: "<classes>", $$css: true }`. */
export type CompiledStyle = Readonly<Record<string, string | boolean>>;

/** Types a compiled namespace for `stylex.props` and `xstyle`. */
export function compiledStyles<K extends string>(
  styles: Record<K, CompiledStyle>,
): Record<K, StyleXStyles> {
  return styles as unknown as Record<K, StyleXStyles>;
}
