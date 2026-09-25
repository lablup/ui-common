/**
 * The Lablup brand theme, as Astryx source.
 *
 * It extends Astryx's neutral theme and changes only what the brand owns: the
 * orange accent, the four status hues, and the font family. Everything else
 * keeps the neutral values.
 *
 * `astryx theme build` compiles this file into `built/` (see the
 * `theme:build` script). Rebuild after any change here; `pnpm run
 * theme:check` fails when the committed artifacts are stale.
 *
 * The status and font values come from the 0.1 stylesheets: light from
 * `styles/base.css`, dark from `styles/themes/orange-dark.css`.
 */
import { defineTheme } from "@astryxdesign/core/theme";
import { neutralIconRegistry, neutralTheme } from "@astryxdesign/theme-neutral";

/** The brand accent, light and dark. `--color-on-accent` derives from it. */
export const LABLUP_ACCENT: [string, string] = ["#FF7A00", "#DC6B03"];

/**
 * Astryx has no info token, so the info hue is a theme-local token. It is
 * `uic-` prefixed so it cannot collide with a token Astryx adds later.
 */
export const LABLUP_INFO_TOKEN = "--uic-color-info";

export const lablupTheme = defineTheme({
  name: "lablup",
  extends: neutralTheme,
  // Named so `astryx theme build` emits the registry import. An inherited
  // registry is dropped from the built module.
  icons: neutralIconRegistry,
  color: { accent: LABLUP_ACCENT },
  tokens: {
    "--color-error": ["#c82333", "#dc4446"],
    "--color-success": ["#007a63", "#03a487"],
    "--color-warning": ["#9a5d00", "#d89614"],
    // A token override, not `typography`: a partial `typography` block
    // replaces the inherited type scale. Loading the font stays the app's job.
    "--font-family-body":
      '"Ubuntu Sans", "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    "--font-family-heading":
      '"Ubuntu Sans", "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  localTokens: {
    [LABLUP_INFO_TOKEN]: ["#0066cc", "#009bdd"],
  },
});

export default lablupTheme;
