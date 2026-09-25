// The ui-common token contract is the underlay every theme family overrides.
import "@lablup/ui-common/styles/base.css";
import "@lablup/ui-common/styles/themes/orange-dark.css";
import "./families.css";

export const THEMES = ["orange-light", "orange-dark"] as const;
