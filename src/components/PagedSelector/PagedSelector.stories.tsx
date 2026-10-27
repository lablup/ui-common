import { useCallback, useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import {
  PagedSelector,
  type PagedSelectorMultipleProps,
  type PagedSelectorOption,
  type PagedSelectorSingleProps,
} from "./PagedSelector";
import { useArgState, withMaxWidth } from "../../stories/helpers";

const ALL_ITEMS: PagedSelectorOption[] = Array.from({ length: 120 }, (_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return {
    value: `item-${n}`,
    label: `Item ${n}`,
    description: `Created ${(i % 28) + 1} days ago`,
    // Every 17th is disabled; every other one of those says why.
    isDisabled:
      i % 17 === 16 && Math.floor(i / 17) % 2 === 0
        ? { reason: "Archived items cannot be picked." }
        : i % 17 === 16,
  };
});

const PAGE_SIZE = 20;

/** A fake server: one page of items matching `query`, after a short delay. */
function fetchPage(query: string, offset: number) {
  const matches = ALL_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return new Promise<{ items: PagedSelectorOption[]; total: number }>((resolve) =>
    setTimeout(
      () =>
        resolve({
          items: matches.slice(offset, offset + PAGE_SIZE),
          total: matches.length,
        }),
      400,
    ),
  );
}

/** Pages through `fetchPage`, restarting on a new query and dropping stale replies. */
function useFakePages() {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PagedSelectorOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    setIsLoading(true);
    // A page still loading for the old query is dropped below; clear its flag.
    setIsLoadingMore(false);
    setOptions([]);
    fetchPage(query, 0).then(({ items, total }) => {
      if (id !== request.current) return;
      setOptions(items);
      setTotalCount(total);
      setIsLoading(false);
    });
  }, [query]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || options.length >= totalCount) return;
    const id = request.current;
    setIsLoadingMore(true);
    fetchPage(query, options.length).then(({ items }) => {
      if (id !== request.current) return;
      setOptions((prev) => [...prev, ...items]);
      setIsLoadingMore(false);
    });
  }, [isLoading, isLoadingMore, options.length, totalCount, query]);

  return {
    options,
    totalCount,
    isLoading,
    isLoadingMore,
    onSearchChange: setQuery,
    onEndReached: loadMore,
  };
}

function SingleSelector(args: PagedSelectorSingleProps) {
  const pages = useFakePages();
  const [value, setValue] = useArgState<string | null>(args.value ?? null);
  return (
    <PagedSelector
      {...args}
      {...pages}
      value={value}
      onChange={(next, item) => {
        setValue(next);
        args.onChange?.(next, item);
      }}
    />
  );
}

function MultipleSelector(args: Omit<PagedSelectorMultipleProps, "isMultiple">) {
  const pages = useFakePages();
  const [value, setValue] = useArgState(args.value);
  return (
    <PagedSelector
      {...args}
      {...pages}
      isMultiple
      value={value ?? []}
      onChange={(next, items) => {
        setValue(next);
        args.onChange?.(next, items);
      }}
    />
  );
}

const meta = {
  title: "Components/PagedSelector",
  component: PagedSelector,
  args: {
    label: "Item",
    options: [],
    onChange: fn(),
    onOpenChange: fn(),
  },
  argTypes: {
    selectionIndicator: { control: "inline-radio", options: ["check", "checkbox"] },
    triggerDisplay: { control: "inline-radio", options: ["labels", "badges"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  decorators: [withMaxWidth(360)],
  render: (args) => <SingleSelector {...args} />,
} satisfies Meta<PagedSelectorSingleProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithClear: Story = {
  args: { value: "item-003", hasClear: true },
};

export const Multiple: Story = {
  render: (args) => (
    <MultipleSelector
      {...(args as Omit<PagedSelectorMultipleProps, "isMultiple">)}
      value={["item-001", "item-002", "item-005", "item-008"]}
    />
  ),
};

export const MultipleWithBadges: Story = {
  render: (args) => (
    <MultipleSelector
      {...(args as Omit<PagedSelectorMultipleProps, "isMultiple">)}
      value={["item-001", "item-002"]}
      triggerDisplay="badges"
      selectionIndicator="checkbox"
    />
  ),
};

export const LabelsForUnloadedValues: Story = {
  args: {
    value: "item-110",
    labels: { "item-110": "Item 110" },
  },
};

export const Empty: Story = {
  render: (args) => <PagedSelector {...args} options={[]} totalCount={0} />,
};

export const Disabled: Story = {
  args: { isDisabled: true },
};
