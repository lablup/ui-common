import type { Meta, StoryObj } from "@storybook/react-vite";
import { useDarkMode } from "@vueless/storybook-dark-mode";

import { defineTheme, Theme } from "../../astryx/theme";
import { neutralTheme } from "../../astryx/theme/neutral/built";
import { lablupTheme } from "../../theme/lablup/built/lablup";

import { DoubleBadge } from "./DoubleBadge";

const meta = {
  title: "Components/DoubleBadge",
  component: DoubleBadge,
  args: {
    values: [{ label: "RUNNING", variant: "success" }, "2m"],
  },
} satisfies Meta<typeof DoubleBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map((variant) => (
        <DoubleBadge
          key={variant}
          values={[{ label: variant.toUpperCase(), variant }, "5m"]}
        />
      ))}
    </div>
  ),
};

/** Badges of one variant: the divider keeps them apart. */
export const SameVariant: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
      <DoubleBadge values={["Draft", "Draft"]} />
      <DoubleBadge
        values={[
          { label: "PENDING", variant: "warning" },
          { label: "Queued", variant: "warning" },
        ]}
      />
    </div>
  ),
};

export const ThreeValues: Story = {
  args: {
    values: [
      { label: "PENDING", variant: "warning" },
      { label: "Queued", variant: "info" },
      "12s",
    ],
  },
};

export const Single: Story = {
  args: { values: ["Draft"] },
};

const outline = (color: string) => `inset 0 0 0 var(--border-width) ${color}`;

/**
 * A tinted badge look, the shape Backend.AI WebUI gives Badge: a light fill,
 * a 1px outline and dark text in one hue, as component overrides on the theme
 * the toolbar picked.
 */
const tintedBadges = {
  badge: {
    "variant:neutral": {
      boxShadow: outline("var(--double-badge-divider, var(--color-border-emphasized))"),
    },
    ...Object.fromEntries(
      (
        [
          ["info", "blue"],
          ["success", "green"],
          ["warning", "yellow"],
          ["error", "red"],
        ] as const
      ).map(([variant, hue]) => [
        `variant:${variant}`,
        {
          backgroundColor: `var(--color-background-${hue})`,
          color: `var(--color-text-${hue})`,
          boxShadow: outline(`var(--color-border-${hue})`),
        },
      ]),
    ),
  },
};

const tintedThemes = {
  lablup: defineTheme({
    name: "lablup-tinted-badges",
    extends: lablupTheme,
    components: tintedBadges,
  }),
  neutral: defineTheme({
    name: "neutral-tinted-badges",
    extends: neutralTheme,
    components: tintedBadges,
  }),
};

function TintedBadges({ themeStyle }: { themeStyle: keyof typeof tintedThemes }) {
  const isDarkMode = useDarkMode();
  return (
    <Theme theme={tintedThemes[themeStyle]} mode={isDarkMode ? "dark" : "light"}>
      <div style={{ display: "grid", gap: 8, justifyItems: "start" }}>
        {(["neutral", "info", "success", "warning", "error"] as const).map(
          (variant) => (
            <DoubleBadge
              key={variant}
              values={[{ label: variant.toUpperCase(), variant }, "5m"]}
            />
          ),
        )}
        <DoubleBadge values={["Draft", "Draft"]} />
        <DoubleBadge
          values={[{ label: "Paused", variant: "warning" }, { label: "Set by user" }]}
        />
        <DoubleBadge values={["Agent", { label: "26.10.0a4", variant: "success" }]} />
      </div>
    </Theme>
  );
}

/**
 * Under a theme that tints and outlines badges (light fill, 1px outline, dark
 * text, as Backend.AI WebUI does): the divider takes the outline's place on
 * the shared column, in the colour of the coloured neighbour's outline.
 */
export const TintedTheme: Story = {
  render: (_args, { globals }) => (
    <TintedBadges
      themeStyle={globals.themeStyle === "neutral" ? "neutral" : "lablup"}
    />
  ),
};
