/**
 * With `showTooltip` off, the wrapper hands Astryx what it did before the prop
 * existed: the caller's `ref` and `onOpenChange` themselves, no tooltip hook,
 * no tooltip layer. Astryx's MultiSelector and useTooltip are spied on.
 */
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as MultiSelectorModule from "@astryxdesign/core/MultiSelector";
import type * as TooltipModule from "@astryxdesign/core/Tooltip";

const spies = vi.hoisted(() => ({
  props: [] as Record<string, unknown>[],
  useTooltip: vi.fn(),
}));

vi.mock("@astryxdesign/core/MultiSelector", async (importOriginal) => {
  const actual = await importOriginal<typeof MultiSelectorModule>();
  const MultiSelector = (props: Record<string, unknown>) => {
    spies.props.push(props);
    const Original = actual.MultiSelector as unknown as (
      p: Record<string, unknown>,
    ) => unknown;
    return Original(props);
  };
  return { ...actual, MultiSelector };
});

vi.mock("@astryxdesign/core/Tooltip", async (importOriginal) => {
  const actual = await importOriginal<typeof TooltipModule>();
  return {
    ...actual,
    useTooltip: (...args: Parameters<typeof actual.useTooltip>) => {
      spies.useTooltip(...args);
      return actual.useTooltip(...args);
    },
  };
});

import { MultiSelector } from "./MultiSelector";

beforeEach(() => {
  // jsdom has no Popover API; the selectors' surfaces call it on mount.
  HTMLElement.prototype.showPopover = vi.fn();
  HTMLElement.prototype.hidePopover = vi.fn();
  spies.props.length = 0;
  spies.useTooltip.mockClear();
});

const OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
];

describe("MultiSelector without showTooltip", () => {
  it("passes ref and onOpenChange through and runs no tooltip", async () => {
    const ref = createRef<HTMLElement>();
    const onOpenChange = vi.fn();
    render(
      <MultiSelector
        aria-label="Regions"
        options={OPTIONS}
        defaultValue={["north"]}
        aria-describedby="hint"
        ref={ref}
        onOpenChange={onOpenChange}
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Regions" });
    await userEvent.hover(trigger);

    expect(spies.props.length).toBeGreaterThan(0);
    for (const props of spies.props) {
      expect(props.ref).toBe(ref);
      expect(props.onOpenChange).toBe(onOpenChange);
      expect(props["aria-describedby"]).toBe("hint");
    }
    expect(spies.useTooltip).not.toHaveBeenCalled();
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    expect(trigger.getAttribute("aria-describedby")?.split(" ")).toContain("hint");
    expect(ref.current).toBe(trigger);
  });

  it("runs the tooltip hook once showTooltip is set", () => {
    render(
      <MultiSelector
        aria-label="Regions"
        options={OPTIONS}
        defaultValue={["north"]}
        showTooltip
      />,
    );
    expect(spies.useTooltip).toHaveBeenCalled();
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent("North");
  });
});
