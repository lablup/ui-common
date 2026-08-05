import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "fixture/node_modules", "fixture/dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      // The boundary this package sells is "no product code". The dedicated
      // script in scripts/check-boundary.mjs covers the cases a resolver
      // cannot see; this catches the ones it can.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@lablup/ui-ai", "@lablup/ui-ai/*"],
              message:
                "The public package must never depend on the private AI package.",
            },
            {
              group: ["@/*"],
              message: "Product path aliases do not exist outside the source product.",
            },
            {
              group: ["react-i18next", "i18next"],
              message:
                "Labels are props supplied by the consumer, not resolved from a locale bundle.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
);
