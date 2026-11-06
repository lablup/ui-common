/**
 * ui-common's tests for its Tab fork: the addition it carries (`actions`,
 * interactive controls rendered beside the tab's button or link, never inside
 * it), and that without it everything renders exactly as Astryx's Tab does.
 */
import { createRef, type ComponentProps, type ReactElement } from "react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CircleHelp } from "lucide-react";
import {
  Tab as UpstreamTab,
  TabList,
  type TabProps as UpstreamTabProps,
} from "@astryxdesign/core/TabList";

import { comparableMarkup } from "../../test/forkParity";
import { IconWithTooltip } from "../../components/IconWithTooltip";
import { Tab } from "./Tab";

const INTERACTIVE = "button, a[href], input, select, textarea, [tabindex]";

function help(name: string) {
  return <IconWithTooltip icon={<CircleHelp />} content={`Explains ${name}`} />;
}

function strip(
  props: Partial<ComponentProps<typeof TabList>>,
  children: ReactElement | ReactElement[],
) {
  return (
    <TabList value="general" onChange={() => {}} {...props}>
      {children}
    </TabList>
  );
}

describe("Tab fork: actions", () => {
  describe.each<[string, Partial<ComponentProps<typeof TabList>>, string]>([
    ["the tabs pattern", { role: "tablist" }, "tab"],
    ["the navigation pattern", {}, "button"],
  ])("in %s", (_, listProps, role) => {
    const panel = listProps.role === "tablist" ? { panelId: "p" } : {};

    it("renders the action beside the tab's control, not inside it", () => {
      render(
        strip(listProps, [
          <Tab
            key="g"
            value="general"
            label="General"
            actions={help("General")}
            {...panel}
          />,
          <Tab key="a" value="advanced" label="Advanced" {...panel} />,
        ]),
      );
      const tab = screen.getByRole(role, { name: "General" });
      const action = screen.getByRole("button", { name: "Explains General" });
      expect(tab.querySelector(INTERACTIVE)).toBeNull();
      expect(tab.contains(action)).toBe(false);
      const wrapper = tab.parentElement!;
      expect(wrapper.tagName).toBe("SPAN");
      expect(wrapper).toHaveAttribute("data-tab-actions");
      expect(wrapper).not.toHaveAttribute("role");
      expect(wrapper).not.toHaveAttribute("tabindex");
      expect(wrapper.firstElementChild).toBe(tab);
      expect(wrapper.contains(action)).toBe(true);
    });

    it("paints the tab on the wrapper: theme target, hover layer and indicator", () => {
      render(
        strip(listProps, [
          <Tab
            key="g"
            value="general"
            label="General"
            actions={help("General")}
            {...panel}
          />,
        ]),
      );
      const tab = screen.getByRole(role, { name: "General" });
      const wrapper = tab.parentElement!;
      expect(wrapper).toHaveClass("astryx-tab");
      expect(wrapper).toHaveAttribute("data-selected", "selected");
      expect(tab).not.toHaveClass("astryx-tab");
      expect(wrapper.querySelector(":scope > .astryx-tab-indicator")).not.toBeNull();
      expect(wrapper.querySelector(':scope > span[aria-hidden="true"]')).not.toBeNull();
      expect(tab.querySelector(".astryx-tab-indicator")).toBeNull();
      expect(tab.querySelector('span[aria-hidden="true"]:empty')).toBeNull();
    });

    it("does not select the tab when the action is clicked", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        strip({ ...listProps, onChange }, [
          <Tab key="g" value="general" label="General" {...panel} />,
          <Tab
            key="a"
            value="advanced"
            label="Advanced"
            actions={help("Advanced")}
            {...panel}
          />,
        ]),
      );
      await user.click(screen.getByRole("button", { name: "Explains Advanced" }));
      expect(onChange).not.toHaveBeenCalled();
      await user.click(screen.getByRole(role, { name: "Advanced" }));
      expect(onChange).toHaveBeenCalledExactlyOnceWith("advanced");
    });

    it("selects the tab on a press in the wrapper's own padding", () => {
      const onChange = vi.fn();
      render(
        strip({ ...listProps, onChange }, [
          <Tab key="g" value="general" label="General" {...panel} />,
          <Tab
            key="a"
            value="advanced"
            label="Advanced"
            actions={help("Advanced")}
            {...panel}
          />,
        ]),
      );
      fireEvent.click(screen.getByRole(role, { name: "Advanced" }).parentElement!);
      expect(onChange).toHaveBeenCalledExactlyOnceWith("advanced");
    });

    it("keeps arrow keys between tabs, and the action a Tab stop of its own", async () => {
      const user = userEvent.setup();
      render(
        <>
          {strip(listProps, [
            <Tab
              key="g"
              value="general"
              label="General"
              actions={help("General")}
              {...panel}
            />,
            <Tab
              key="a"
              value="advanced"
              label="Advanced"
              actions={help("Advanced")}
              {...panel}
            />,
            <Tab key="l" value="logs" label="Logs" {...panel} />,
          ])}
          <button type="button">After</button>
        </>,
      );
      const general = screen.getByRole(role, { name: "General" });
      const advanced = screen.getByRole(role, { name: "Advanced" });
      const logs = screen.getByRole(role, { name: "Logs" });

      await user.tab();
      expect(general).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(advanced).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(logs).toHaveFocus();
      await user.keyboard("{Home}");
      expect(general).toHaveFocus();

      // One stop for the strip, then each action in order.
      await user.tab();
      expect(screen.getByRole("button", { name: "Explains General" })).toHaveFocus();
      // Arrow keys stay with the action instead of jumping to a tab.
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: "Explains General" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Explains Advanced" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("keeps ref and props on the control, className and style on the wrapper", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        strip(listProps, [
          <Tab
            key="g"
            ref={ref}
            value="general"
            label="General"
            data-testid="general"
            className="extra"
            style={{ marginInlineStart: 4 }}
            actions={help("General")}
            {...panel}
          />,
        ]),
      );
      const tab = screen.getByRole(role, { name: "General" });
      expect(ref.current).toBe(tab);
      expect(tab).toHaveAttribute("data-testid", "general");
      expect(tab).toHaveAttribute("data-tab-value", "general");
      expect(tab.parentElement).toHaveClass("extra");
      expect(tab.parentElement).toHaveStyle({ marginInlineStart: "4px" });
      expect(tab).not.toHaveClass("extra");
    });
  });

  it("puts a link tab's anchor beside the action", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      strip({ onChange }, [
        <Tab key="g" value="general" label="General" />,
        <Tab key="l" value="logs" label="Logs" href="#logs" actions={help("Logs")} />,
      ]),
    );
    const link = screen.getByRole("link", { name: "Logs" });
    expect(link).toHaveAttribute("href", "#logs");
    expect(link.querySelector(INTERACTIVE)).toBeNull();
    expect(link.parentElement).toContainElement(
      screen.getByRole("button", { name: "Explains Logs" }),
    );
    await user.click(screen.getByRole("button", { name: "Explains Logs" }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(link);
    expect(onChange).toHaveBeenCalledExactlyOnceWith("logs");
  });

  // When this fails, Astryx's Tab can hold a trailing control: delete the fork
  // and its exports.exclude.json entry (CONTRIBUTING, "Forks of Astryx components").
  it("is not in Astryx's Tab, which nests an endContent control in the tab's button", () => {
    expectTypeOf<UpstreamTabProps>().not.toHaveProperty("actions");
    render(
      strip(
        {},
        <UpstreamTab value="general" label="General" endContent={help("General")} />,
      ),
    );
    const tab = document.querySelector<HTMLElement>("[data-tab-value=general]")!;
    expect(tab).toContainElement(
      screen.getByRole("button", { name: "Explains General" }),
    );
  });
});

describe("Tab fork: parity with Astryx", () => {
  const cases: Array<
    [string, Partial<ComponentProps<typeof TabList>>, UpstreamTabProps]
  > = [
    ["a selected tab", {}, { value: "general", label: "General" }],
    ["an unselected tab", {}, { value: "advanced", label: "Advanced" }],
    [
      "the tabs pattern",
      { role: "tablist" },
      { value: "general", label: "General", panelId: "p" },
    ],
    ["a link tab", {}, { value: "logs", label: "Logs", href: "#logs" }],
    [
      "a disabled link tab",
      {},
      { value: "logs", label: "Logs", href: "#logs", "aria-disabled": true },
    ],
    [
      "every slot",
      { size: "lg", layout: "fill" },
      {
        value: "general",
        label: "General",
        icon: <svg data-testid="icon" />,
        selectedIcon: <svg data-testid="selected" />,
        endContent: <span>3</span>,
        className: "extra",
        style: { margin: 0 },
        "data-testid": "general",
      },
    ],
    [
      "a hidden label",
      { size: "sm" },
      { value: "general", label: "General", isLabelHidden: true, icon: <svg /> },
    ],
    [
      "a disabled tab",
      {},
      { value: "advanced", label: "Advanced", "aria-disabled": "true" },
    ],
  ];

  it.each(cases)("renders Astryx's markup (%s)", (_, listProps, props) => {
    const fork = render(strip(listProps, <Tab {...props} />));
    const upstream = render(strip(listProps, <UpstreamTab {...props} />));
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });

  it("renders Astryx's markup when actions is empty", () => {
    const fork = render(
      strip({}, <Tab value="general" label="General" actions={null} />),
    );
    const upstream = render(strip({}, <UpstreamTab value="general" label="General" />));
    expect(comparableMarkup(fork.container)).toBe(comparableMarkup(upstream.container));
  });
});
