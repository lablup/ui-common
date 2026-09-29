/**
 * PagedSelector, ported from Backend.AI WebUI's BAIComplexSelect tests (its
 * popup and trigger suites), onto PagedSelector's props: option values in
 * `value` / `onChange`, `isMultiple`, `options[].isDisabled`.
 *
 * jsdom implements no Popover API, so the mock below is Astryx's own
 * (`ComplexSelector.test.tsx`), and a `[popover]` subtree stays hidden from
 * the accessibility tree even once open, so popup queries pass
 * `{ hidden: true }`. `usePopover`'s autofocus finds nothing under jsdom
 * either, so the tests focus the key surface themselves.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PagedSelector, type PagedSelectorOption } from "./PagedSelector";
import { PANEL_SEARCH_CLASS_NAMES } from "./PanelSearchInput";
import { CONTENT_RESET } from "./PagedSelector";

const originalMatches = HTMLElement.prototype.matches;

beforeEach(() => {
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute("popover-open", "");
    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "open" });
    this.dispatchEvent(event);
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute("popover-open");
    const event = new Event("toggle");
    Object.defineProperty(event, "newState", { value: "closed" });
    this.dispatchEvent(event);
  });
  vi.spyOn(HTMLElement.prototype, "matches").mockImplementation(function (
    this: HTMLElement,
    selector: string,
  ) {
    if (selector === ":popover-open") return this.hasAttribute("popover-open");
    return originalMatches.call(this, selector);
  });
});

const OPTIONS: PagedSelectorOption[] = [
  { value: "a", label: "alpha" },
  { value: "b", label: "bravo" },
  { value: "c", label: "charlie" },
];

/** `b` is unselectable: the row every disabled assertion aims at. */
const WITH_DISABLED: PagedSelectorOption[] = [
  { value: "a", label: "alpha" },
  { value: "b", label: "bravo", isDisabled: true },
  { value: "c", label: "charlie" },
];

const FOUR: PagedSelectorOption[] = [...OPTIONS, { value: "d", label: "delta" }];

const h = { hidden: true } as const;

const trigger = () => screen.getAllByRole("button")[0]!;
const triggerText = () => trigger().textContent?.trim() ?? "";
const listbox = () => screen.getByRole("listbox", h);
const optionRows = () => screen.getAllByRole("option", h);
const searchBox = () => screen.getByRole("combobox", h);
const highlightedLabels = () =>
  optionRows()
    .filter((row) => row.getAttribute("data-highlighted") === "true")
    .map((row) => row.textContent);

describe("PagedSelector trigger", () => {
  it("names every selected option while under the cap", () => {
    render(
      <PagedSelector label="Targets" isMultiple options={FOUR} value={["a", "b"]} />,
    );
    expect(triggerText()).toContain("alpha, bravo");
    expect(triggerText()).not.toMatch(/\d+\s+selected/i);
  });

  it('collapses past `maxTriggerItems` to the "+N" form Astryx uses', () => {
    render(
      <PagedSelector
        label="Targets"
        isMultiple
        options={FOUR}
        value={["a", "b", "c", "d"]}
      />,
    );
    expect(triggerText()).toContain("alpha, bravo, charlie, +1");
  });

  it("renders chips with triggerDisplay badges", () => {
    render(
      <PagedSelector
        label="Targets"
        isMultiple
        triggerDisplay="badges"
        options={FOUR}
        value={["a", "b"]}
      />,
    );
    expect(triggerText()).toContain("alpha");
    expect(triggerText()).toContain("bravo");
    expect(triggerText()).not.toContain("alpha, bravo");
  });

  it("single mode shows the one label, no separators", () => {
    render(<PagedSelector label="Target" options={FOUR} value="c" />);
    expect(triggerText()).toContain("charlie");
    expect(triggerText()).not.toContain(",");
  });

  it("names a selected value that is not on the loaded page from `labels`", () => {
    render(
      <PagedSelector
        label="Target"
        options={OPTIONS}
        value="z"
        labels={{ z: "zulu" }}
      />,
    );
    expect(triggerText()).toContain("zulu");
  });

  it("keeps the label of a value picked from a page that is gone", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState<string | null>(null);
      const [options, setOptions] = useState(OPTIONS);
      return (
        <>
          <PagedSelector
            label="Target"
            options={options}
            value={value}
            onChange={setValue}
          />
          <button type="button" onClick={() => setOptions([])}>
            next query
          </button>
        </>
      );
    }
    render(<Harness />);
    await user.click(trigger());
    await user.click(optionRows()[1]!);
    await user.click(screen.getByRole("button", { name: "next query" }));
    expect(triggerText()).toContain("bravo");
  });

  it("uses the placeholder that names the field", () => {
    render(<PagedSelector label="Owner" options={OPTIONS} />);
    expect(triggerText()).toContain("Select Owner");
  });

  it("clears to null, or to [] when multiple, and hides the clear with nothing selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = render(
      <PagedSelector
        label="Target"
        hasClear
        options={OPTIONS}
        value="a"
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith(null, null);
    unmount();

    render(
      <PagedSelector
        label="Targets"
        isMultiple
        hasClear
        options={OPTIONS}
        value={["a"]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenLastCalledWith([], []);
  });
});

describe("PagedSelector popup: keyboard", () => {
  it("commits the arrowed-to option with Enter from the search box", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PagedSelector label="Targets" options={OPTIONS} onChange={onChange} />);

    await user.click(trigger());
    searchBox().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(highlightedLabels()).toEqual(["bravo"]);

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("b", { value: "b", label: "bravo" });
  });

  it("keeps the searchless popup operable: the listbox itself takes the keys", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PagedSelector
        label="Targets"
        hasSearch={false}
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    await user.click(trigger());
    expect(listbox()).toHaveAttribute("tabindex", "0");
    expect(screen.queryByRole("combobox", h)).not.toBeInTheDocument();

    listbox().focus();
    await user.keyboard("{ArrowDown}");
    expect(highlightedLabels()).toEqual(["alpha"]);
    expect(listbox()).toHaveAttribute("aria-activedescendant", optionRows()[0]!.id);

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("a", { value: "a", label: "alpha" });
  });

  it("commits with Space too, but only where no input is swallowing it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSearchChange = vi.fn();
    const { unmount } = render(
      <PagedSelector
        label="Targets"
        hasSearch={false}
        options={OPTIONS}
        onChange={onChange}
      />,
    );
    await user.click(trigger());
    listbox().focus();
    await user.keyboard("{ArrowDown} ");
    expect(onChange).toHaveBeenCalledWith("a", { value: "a", label: "alpha" });
    unmount();

    render(
      <PagedSelector
        label="Targets"
        options={OPTIONS}
        onChange={onChange}
        onSearchChange={onSearchChange}
      />,
    );
    onChange.mockClear();
    await user.click(trigger());
    searchBox().focus();
    await user.keyboard("{ArrowDown} ");
    expect(onChange).not.toHaveBeenCalled();
    expect(onSearchChange).toHaveBeenLastCalledWith(" ");
  });

  it("Home and End land on real options", async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={OPTIONS} />);
    await user.click(trigger());
    searchBox().focus();

    await user.keyboard("{End}");
    expect(highlightedLabels()).toEqual(["charlie"]);
    await user.keyboard("{Home}");
    expect(highlightedLabels()).toEqual(["alpha"]);
  });
});

describe("PagedSelector popup: multiple", () => {
  it("toggles options and reports the whole selection with its labels", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PagedSelector
        label="Targets"
        isMultiple
        options={OPTIONS}
        value={["z", "a"]}
        labels={{ z: "zulu" }}
        onChange={onChange}
      />,
    );
    await user.click(trigger());
    expect(listbox()).toHaveAttribute("aria-multiselectable", "true");

    await user.click(optionRows()[1]!);
    expect(onChange).toHaveBeenLastCalledWith(
      ["z", "a", "b"],
      [
        { value: "z", label: "zulu" },
        { value: "a", label: "alpha" },
        { value: "b", label: "bravo" },
      ],
    );
    await user.click(optionRows()[0]!);
    expect(onChange).toHaveBeenLastCalledWith(["z"], [{ value: "z", label: "zulu" }]);
    // The panel stays open for the next pick.
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });
});

describe("PagedSelector popup: disabled options", () => {
  it("never lets a disabled row wear the highlight on hover", async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={WITH_DISABLED} />);
    await user.click(trigger());

    await user.hover(optionRows()[0]!);
    expect(highlightedLabels()).toEqual(["alpha"]);
    await user.hover(optionRows()[1]!);
    expect(highlightedLabels()).toEqual(["alpha"]);
  });

  it("arrows step over the disabled row instead of resting on it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PagedSelector label="Targets" options={WITH_DISABLED} onChange={onChange} />,
    );
    await user.click(trigger());
    searchBox().focus();

    await user.keyboard("{ArrowDown}");
    expect(highlightedLabels()).toEqual(["alpha"]);
    await user.keyboard("{ArrowDown}");
    expect(highlightedLabels()).toEqual(["charlie"]);

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("c", { value: "c", label: "charlie" });
  });

  it("clicking a disabled row commits nothing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PagedSelector label="Targets" options={WITH_DISABLED} onChange={onChange} />,
    );
    await user.click(trigger());
    await user.click(optionRows()[1]!);
    expect(onChange).not.toHaveBeenCalled();
    expect(optionRows()[1]).toHaveAttribute("aria-disabled", "true");
  });
});

describe("PagedSelector popup: search box", () => {
  it("clears the query and reports the clear", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <PagedSelector
        label="Targets"
        options={OPTIONS}
        onSearchChange={onSearchChange}
      />,
    );
    await user.click(trigger());

    await user.type(searchBox(), "br");
    expect(searchBox()).toHaveValue("br");
    expect(onSearchChange).toHaveBeenLastCalledWith("br");

    await user.click(screen.getByRole("button", { ...h, name: /clear search/i }));
    expect(searchBox()).toHaveValue("");
    expect(onSearchChange).toHaveBeenLastCalledWith("");
    expect(
      screen.queryByRole("button", { ...h, name: /clear search/i }),
    ).not.toBeInTheDocument();
  });

  it("does not highlight a disabled first row when a query lands on one", async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={WITH_DISABLED} />);
    await user.click(trigger());
    await user.type(searchBox(), "a");
    expect(highlightedLabels()).toEqual(["alpha"]);
  });

  it("is Astryx's panel search row, drawn with Astryx's own classes", async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={OPTIONS} />);
    await user.click(trigger());
    expect(searchBox()).toHaveAccessibleName("Search options");
    expect(searchBox()).toHaveAttribute("placeholder", "Search");
    expect(searchBox().className).toBe(PANEL_SEARCH_CLASS_NAMES.input);
  });
});

describe("PagedSelector popup: reopen", () => {
  it("drops the highlight when the panel closes", async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={OPTIONS} />);

    await user.click(trigger());
    searchBox().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(highlightedLabels()).toEqual(["bravo"]);

    await user.click(trigger());
    await user.click(trigger());
    expect(highlightedLabels()).toEqual([]);
  });

  it("reports open and close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <PagedSelector label="Targets" options={OPTIONS} onOpenChange={onOpenChange} />,
    );
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

describe("PagedSelector popup: empty state", () => {
  it('says "no results" for an empty list that is not loading', async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={[]} />);
    await user.click(trigger());
    expect(listbox()).toHaveTextContent("No results");
    expect(listbox()).not.toHaveTextContent(/loading/i);
  });

  it('says "loading" instead while the list is still in flight', async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={[]} isLoading />);
    await user.click(trigger());
    expect(listbox()).toHaveTextContent("Loading...");
    expect(listbox()).not.toHaveTextContent(/no results/i);
  });

  it("leaves a populated list alone while loading", async () => {
    const user = userEvent.setup();
    render(<PagedSelector label="Targets" options={OPTIONS} isLoading />);
    await user.click(trigger());
    expect(optionRows()).toHaveLength(3);
    expect(listbox()).not.toHaveTextContent(/loading/i);
  });

  it("lets `emptyText` win over both", async () => {
    const user = userEvent.setup();
    render(
      <PagedSelector
        label="Targets"
        options={[]}
        isLoading
        emptyText={<span>pick a scope first</span>}
      />,
    );
    await user.click(trigger());
    expect(listbox()).toHaveTextContent("pick a scope first");
    expect(listbox()).not.toHaveTextContent(/loading/i);
  });
});

describe("PagedSelector popup: paging", () => {
  function scrollTo(el: HTMLElement, scrollTop: number) {
    Object.defineProperty(el, "scrollHeight", { configurable: true, value: 500 });
    Object.defineProperty(el, "clientHeight", { configurable: true, value: 200 });
    el.scrollTop = scrollTop;
    fireEvent.scroll(el);
  }

  it("fires onEndReached once per arrival within the threshold", async () => {
    const user = userEvent.setup();
    const onEndReached = vi.fn();
    const onAtEndChange = vi.fn();
    render(
      <PagedSelector
        label="Targets"
        options={OPTIONS}
        onEndReached={onEndReached}
        onAtEndChange={onAtEndChange}
        endReachedThreshold={30}
      />,
    );
    await user.click(trigger());
    scrollTo(listbox(), 100);
    expect(onEndReached).not.toHaveBeenCalled();
    scrollTo(listbox(), 275);
    scrollTo(listbox(), 290);
    expect(onEndReached).toHaveBeenCalledTimes(1);
    expect(onAtEndChange).toHaveBeenLastCalledWith(true);
    scrollTo(listbox(), 0);
    expect(onAtEndChange).toHaveBeenLastCalledWith(false);
    scrollTo(listbox(), 300);
    expect(onEndReached).toHaveBeenCalledTimes(2);
  });

  it("shows the total count, with a spinner while the next page loads", async () => {
    const user = userEvent.setup();
    render(
      <PagedSelector label="Targets" options={OPTIONS} totalCount={42} isLoadingMore />,
    );
    await user.click(trigger());
    expect(
      screen.getAllByText("Total 42 items", { exact: false }).length,
    ).toBeGreaterThan(0);
  });

  it("renders a footer function with close", async () => {
    const user = userEvent.setup();
    render(
      <PagedSelector
        label="Targets"
        options={OPTIONS}
        footer={(close) => (
          <button type="button" onClick={close}>
            done
          </button>
        )}
      />,
    );
    await user.click(trigger());
    await user.click(screen.getByRole("button", { ...h, name: "done" }));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("PagedSelector popup surface", () => {
  it("drops ComplexSelector's content padding through contentXstyle", async () => {
    const user = userEvent.setup();
    const { container } = render(<PagedSelector label="Targets" options={OPTIONS} />);
    await user.click(trigger());
    const content = listbox().closest(".astryx-complex-selector-popup > div");
    expect(content ?? container).toHaveClass(CONTENT_RESET.padding);
  });
});

/**
 * The search row and the popup reset use class names Astryx compiled for the
 * installed version, whose rules arrive with astryx.css. An Astryx bump that
 * renames them fails here instead of silently unstyling the row.
 */
describe("PagedSelector's borrowed Astryx classes", () => {
  const astryxCss = readFileSync(
    join(__dirname, "../../../node_modules/@astryxdesign/core/dist/astryx.css"),
    "utf8",
  );
  const classes = [
    ...Object.values(PANEL_SEARCH_CLASS_NAMES),
    CONTENT_RESET.padding,
  ].flatMap((names) => names.split(" "));

  it.each(classes)("astryx.css defines .%s", (name) => {
    expect(astryxCss).toContain(`.${name}`);
  });
});
