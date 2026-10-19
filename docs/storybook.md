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
- Forks of Astryx components (`src/forks/<Name>/`) and the form-control
  wrappers (`src/formControls/<Name>/`) follow the same rule.
- A form control's stories show it both ways it is used. On its own:
  `Default` (uncontrolled, named by `aria-label`), `Controlled`, `Statuses`
  and `Disabled`. Inside a `Form.Item`, through `FormItemDemo` from
  `src/stories/formControlStories.tsx`: `InFormItem`, `InFormItemWithValue`,
  `ValidateOnBlur` and `FormDisabled`.

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
  `src/forks`, `Form Controls/<Name>` for `src/formControls`.
- `satisfies Meta<typeof X>`, not `: Meta<…>`, so `args` stay type-checked.
- `args`: every required prop, with realistic values.
- `argTypes`: only for union props, as `select` or `inline-radio` with the
  values spelled out, and for the rule below. Everything else gets its control
  from the prop types.
- A prop that takes a React element (`children`, `icon`, `actions`, `footer`,
  …) gets `control: false` when the stories pass it one. Controls would show
  the element as an object, including the component's whole source. The prop
  still renders and stays in the props table; only the edit field goes.
- Import the component relatively (`./StatCard`), never from
  `@lablup/ui-common`.
- A generic component takes its type argument in both places:
  `component: DataGrid<Resource>` and `satisfies Meta<typeof DataGrid<Resource>>`.
- If `tsc` reports TS2742 on `meta` (the inferred type names an Astryx internal
  path), annotate instead: `const meta: Meta<typeof X> = {…}` with
  `type Story = StoryObj<typeof X>`.

## Stories

- `Default` comes first and renders with `meta.args` alone.
- Then one story per state a reviewer needs to see: `Loading`, `WithError`,
  `Empty`, `Disabled`, and so on. Name it after the state, in PascalCase.
- To compare variants, one story that renders them side by side (`Tones`) beats
  one story per variant.
- Callback props take `fn()` from `storybook/test`, so calls show in the
  Actions panel.
- Interactive state is React state, in a `function Render(args)` or a small
  named component in the stories file. Never Storybook's `useArgs`: the global
  decorator re-renders stories (dark mode, locale), and Storybook hooks throw
  when that happens.

## Overlays

Modals, drawers, popovers and notification stacks portal out of the story.
Use the helpers in `src/stories/helpers.tsx`:

```tsx
parameters: overlayDocs("400px"),
render: function Render(args) {
  const [isOpen, setOpen] = useOpenState(args.isOpen, args.onOpenChange);
  return (
    <>
      <Button label="Open modal" onClick={() => setOpen(true)} />
      <Modal {...args} isOpen={isOpen} onOpenChange={setOpen} />
    </>
  );
},
```

- `overlayDocs(height)` gives each story its own frame on the Documentation
  page, so an open overlay does not cover it.
- `useOpenState` holds the open state, starts from the `isOpen` arg (set it
  to `true` so the story shows the overlay) and reports every change to the
  Actions panel. `useArgState` is the same for any other arg a story changes.

## Docs

The Documentation page is generated from the component's TypeScript props
(`tags: ["autodocs"]` is global). Its descriptions are the props' JSDoc, so
document a prop in the component, not in the story.

## Providers

The global decorator (`.storybook/decorators.tsx`) already wraps every story in
`<Theme>` and Astryx's `InternationalizationProvider`. A story adds no provider
of its own. A story-level decorator is for layout only: `withMaxWidth(360)` from
`src/stories/helpers.tsx` for a component that fills its container.

## Content

- Sample text in English. Built-in strings (Retry, Dismiss) come from the
  catalog and follow the locale toolbar; pass them as props only when the story
  is about overriding them.
- No styles in stories beyond layout (a grid of variants, a scroll container's
  height). A component that needs CSS to look right is missing it.
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
