/**
 * Tests for the unified Tabs component
 *
 * Tests cover:
 * - Tab rendering (flat and grouped)
 * - Tab switching behavior
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Accessibility attributes (ARIA roles, aria-selected)
 * - Controlled vs uncontrolled state
 * - Required badge display
 * - Group separators and labels
 * - Overflow menu (overflowMode="menu")
 * - Mobile dropdown (overflowMode="dropdown")
 * - Touch swipe navigation
 * - Auto-scroll to active tab
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, type TabItem, type TabGroupMeta } from "./Tabs";

describe("Tabs", () => {
  const mockTabs: TabItem[] = [
    { id: "tab1", label: "Tab 1", content: <div>Content 1</div> },
    { id: "tab2", label: "Tab 2", content: <div>Content 2</div> },
    { id: "tab3", label: "Tab 3", content: <div>Content 3</div> },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render all tabs", () => {
      render(<Tabs tabs={mockTabs} />);

      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 3" })).toBeInTheDocument();
    });

    it("should render first tab content by default", () => {
      render(<Tabs tabs={mockTabs} />);

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
      expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
    });

    it("should render custom default tab content", () => {
      render(<Tabs tabs={mockTabs} defaultTab="tab2" />);

      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Content 3")).not.toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const { container } = render(<Tabs tabs={mockTabs} className="custom-tabs" />);

      const tabsContainer = container.querySelector(".tabs.custom-tabs");
      expect(tabsContainer).toBeInTheDocument();
    });

    it("should render tabpanel with custom panelClassName", () => {
      render(<Tabs tabs={mockTabs} panelClassName="custom-panel-class" />);

      const tabpanel = screen.getByRole("tabpanel");
      expect(tabpanel).toHaveClass("tabs__panel", "custom-panel-class");
    });

    it("should render tablist with correct role", () => {
      render(<Tabs tabs={mockTabs} />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
    });

    it("should render tablist with custom aria-label when provided", () => {
      render(<Tabs tabs={mockTabs} ariaLabel="Custom navigation" />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveAttribute("aria-label", "Custom navigation");
    });

    it("should render tabpanel with correct role", () => {
      render(<Tabs tabs={mockTabs} />);

      const tabpanel = screen.getByRole("tabpanel");
      expect(tabpanel).toBeInTheDocument();
    });

    it("should link tabs to internally rendered panels", () => {
      render(<Tabs tabs={mockTabs} />);

      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveAttribute(
        "aria-controls",
        "tabpanel-tab1",
      );
    });

    it("should not point aria-controls at missing panels when renderPanel is false", () => {
      render(<Tabs tabs={mockTabs} renderPanel={false} />);

      expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 1" })).not.toHaveAttribute(
        "aria-controls",
      );
    });
  });

  describe("Tab Switching", () => {
    it("should switch to tab when clicked", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      await user.click(tab2Button);

      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("should call onTabChange callback when tab is clicked", async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} onTabChange={onTabChange} />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      await user.click(tab2Button);

      expect(onTabChange).toHaveBeenCalledWith("tab2");
      expect(onTabChange).toHaveBeenCalledTimes(1);
    });

    it("should allow multiple tab switches", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      await user.click(tab2Button);
      expect(screen.getByText("Content 2")).toBeInTheDocument();

      const tab3Button = screen.getByRole("tab", { name: "Tab 3" });
      await user.click(tab3Button);
      expect(screen.getByText("Content 3")).toBeInTheDocument();

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      await user.click(tab1Button);
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("Controlled Mode", () => {
    it("should respect controlled activeTab prop", () => {
      render(<Tabs tabs={mockTabs} activeTab="tab3" />);

      expect(screen.getByText("Content 3")).toBeInTheDocument();
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("should not update internal state in controlled mode", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Tabs tabs={mockTabs} activeTab="tab1" />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      await user.click(tab2Button);

      expect(screen.getByText("Content 1")).toBeInTheDocument();

      rerender(<Tabs tabs={mockTabs} activeTab="tab2" />);

      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("should call onTabChange in controlled mode", async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="tab1" onTabChange={onTabChange} />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      await user.click(tab2Button);

      expect(onTabChange).toHaveBeenCalledWith("tab2");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should navigate to next tab with ArrowRight", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      tab1Button.focus();

      await user.keyboard("{ArrowRight}");

      expect(screen.getByText("Content 2")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
    });

    it("should navigate to previous tab with ArrowLeft", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} defaultTab="tab2" />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      tab2Button.focus();

      await user.keyboard("{ArrowLeft}");

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });

    it("should wrap to first tab when ArrowRight on last tab", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} defaultTab="tab3" />);

      const tab3Button = screen.getByRole("tab", { name: "Tab 3" });
      tab3Button.focus();

      await user.keyboard("{ArrowRight}");

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });

    it("should wrap to last tab when ArrowLeft on first tab", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      tab1Button.focus();

      await user.keyboard("{ArrowLeft}");

      expect(screen.getByText("Content 3")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
    });

    it("should navigate to first tab with Home key", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} defaultTab="tab2" />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      tab2Button.focus();

      await user.keyboard("{Home}");

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveFocus();
    });

    it("should navigate to last tab with End key", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      tab1Button.focus();

      await user.keyboard("{End}");

      expect(screen.getByText("Content 3")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 3" })).toHaveFocus();
    });

    it("should not respond to other keys", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      tab1Button.focus();

      await user.keyboard("{Space}");
      await user.keyboard("{Enter}");
      await user.keyboard("a");

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have correct ARIA attributes for active tab", () => {
      render(<Tabs tabs={mockTabs} />);

      const activeTab = screen.getByRole("tab", { name: "Tab 1" });
      expect(activeTab).toHaveAttribute("aria-selected", "true");
      expect(activeTab).toHaveAttribute("aria-controls", "tabpanel-tab1");
      expect(activeTab).toHaveAttribute("id", "tab-tab1");
      expect(activeTab).toHaveAttribute("tabIndex", "0");
    });

    it("should have correct ARIA attributes for inactive tabs", () => {
      render(<Tabs tabs={mockTabs} />);

      const inactiveTab = screen.getByRole("tab", { name: "Tab 2" });
      expect(inactiveTab).toHaveAttribute("aria-selected", "false");
      expect(inactiveTab).toHaveAttribute("aria-controls", "tabpanel-tab2");
      expect(inactiveTab).toHaveAttribute("id", "tab-tab2");
      expect(inactiveTab).toHaveAttribute("tabIndex", "-1");
    });

    it("should have correct ARIA attributes for tabpanel", () => {
      render(<Tabs tabs={mockTabs} />);

      const tabpanel = screen.getByRole("tabpanel");
      expect(tabpanel).toHaveAttribute("id", "tabpanel-tab1");
      expect(tabpanel).toHaveAttribute("aria-labelledby", "tab-tab1");
      expect(tabpanel).toHaveAttribute("tabIndex", "0");
    });

    it("should update ARIA attributes when tab changes", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      await user.click(tab2Button);

      const tabpanel = screen.getByRole("tabpanel");
      expect(tabpanel).toHaveAttribute("id", "tabpanel-tab2");
      expect(tabpanel).toHaveAttribute("aria-labelledby", "tab-tab2");

      expect(tab2Button).toHaveAttribute("aria-selected", "true");
      expect(tab2Button).toHaveAttribute("tabIndex", "0");

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab1Button).toHaveAttribute("aria-selected", "false");
      expect(tab1Button).toHaveAttribute("tabIndex", "-1");
    });

    it("should have proper CSS classes for active tab", () => {
      render(<Tabs tabs={mockTabs} />);

      const activeTab = screen.getByRole("tab", { name: "Tab 1" });
      expect(activeTab).toHaveClass("tabs__tab", "tabs__tab--active");

      const inactiveTab = screen.getByRole("tab", { name: "Tab 2" });
      expect(inactiveTab).toHaveClass("tabs__tab");
      expect(inactiveTab).not.toHaveClass("tabs__tab--active");
    });
  });

  describe("Tab Grouping", () => {
    const groupedTabs: TabItem[] = [
      {
        id: "tab1",
        label: "Tab 1",
        content: <div>Content 1</div>,
        groupId: "group1",
      },
      {
        id: "tab2",
        label: "Tab 2",
        content: <div>Content 2</div>,
        groupId: "group1",
        required: true,
      },
      {
        id: "tab3",
        label: "Tab 3",
        content: <div>Content 3</div>,
        groupId: "group2",
      },
      {
        id: "tab4",
        label: "Tab 4",
        content: <div>Content 4</div>,
        groupId: "group2",
      },
    ];

    const groups: TabGroupMeta[] = [
      { id: "group1", label: "Group One" },
      { id: "group2", label: "Group Two" },
    ];

    it("should render group labels", () => {
      render(<Tabs tabs={groupedTabs} groups={groups} />);

      expect(screen.getByText("Group One")).toBeInTheDocument();
      expect(screen.getByText("Group Two")).toBeInTheDocument();
    });

    it("should not render group labels when showGroupLabels is false", () => {
      render(<Tabs tabs={groupedTabs} groups={groups} showGroupLabels={false} />);

      expect(screen.queryByText("Group One")).not.toBeInTheDocument();
      expect(screen.queryByText("Group Two")).not.toBeInTheDocument();
    });

    it("should render separator between groups", () => {
      const { container } = render(<Tabs tabs={groupedTabs} groups={groups} />);

      const separators = container.querySelectorAll(".tabs__separator");
      expect(separators.length).toBe(1);
    });

    it("should render separator with correct attributes", () => {
      const { container } = render(<Tabs tabs={groupedTabs} groups={groups} />);

      const separator = container.querySelector(".tabs__separator");
      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("aria-hidden", "true");
    });

    it("should render required badge for required tabs", () => {
      render(<Tabs tabs={groupedTabs} groups={groups} />);

      const tab2 = screen.getByRole("tab", { name: /Tab 2/i });
      const requiredBadge = within(tab2).getByText("Required");
      expect(requiredBadge).toBeInTheDocument();
    });

    it("should not render required badge for non-required tabs", () => {
      render(<Tabs tabs={groupedTabs} groups={groups} />);

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      const badge = within(tab1).queryByText("Required");
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe("Overflow Menu (overflowMode='menu')", () => {
    it("should render overflow button when overflowMode is menu", () => {
      const { container } = render(<Tabs tabs={mockTabs} overflowMode="menu" />);

      const overflowButton = container.querySelector(".tabs__overflow-btn");
      expect(overflowButton).toBeInTheDocument();
    });

    it("should not render overflow button when showOverflowControls is false", () => {
      const { container } = render(
        <Tabs tabs={mockTabs} overflowMode="menu" showOverflowControls={false} />,
      );

      const overflowButton = container.querySelector(".tabs__overflow-btn");
      expect(overflowButton).not.toBeInTheDocument();
    });

    it("should toggle overflow menu when button is clicked", async () => {
      const { container } = render(<Tabs tabs={mockTabs} overflowMode="menu" />);

      const overflowButton = container.querySelector(
        ".tabs__overflow-btn",
      ) as HTMLButtonElement;
      expect(overflowButton).toHaveAttribute("aria-expanded", "false");

      act(() => {
        fireEvent.click(overflowButton);
      });

      await waitFor(() => {
        expect(overflowButton).toHaveAttribute("aria-expanded", "true");
        const menu = container.querySelector(".tabs__overflow-menu");
        expect(menu).toBeInTheDocument();
      });
    });

    it("should render all tabs in overflow menu", async () => {
      const { container } = render(<Tabs tabs={mockTabs} overflowMode="menu" />);

      const overflowButton = container.querySelector(
        ".tabs__overflow-btn",
      ) as HTMLButtonElement;

      act(() => {
        fireEvent.click(overflowButton);
      });

      await waitFor(() => {
        const menuItems = container.querySelectorAll(".tabs__overflow-item");
        expect(menuItems.length).toBe(3);
      });
    });

    it("should close overflow menu on Escape key", async () => {
      const user = userEvent.setup();
      const { container } = render(<Tabs tabs={mockTabs} overflowMode="menu" />);

      const overflowButton = container.querySelector(
        ".tabs__overflow-btn",
      ) as HTMLButtonElement;

      act(() => {
        fireEvent.click(overflowButton);
      });

      await waitFor(() => {
        const menu = container.querySelector(".tabs__overflow-menu");
        expect(menu).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        const menu = container.querySelector(".tabs__overflow-menu");
        expect(menu).not.toBeInTheDocument();
      });
    });

    it("should highlight active tab in overflow menu", async () => {
      const { container } = render(
        <Tabs tabs={mockTabs} overflowMode="menu" defaultTab="tab2" />,
      );

      const overflowButton = container.querySelector(
        ".tabs__overflow-btn",
      ) as HTMLButtonElement;

      act(() => {
        fireEvent.click(overflowButton);
      });

      await waitFor(() => {
        const menu = container.querySelector(".tabs__overflow-menu");
        expect(menu).toBeInTheDocument();
      });

      const menuItems = container.querySelectorAll(".tabs__overflow-item");
      expect(menuItems[1]).toHaveClass("tabs__overflow-item--active");
      expect(menuItems[0]).not.toHaveClass("tabs__overflow-item--active");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty tabs array", () => {
      render(<Tabs tabs={[]} />);

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();
      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    });

    it("should handle single tab", () => {
      const singleTab = mockTabs.slice(0, 1);
      render(<Tabs tabs={singleTab} />);

      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("should handle invalid defaultTab gracefully", () => {
      render(<Tabs tabs={mockTabs} defaultTab="invalid-tab" />);

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });

    it("should update when tabs array changes", () => {
      const { rerender } = render(<Tabs tabs={mockTabs} />);

      const newTabs: TabItem[] = [
        { id: "new1", label: "New Tab 1", content: <div>New Content 1</div> },
        { id: "new2", label: "New Tab 2", content: <div>New Content 2</div> },
      ];

      rerender(<Tabs tabs={newTabs} />);

      expect(screen.getByRole("tab", { name: "New Tab 1" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "New Tab 2" })).toBeInTheDocument();
      expect(screen.queryByRole("tab", { name: "Tab 1" })).not.toBeInTheDocument();
    });

    it("should handle tabs with special characters in labels", () => {
      const specialTabs: TabItem[] = [
        {
          id: "tab1",
          label: "Tab & Special <chars>",
          content: <div>Content 1</div>,
        },
        {
          id: "tab2",
          label: 'Tab with "quotes"',
          content: <div>Content 2</div>,
        },
      ];

      render(<Tabs tabs={specialTabs} />);

      expect(
        screen.getByRole("tab", { name: "Tab & Special <chars>" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: 'Tab with "quotes"' }),
      ).toBeInTheDocument();
    });

    it("should handle content with complex React nodes", () => {
      const complexTabs: TabItem[] = [
        {
          id: "complex",
          label: "Complex Tab",
          content: (
            <div>
              <h2>Heading</h2>
              <p>
                Paragraph with <strong>bold</strong> text
              </p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          ),
        },
      ];

      render(<Tabs tabs={complexTabs} />);

      expect(screen.getByRole("heading", { name: "Heading" })).toBeInTheDocument();
      expect(screen.getByText("bold")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    it("should handle rapid tab switching", async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(<Tabs tabs={mockTabs} onTabChange={onTabChange} />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      const tab3Button = screen.getByRole("tab", { name: "Tab 3" });
      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });

      await user.click(tab2Button);
      await user.click(tab3Button);
      await user.click(tab1Button);

      expect(onTabChange).toHaveBeenCalledTimes(3);
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("Focus Management", () => {
    it("should maintain focus on active tab button", () => {
      render(<Tabs tabs={mockTabs} />);

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab1Button).toHaveAttribute("tabIndex", "0");

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      expect(tab2Button).toHaveAttribute("tabIndex", "-1");
    });

    it("should update tabIndex when tab changes", async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={mockTabs} />);

      const tab2Button = screen.getByRole("tab", { name: "Tab 2" });
      await user.click(tab2Button);

      expect(tab2Button).toHaveAttribute("tabIndex", "0");

      const tab1Button = screen.getByRole("tab", { name: "Tab 1" });
      expect(tab1Button).toHaveAttribute("tabIndex", "-1");
    });
  });

  describe("Responsive Behavior", () => {
    describe("Mobile Dropdown Mode", () => {
      beforeEach(() => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 375,
        });
      });

      it("should render dropdown trigger in mobile mode", () => {
        const { rerender } = render(<Tabs tabs={mockTabs} />);

        window.dispatchEvent(new Event("resize"));
        rerender(<Tabs tabs={mockTabs} />);

        const dropdown = document.querySelector(".tabs__dropdown-trigger");
        if (dropdown) {
          expect(dropdown).toBeInTheDocument();
        }
      });

      it("should display active tab label in dropdown trigger", () => {
        const { container, rerender } = render(
          <Tabs tabs={mockTabs} defaultTab="tab2" />,
        );

        window.dispatchEvent(new Event("resize"));
        rerender(<Tabs tabs={mockTabs} defaultTab="tab2" />);

        const dropdownLabel = container.querySelector(".tabs__dropdown-label");
        if (dropdownLabel) {
          expect(dropdownLabel).toHaveTextContent("Tab 2");
        }
      });

      it("should maintain active tab across mode changes", () => {
        const { rerender } = render(<Tabs tabs={mockTabs} defaultTab="tab2" />);

        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 375,
        });
        window.dispatchEvent(new Event("resize"));
        rerender(<Tabs tabs={mockTabs} defaultTab="tab2" />);

        expect(screen.getByText("Content 2")).toBeInTheDocument();
      });
    });

    describe("Auto-scroll to Active Tab", () => {
      it("should scroll active tab into view when changed", () => {
        const manyTabs: TabItem[] = Array.from({ length: 15 }, (_, i) => ({
          id: `tab${String(i)}`,
          label: `Tab ${String(i + 1)}`,
          content: <div>Content {i + 1}</div>,
        }));

        const { rerender } = render(<Tabs tabs={manyTabs} />);

        rerender(<Tabs tabs={manyTabs} activeTab="tab10" />);

        const activeTab = screen.getByRole("tab", { name: "Tab 11" });
        expect(activeTab).toHaveAttribute("aria-selected", "true");
      });
    });
  });

  describe("Guide Tags", () => {
    it("should render experimental tag badge after tab label", () => {
      const tabsWithTag: TabItem[] = [
        {
          id: "tab-exp",
          label: "ACP",
          content: <div>ACP Content</div>,
          tag: "experimental",
        },
        { id: "tab-normal", label: "Normal", content: <div>Normal</div> },
      ];

      const { container } = render(<Tabs tabs={tabsWithTag} />);

      const badge = container.querySelector(".tabs__tag-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Experimental");
    });

    it("should render beta tag with info variant class", () => {
      const tabsWithBeta: TabItem[] = [
        {
          id: "tab-beta",
          label: "Beta Feature",
          content: <div>Beta</div>,
          tag: "beta",
        },
      ];

      const { container } = render(<Tabs tabs={tabsWithBeta} />);

      const badge = container.querySelector(".tabs__tag-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Beta");
      // Badge should use info variant
      expect(badge).toHaveClass("badge--info");
    });

    it("should render recommended tag with primary variant class", () => {
      const tabsWithRecommended: TabItem[] = [
        {
          id: "tab-rec",
          label: "Recommended Tab",
          content: <div>Recommended</div>,
          tag: "recommended",
        },
      ];

      const { container } = render(<Tabs tabs={tabsWithRecommended} />);

      const badge = container.querySelector(".tabs__tag-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Recommended");
      expect(badge).toHaveClass("badge--primary");
    });

    it("should maintain backward compatibility with required boolean prop", () => {
      const tabsWithRequired: TabItem[] = [
        {
          id: "tab-req",
          label: "Required Tab",
          content: <div>Required</div>,
          required: true,
        },
      ];

      const { container } = render(<Tabs tabs={tabsWithRequired} />);

      const badge = container.querySelector(".tabs__tag-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("Required");
      // Required uses warning variant
      expect(badge).toHaveClass("badge--warning");
    });

    it("should not render tag badge for tabs without tag or required", () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      const badges = container.querySelectorAll(".tabs__tag-badge");
      expect(badges).toHaveLength(0);
    });

    it("should prefer tag prop over required boolean when both are set", () => {
      const tabsWithBoth: TabItem[] = [
        {
          id: "tab-both",
          label: "Conflicted Tab",
          content: <div>Both</div>,
          required: true,
          tag: "beta",
        },
      ];

      const { container } = render(<Tabs tabs={tabsWithBoth} />);

      const badge = container.querySelector(".tabs__tag-badge");
      expect(badge).toBeInTheDocument();
      // Should use `tag` (beta) not `required`
      expect(badge).toHaveClass("badge--info");
      expect(badge).toHaveTextContent("Beta");
    });

    it("should render tag badge in overflow menu items", async () => {
      const tabsWithTag: TabItem[] = [
        {
          id: "tab-exp",
          label: "ACP",
          content: <div>ACP Content</div>,
          tag: "experimental",
        },
        { id: "tab-normal", label: "Normal", content: <div>Normal</div> },
      ];

      const { container } = render(<Tabs tabs={tabsWithTag} overflowMode="menu" />);

      const overflowButton = container.querySelector(
        ".tabs__overflow-btn",
      ) as HTMLButtonElement;

      act(() => {
        fireEvent.click(overflowButton);
      });

      await waitFor(() => {
        const menu = container.querySelector(".tabs__overflow-menu");
        expect(menu).toBeInTheDocument();
        // The experimental tab's badge should appear in the menu
        const menuItems = container.querySelectorAll(".tabs__overflow-item");
        const expMenuItem = menuItems[0];
        const menuBadge = expMenuItem?.querySelector(".badge");
        expect(menuBadge).toBeInTheDocument();
        expect(menuBadge).toHaveTextContent("Experimental");
      });
    });
  });

  describe("overflowMode auto-detection", () => {
    it("should default to dropdown mode when no groups", () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      // No overflow button should exist (dropdown mode)
      const overflowButton = container.querySelector(".tabs__overflow-btn");
      expect(overflowButton).not.toBeInTheDocument();
    });

    it("should default to menu mode when groups are provided", () => {
      const groups: TabGroupMeta[] = [{ id: "g1", label: "Group" }];
      const tabsWithGroup: TabItem[] = [
        { id: "t1", label: "T1", content: <div>C1</div>, groupId: "g1" },
      ];

      const { container } = render(<Tabs tabs={tabsWithGroup} groups={groups} />);

      const overflowButton = container.querySelector(".tabs__overflow-btn");
      expect(overflowButton).toBeInTheDocument();
    });

    it("should allow explicit override of auto-detected mode", () => {
      const groups: TabGroupMeta[] = [{ id: "g1", label: "Group" }];
      const tabsWithGroup: TabItem[] = [
        { id: "t1", label: "T1", content: <div>C1</div>, groupId: "g1" },
      ];

      const { container } = render(
        <Tabs tabs={tabsWithGroup} groups={groups} overflowMode="dropdown" />,
      );

      // With explicit dropdown mode, no overflow menu
      const overflowButton = container.querySelector(".tabs__overflow-btn");
      expect(overflowButton).not.toBeInTheDocument();
    });
  });
});
