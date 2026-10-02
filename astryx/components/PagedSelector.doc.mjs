/**
 * `astryx component PagedSelector` (and `ui-common component PagedSelector`).
 *
 * @type {import('@astryxdesign/cli/authoring').ComponentDoc}
 */
export default {
  type: "component",
  name: "PagedSelector",
  displayName: "PagedSelector",
  import: "@lablup/ui-common",
  category: "Input",
  keywords: [
    "select",
    "selector",
    "infinite scroll",
    "load more",
    "paged",
    "pagination",
    "server search",
    "async select",
    "multi select",
  ],
  description:
    "A searchable selector, single or multiple, over options loaded a page at a time: scrolling the panel near its end calls onEndReached, and search is reported per keystroke for a server-side query. Built on ComplexSelector; the panel is drawn like Selector's.",
  props: [
    {
      name: "label",
      type: "string",
      description: "Field label and accessible name.",
      required: true,
    },
    {
      name: "options",
      type: "PagedSelectorOption[]",
      description:
        "The loaded options, every page so far: { value, label, labelContent?, icon?, description?, endContent?, isDisabled? }. label is a string: the trigger text and the row's name.",
      required: true,
    },
    {
      name: "value",
      type: "string | null | string[]",
      description: "The selected option value; an array with isMultiple.",
    },
    {
      name: "onChange",
      type: "(value, items) => void",
      description:
        "Called with the new value and each chosen value's { value, label }, so labels survive values that are not on the loaded page.",
    },
    {
      name: "isMultiple",
      type: "boolean",
      description: "Select several; the panel stays open on a pick.",
      default: "false",
    },
    {
      name: "labels",
      type: "Record<string, string>",
      description:
        "Labels for selected values that may not be among options (another page, filtered out).",
    },
    {
      name: "hasSearch",
      type: "boolean",
      description: "Search box at the top of the panel.",
      default: "true",
    },
    {
      name: "searchValue / onSearchChange",
      type: "string / (value: string) => void",
      description: "Controlled search text, and every keystroke; debounce it yourself.",
    },
    {
      name: "onEndReached",
      type: "() => void",
      description:
        "Called once each time the list is scrolled to within endReachedThreshold px of its end. Load the next page here.",
    },
    {
      name: "endReachedThreshold",
      type: "number",
      description: "Distance from the end, in px, that counts as reaching it.",
      default: "30",
    },
    {
      name: "onAtEndChange",
      type: "(isAtEnd: boolean) => void",
      description: "Called when the list arrives at, or leaves, its end.",
    },
    {
      name: "isLoading",
      type: "boolean",
      description:
        "Spinner in the trigger; an empty list shows a loading row instead of No results.",
    },
    {
      name: "isLoadingMore",
      type: "boolean",
      description: "Spinner in the foot while the next page loads.",
    },
    {
      name: "totalCount",
      type: "number",
      description: 'Options in all pages; shows "Total N items" in the foot.',
    },
    {
      name: "emptyText",
      type: "ReactNode",
      description: "Replaces the empty list's content, the loading row included.",
    },
    {
      name: "header / footer",
      type: "ReactNode / ReactNode | (close) => ReactNode",
      description:
        "Above and below the option list. A footer replaces the total count.",
    },
    {
      name: "hasClear / onClear",
      type: "boolean / () => void",
      description:
        "Clear button in the trigger; clears to null (or []) unless onClear is given.",
    },
    {
      name: "triggerDisplay",
      type: '"labels" | "badges"',
      description:
        'Multiple selection in the trigger: "A, B, C, +2" as MultiSelector, or tokens.',
      default: '"labels"',
    },
    {
      name: "maxTriggerItems",
      type: "number",
      description: "Selected items named in the trigger before +N.",
      default: "3",
    },
    {
      name: "selectionIndicator",
      type: '"check" | "checkbox"',
      description:
        "The theme's check at a chosen row's end, or a checkbox at its start.",
      default: '"check"',
    },
    {
      name: "listMaxHeight",
      type: "number",
      description: "Height the option list scrolls within, in px.",
      default: "260",
    },
    {
      name: "placeholder, searchPlaceholder, searchLabel, clearSearchLabel, formatTotalCount",
      type: "string / (total) => string",
      description:
        "Built-in strings; defaults from the uic.PagedSelector.* catalog keys.",
    },
    {
      name: "isDisabled, isRequired, isOptional, description, status, size, width, onOpenChange, …",
      type: "ComplexSelector props",
      description: "Passed to ComplexSelector.",
    },
  ],
  usage: {
    description:
      "For a list too long to load at once: a connection paged 10-20 rows at a time, searched on the server. For a list you hold in full, use Selector or MultiSelector.",
    bestPractices: [
      {
        guidance: true,
        description:
          "Guard onEndReached with the connection's hasNext and in-flight state; it fires on each arrival at the end.",
      },
      {
        guidance: true,
        description:
          "Keep each selected value's label (onChange hands it over) and pass them back in labels.",
      },
    ],
  },
  examples: [
    {
      label: "A paged, server-searched list",
      code: '<PagedSelector\n  label="Owner"\n  value={ownerId}\n  onChange={(id) => setOwnerId(id)}\n  options={users.map((u) => ({ value: u.id, label: u.email }))}\n  onSearchChange={setQuery}\n  onEndReached={() => hasNext && !isLoadingNext && loadNext(10)}\n  isLoadingMore={isLoadingNext}\n  totalCount={count}\n/>',
    },
  ],
};
