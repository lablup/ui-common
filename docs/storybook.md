# Writing stories

Storybook documents ui-common's own components. Config lives in `.storybook/`;
stories live beside the component they cover.

```
pnpm storybook          # dev server on http://localhost:6006
pnpm build-storybook    # static build in storybook-static/
```

## Where

- One stories file per component directory, named after the directory:
  `src/components/StatCard/StatCard.stories.tsx`. A directory is one entry in
  the Storybook sidebar.
- Forks of Astryx components (`src/forks/<Name>/`) follow the same rule.

### A directory with several components

`Skeleton/` exports `SkeletonCard`, `SkeletonText`, `SkeletonRow` and
`SkeletonChart`. It still gets one file, `Skeleton.stories.tsx`, titled
`Components/Skeleton`:

- `component` is the one most used; the rest go in `subcomponents`, so the
  Documentation page shows every member's props.
- One story per member, named after it (`Card`, `Text`, `Row`, `Chart`),
  rendering that member with `render`. A member's variants or states follow,
  prefixed with its name (`CardVariants`).

```tsx
const meta = {
  title: "Components/Skeleton",
  component: SkeletonCard,
  subcomponents: { SkeletonText, SkeletonRow, SkeletonChart },
} satisfies Meta<typeof SkeletonCard>;

export const Card: Story = {};
export const Text: Story = { render: () => <SkeletonText /> };
```

## Meta

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";

import { StatCard } from "./StatCard";

const meta = {
  title: "Components/StatCard",
  component: StatCard,
  args: { label: "Active sessions", value: 1284 },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info"],
    },
  },
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;
```

- `title`: `Components/<Name>` for `src/components`, `Forks/<Name>` for
  `src/forks`.
- `satisfies Meta<typeof X>`, not `: Meta<…>`, so `args` stay type-checked.
- `args`: every required prop, with realistic values.
- `argTypes`: only for union props, as `select` or `inline-radio` with the
  values spelled out. Everything else gets its control from the prop types.
- Import the component relatively (`./StatCard`), never from
  `@lablup/ui-common`.

## Stories

- `Default` comes first and renders with `meta.args` alone.
- Then one story per state a reviewer needs to see: `Loading`, `WithError`,
  `Empty`, `Disabled`, and so on. Name it after the state, in PascalCase.
- To compare variants, one story that renders them side by side (`Tones`) beats
  one story per variant.
- Callback props take `fn()` from `storybook/test`, so calls show in the
  Actions panel.

## Docs

The Documentation page is generated from the component's TypeScript props
(`tags: ["autodocs"]` is global). Its descriptions are the props' JSDoc, so
document a prop in the component, not in the story.

## Providers

The global decorator (`.storybook/decorators.tsx`) already wraps every story in
`<Theme>` and Astryx's `InternationalizationProvider`. A story adds no provider
of its own. A story-level decorator is for layout only, such as a width limit.

## Content

- Sample text in English. Built-in strings (Retry, Dismiss) come from the
  catalog and follow the locale toolbar; pass them as props only when the story
  is about overriding them.
- No styles in stories. A component that needs CSS to look right is missing it.
- This repository is public, and `pnpm check:boundary` scans `src/`. Use
  generic sample data: no internal hostnames, people or unannounced products.

## Check before you push

1. In `pnpm storybook`, switch the toolbar: Theme to **Astryx (neutral)**, dark
   mode on, and a non-English locale. The story must still read correctly.
2. `pnpm typecheck && pnpm lint`.
3. `pnpm build-storybook` succeeds.

A PR that touches `src/` gets a preview: the PR Preview workflow comments with a
link to each changed component's stories, and flags a new component that has
none.
