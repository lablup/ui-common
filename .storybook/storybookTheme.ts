import { create } from "storybook/theming/create";

// Storybook's own UI (sidebar, toolbar, docs pages), in the Lablup accent.
// The stories themselves are themed by the decorator, not by this file.
const common = {
  brandTitle: "Lablup UI Common",
  brandUrl: "https://github.com/lablup/ui-common",
  brandTarget: "_blank" as const,
  fontBase: "'Ubuntu Sans', 'Pretendard Variable', 'Helvetica Neue', Arial, sans-serif",
  fontCode: "'Roboto Mono', 'SF Mono', 'Fira Code', Consolas, monospace",
  appBorderRadius: 4,
  inputBorderRadius: 4,
};

export const storybookLightTheme = create({
  base: "light",
  ...common,
  colorPrimary: "#FF7A00",
  colorSecondary: "#DC6B03",
  appBg: "#f5f5f5",
  appContentBg: "#ffffff",
  appPreviewBg: "#ffffff",
  appBorderColor: "#e0e0e0",
  textColor: "#141414",
  textInverseColor: "#ffffff",
  textMutedColor: "#666666",
  barBg: "#ffffff",
  barTextColor: "#666666",
  barSelectedColor: "#FF7A00",
  barHoverColor: "#FF7A00",
  inputBg: "#ffffff",
  inputBorder: "#d9d9d9",
  inputTextColor: "#141414",
});

export const storybookDarkTheme = create({
  base: "dark",
  ...common,
  colorPrimary: "#FF9D00",
  colorSecondary: "#DC6B03",
  appBg: "#111217",
  appContentBg: "#181b1f",
  appPreviewBg: "#181b1f",
  appBorderColor: "#2c2f36",
  textColor: "#e0e0e0",
  textInverseColor: "#111217",
  textMutedColor: "#9b9b9b",
  barBg: "#1f2229",
  barTextColor: "#9b9b9b",
  barSelectedColor: "#FF9D00",
  barHoverColor: "#FF9D00",
  inputBg: "#1f2229",
  inputBorder: "#3d424d",
  inputTextColor: "#e0e0e0",
});
