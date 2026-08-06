/**
 * Tabs Component
 *
 * Unified tab navigation component with optional grouping, guide tag badges,
 * and responsive overflow handling. Follows WCAG 2.1 ARIA tab pattern.
 *
 * Features:
 * - Scroll arrows for overflow
 * - Mobile dropdown mode (overflowMode="dropdown", < 480px)
 * - Overflow menu mode (overflowMode="menu", < 768px)
 * - Tab grouping with separators and labels
 * - Guide tag badge support (required, recommended, beta, experimental)
 * - Touch swipe navigation (dropdown mode)
 * - Auto-scroll to active tab
 * - Full keyboard navigation (Arrow keys, Home, End)
 */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
  type KeyboardEvent,
  type TouchEvent,
} from "react";
import "./Tabs.css";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  /**
   * Trailing node rendered next to the tab label: a count pill, a status
   * badge, whatever the consumer's vocabulary calls for.
   *
   * This used to sit beside a `tag` prop that took one of four fixed names,
   * required / recommended / beta / experimental, and rendered a Badge for
   * it. Those are one product's guide vocabulary, and the arrangement had
   * already split across the boundary: the badge variant lived here while the
   * label text had to be passed in from the consumer's locale bundle. A
   * consumer that wants that badge renders it here, and owns both halves.
   */
  labelExtra?: ReactNode;
  /**
   * Optional leading node rendered before the tab label (e.g. an icon).
   * Useful when migrating segmented controls that prefix the label with
   * an SVG glyph (e.g. ImportExportDialog source toggle: File / Paste / URL).
   */
  labelPrefix?: ReactNode;
  /** Assign this tab to a group (used with the `groups` prop) */
  groupId?: string;
}

export interface TabGroupMeta {
  id: string;
  label: string;
}

export type TabOverflowMode = "dropdown" | "menu";

/**
 * Visual variant of the tab bar.
 *
 * - `"underlined"` (default): pill container with raised active tab and scroll
 *   arrows; used for primary page-level navigation that may overflow.
 * - `"segmented"`: gray-background segmented control with raised active tab;
 *   intended for short, fixed-arity in-page mode toggles.
 * - `"compact"`: smaller segmented control with reduced padding; used where
 *   the tab bar shares a row with other controls (e.g. StatisticsPage).
 */
export type TabVariant = "underlined" | "segmented" | "compact";

export interface TabsProps {
  tabs: TabItem[];
  /** Group definitions for organizing tabs with separators and labels */
  groups?: TabGroupMeta[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  panelClassName?: string;
  ariaLabel?: string;
  /** Show scroll arrows and overflow controls (default: true) */
  showOverflowControls?: boolean;
  /** Show group labels in the tab bar and overflow menu (default: true) */
  showGroupLabels?: boolean;
  /**
   * Overflow strategy for small screens:
   * - "dropdown": mobile dropdown trigger (< 480px) — default when no groups
   * - "menu": overflow menu button (< 768px) — default when groups are provided
   */
  overflowMode?: TabOverflowMode;
  /**
   * Visual variant. Defaults to `"underlined"` (the original Tabs look).
   * Use `"segmented"` for iOS-style pill toggles, `"compact"` for a smaller
   * variant suitable for in-header use alongside other controls.
   */
  variant?: TabVariant;
  /**
   * When using `variant="segmented"` or `"compact"`, make each tab fill the
   * container evenly (flex: 1 per tab). Useful for short, equal-arity mode
   * toggles like the Models page tab bar. Defaults to false.
   */
  fillContainer?: boolean;
  /**
   * Render the tab panel (the active tab's `content`) below the tab list.
   * Defaults to true. Set to false when the consumer manages its own panel
   * rendering outside the Tabs component (e.g. pages that interleave panels
   * with other in-header elements).
   *
   * When false, each `TabItem.content` is ignored — the consumer is expected
   * to inspect `activeTab` / `onTabChange` and render its own panel.
   */
  renderPanel?: boolean;
  /** Accessible label for the overflow-menu trigger button. Default: "More tabs" */
  moreTabsLabel?: string;
  /** Accessible label for the mobile dropdown trigger. Default: "Select tab" */
  selectTabLabel?: string;
  /** Accessible label for the left scroll-arrow button. Default: "Scroll left" */
  scrollLeftLabel?: string;
  /** Accessible label for the right scroll-arrow button. Default: "Scroll right" */
  scrollRightLabel?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Tabs({
  tabs,
  groups = [],
  defaultTab,
  activeTab: controlledTab,
  onTabChange,
  className = "",
  panelClassName = "",
  ariaLabel,
  showOverflowControls = true,
  showGroupLabels = true,
  overflowMode: explicitOverflowMode,
  variant = "underlined",
  fillContainer = false,
  renderPanel = true,
  moreTabsLabel = "More tabs",
  selectTabLabel = "Select tab",
  scrollLeftLabel = "Scroll left",
  scrollRightLabel = "Scroll right",
}: TabsProps) {
  // Auto-detect overflow mode from groups presence
  const overflowMode =
    explicitOverflowMode ?? (groups.length > 0 ? "menu" : "dropdown");

  // ---- State ----
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.id || "",
  );
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Dropdown mode state (overflowMode === "dropdown")
  const [isMobileDropdown, setIsMobileDropdown] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Overflow menu state (overflowMode === "menu")
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [focusedMenuIndex, setFocusedMenuIndex] = useState(-1);

  // ---- Refs ----
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dropdownContainerRef = useRef<HTMLDivElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const overflowButtonRef = useRef<HTMLButtonElement>(null);
  const menuItemRefs = useRef<HTMLButtonElement[]>([]);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // ---- Derived state ----
  const activeTab = controlledTab ?? internalActiveTab;

  // Group tabs by groupId
  const groupedTabs = useMemo(() => {
    return groups.length > 0
      ? groups.map((group) => ({
          group,
          tabs: tabs.filter((tab) => tab.groupId === group.id),
        }))
      : [{ group: null as TabGroupMeta | null, tabs }];
  }, [groups, tabs]);

  // Flatten menu items for keyboard navigation
  const flattenedMenuTabs = useMemo(() => {
    return groupedTabs.flatMap(({ tabs: groupTabs }) => groupTabs);
  }, [groupedTabs]);

  // ---- Handlers ----

  const handleTabClick = useCallback(
    (tabId: string) => {
      if (!controlledTab) {
        setInternalActiveTab(tabId);
      }
      onTabChange?.(tabId);
      setShowOverflowMenu(false);
    },
    [controlledTab, onTabChange],
  );

  const handleKeyDown = useCallback(
    (
      e: KeyboardEvent<HTMLButtonElement> | KeyboardEvent<HTMLDivElement>,
      currentIndex: number,
    ) => {
      let targetIndex: number;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          targetIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
          break;
        case "ArrowLeft":
          e.preventDefault();
          targetIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
          break;
        case "Home":
          e.preventDefault();
          targetIndex = 0;
          break;
        case "End":
          e.preventDefault();
          targetIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const targetTab = tabs[targetIndex];
      if (targetTab) {
        handleTabClick(targetTab.id);
        tabRefs.current.get(targetTab.id)?.focus();
      }
    },
    [tabs, handleTabClick],
  );

  const setTabRef = useCallback((id: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(id, element);
    } else {
      tabRefs.current.delete(id);
    }
  }, []);

  // ---- Scroll controls ----

  const checkScroll = useCallback(() => {
    const container = tabListRef.current;
    if (!container || !showOverflowControls) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, [showOverflowControls]);

  const scrollTabs = useCallback(
    (direction: "left" | "right") => {
      const container = tabListRef.current;
      if (!container) return;

      const scrollAmount = container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });

      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(checkScroll, 300);
    },
    [checkScroll],
  );

  // ---- Auto-scroll to active tab ----

  const scrollToActiveTab = useCallback(() => {
    if (!tabListRef.current || isMobileDropdown) return;

    const activeButton = tabRefs.current.get(activeTab);
    if (!activeButton) return;

    const container = tabListRef.current;
    const buttonRect = activeButton.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (buttonRect.left < containerRect.left) {
      container.scrollLeft -= containerRect.left - buttonRect.left + 8;
    } else if (buttonRect.right > containerRect.right) {
      container.scrollLeft += buttonRect.right - containerRect.right + 8;
    }
  }, [activeTab, isMobileDropdown]);

  // ---- Mobile dropdown mode ----

  const checkMobileMode = useCallback(() => {
    if (typeof window === "undefined" || overflowMode !== "dropdown") return;
    setIsMobileDropdown(window.innerWidth < 480);
  }, [overflowMode]);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleDropdownKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Escape" && isDropdownOpen) {
        e.preventDefault();
        setIsDropdownOpen(false);
      }
    },
    [isDropdownOpen],
  );

  // ---- Touch swipe (dropdown mode) ----

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      touchEndX.current = e.touches[0].clientX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
      const nextTab = tabs[currentIndex + 1];
      const prevTab = tabs[currentIndex - 1];

      if (diff > 0 && nextTab) {
        handleTabClick(nextTab.id);
      } else if (diff < 0 && prevTab) {
        handleTabClick(prevTab.id);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [activeTab, tabs, handleTabClick]);

  // ---- Overflow menu (menu mode) ----

  const handleOverflowMenuKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const menuItemCount = flattenedMenuTabs.length;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          setShowOverflowMenu(false);
          setFocusedMenuIndex(-1);
          overflowButtonRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedMenuIndex((prev) => {
            const next = prev >= menuItemCount - 1 ? 0 : prev + 1;
            menuItemRefs.current[next]?.focus();
            return next;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedMenuIndex((prev) => {
            const next = prev <= 0 ? menuItemCount - 1 : prev - 1;
            menuItemRefs.current[next]?.focus();
            return next;
          });
          break;
        case "Home":
          e.preventDefault();
          setFocusedMenuIndex(0);
          menuItemRefs.current[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          setFocusedMenuIndex(menuItemCount - 1);
          menuItemRefs.current[menuItemCount - 1]?.focus();
          break;
        default:
          break;
      }
    },
    [flattenedMenuTabs.length],
  );

  const handleOverflowButtonKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Escape" && showOverflowMenu) {
        e.preventDefault();
        setShowOverflowMenu(false);
        setFocusedMenuIndex(-1);
      }
    },
    [showOverflowMenu],
  );

  // ---- Effects ----

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close overflow menu when clicking outside
  useEffect(() => {
    if (!showOverflowMenu) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        overflowMenuRef.current &&
        !overflowMenuRef.current.contains(event.target as Node)
      ) {
        setShowOverflowMenu(false);
        setFocusedMenuIndex(-1);
      }
    };

    const handleEscapeKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowOverflowMenu(false);
        setFocusedMenuIndex(-1);
        overflowButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showOverflowMenu]);

  // Focus menu item when overflow menu opens
  useEffect(() => {
    if (showOverflowMenu && menuItemRefs.current.length > 0) {
      const activeIndex = flattenedMenuTabs.findIndex((tab) => tab.id === activeTab);
      const indexToFocus = activeIndex >= 0 ? activeIndex : 0;
      setFocusedMenuIndex(indexToFocus);
      requestAnimationFrame(() => {
        menuItemRefs.current[indexToFocus]?.focus();
      });
    }
  }, [showOverflowMenu, flattenedMenuTabs, activeTab]);

  // Ensure active tab is valid
  useEffect(() => {
    if (!tabs.find((tab) => tab.id === activeTab)) {
      const firstTab = tabs[0];
      if (firstTab) {
        handleTabClick(firstTab.id);
      }
    }
  }, [tabs, activeTab, handleTabClick]);

  // Check mobile mode and scroll on mount/resize
  useEffect(() => {
    checkMobileMode();
    checkScroll();

    const handleResize = () => {
      checkMobileMode();
      checkScroll();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [checkMobileMode, checkScroll]);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab, scrollToActiveTab]);

  // Check scroll when tabs change
  useEffect(() => {
    checkScroll();
  }, [tabs, checkScroll]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // ---- Render helpers ----

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  const hasGroups = groups.length > 0;

  // Reset menu item refs array each render
  menuItemRefs.current = [];

  /** Render a single tab button */
  const renderTabButton = (tab: TabItem, globalIndex: number) => {
    const isActive = tab.id === activeTab;

    return (
      <button
        key={tab.id}
        ref={(el) => {
          setTabRef(tab.id, el);
        }}
        role="tab"
        aria-selected={isActive}
        aria-controls={renderPanel ? `tabpanel-${tab.id}` : undefined}
        id={`tab-${tab.id}`}
        tabIndex={isActive ? 0 : -1}
        className={`tabs__tab${isActive ? " tabs__tab--active" : ""}`}
        onClick={() => {
          handleTabClick(tab.id);
        }}
        onKeyDown={(e) => {
          handleKeyDown(e, globalIndex);
          // Prevent the tablist's onKeyDown from also firing (it runs the
          // same Arrow/Home/End logic for synthetic tests / unusual focus
          // setups where focus is on the tablist itself).
          if (
            e.key === "ArrowLeft" ||
            e.key === "ArrowRight" ||
            e.key === "Home" ||
            e.key === "End"
          ) {
            e.stopPropagation();
          }
        }}
      >
        {tab.labelPrefix}
        <span className="tabs__tab-label">{tab.label}</span>
        {tab.labelExtra}
      </button>
    );
  };

  /** Render the tab list content (flat or grouped) */
  const renderTabListContent = () => {
    if (hasGroups) {
      return groupedTabs.map(({ group, tabs: groupTabs }, groupIndex) => (
        <div key={group?.id || "default"} className="tabs__group">
          {group && (
            <>
              {groupIndex > 0 && (
                <div className="tabs__separator" role="separator" aria-hidden="true" />
              )}
              {showGroupLabels && (
                <span className="tabs__group-label">{group.label}</span>
              )}
            </>
          )}
          <div className="tabs__group-tabs">
            {groupTabs.map((tab) => {
              const globalIndex = tabs.findIndex((t) => t.id === tab.id);
              return renderTabButton(tab, globalIndex);
            })}
          </div>
        </div>
      ));
    }

    return tabs.map((tab, index) => renderTabButton(tab, index));
  };

  /** Render the overflow menu (menu mode) */
  const renderOverflowMenu = () => {
    if (overflowMode !== "menu" || !showOverflowControls) return null;

    return (
      <div className="tabs__overflow" ref={overflowMenuRef}>
        <button
          ref={overflowButtonRef}
          type="button"
          className="tabs__overflow-btn"
          onClick={() => {
            setShowOverflowMenu(!showOverflowMenu);
          }}
          onKeyDown={handleOverflowButtonKeyDown}
          aria-label={moreTabsLabel}
          aria-expanded={showOverflowMenu}
          aria-haspopup="menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {showOverflowMenu && (
          <div
            className="tabs__overflow-menu"
            role="menu"
            onKeyDown={handleOverflowMenuKeyDown}
          >
            {groupedTabs.map(({ group, tabs: groupTabs }) => (
              <div key={group?.id || "default"} className="tabs__overflow-group">
                {group && showGroupLabels && (
                  <div className="tabs__overflow-group-label">{group.label}</div>
                )}
                {groupTabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  const flatIndex = flattenedMenuTabs.findIndex((t) => t.id === tab.id);
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => {
                        if (el) {
                          menuItemRefs.current[flatIndex] = el;
                        }
                      }}
                      role="menuitem"
                      tabIndex={focusedMenuIndex === flatIndex ? 0 : -1}
                      className={`tabs__overflow-item ${isActive ? "tabs__overflow-item--active" : ""}`}
                      onClick={() => {
                        handleTabClick(tab.id);
                      }}
                    >
                      {tab.labelPrefix}
                      <span>{tab.label}</span>
                      {tab.labelExtra}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---- Variant class helpers ----

  // For segmented/compact variants we always want a single horizontal pill —
  // there is no scrollable arrow affordance and the mobile dropdown trigger
  // would visually conflict with the segmented look. Underlined remains the
  // only variant that follows the historical "scroll + dropdown" behavior.
  const isSegmentedFamily = variant === "segmented" || variant === "compact";
  const variantClass =
    variant === "segmented"
      ? "tabs--variant-segmented"
      : variant === "compact"
        ? "tabs--variant-compact"
        : "";
  const fillContainerClass =
    isSegmentedFamily && fillContainer ? "tabs--fill-container" : "";

  // ---- Mobile dropdown render (overflowMode === "dropdown") ----

  // Segmented/compact variants always render as a single inline tab bar — we
  // skip the mobile-dropdown branch even when the viewport is narrow so the
  // visual matches the existing per-page "segmented control" markup the
  // migration replaces.
  if (overflowMode === "dropdown" && isMobileDropdown && !isSegmentedFamily) {
    return (
      <div className={`tabs tabs--mobile-dropdown ${className}`}>
        <div className="tabs__dropdown-container" ref={dropdownContainerRef}>
          <button
            className="tabs__dropdown-trigger"
            onClick={toggleDropdown}
            onKeyDown={handleDropdownKeyDown}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            aria-label={ariaLabel || selectTabLabel}
          >
            <span className="tabs__dropdown-label">{activeTabLabel}</span>
            <svg
              className={`tabs__dropdown-arrow ${isDropdownOpen ? "tabs__dropdown-arrow--open" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="tabs__dropdown-menu" role="listbox">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="option"
                  aria-selected={tab.id === activeTab}
                  className={`tabs__dropdown-item ${tab.id === activeTab ? "tabs__dropdown-item--active" : ""}`}
                  onClick={() => {
                    handleTabClick(tab.id);
                    setIsDropdownOpen(false);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {renderPanel && (
          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className={`tabs__panel ${panelClassName}`.trim()}
            tabIndex={0}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {activeTabContent}
          </div>
        )}
      </div>
    );
  }

  // ---- Desktop/tablet render ----

  const modeClass = overflowMode === "menu" ? "tabs--overflow-menu" : "";

  return (
    <div
      className={`tabs ${modeClass} ${variantClass} ${fillContainerClass} ${className}`
        .replace(/\s+/g, " ")
        .trim()}
    >
      <div className="tabs__container">
        {/* Scroll left arrow */}
        {showOverflowControls && canScrollLeft && (
          <button
            className="tabs__scroll-arrow tabs__scroll-arrow--left"
            onClick={() => {
              scrollTabs("left");
            }}
            aria-label={scrollLeftLabel}
            tabIndex={-1}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 15L7 10L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div
          ref={tabListRef}
          className="tabs__list"
          role="tablist"
          aria-label={ariaLabel}
          onScroll={checkScroll}
          onKeyDown={(e) => {
            // Mirror the per-button handler at the tablist level so synthetic
            // tests (and unusual focus setups where the tablist itself owns
            // the keyboard focus) get the same Arrow/Home/End behavior. Tab
            // buttons are still the primary handler; this only fires when
            // the event reaches the tablist without being handled by a tab.
            const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
            if (currentIndex < 0) return;
            handleKeyDown(e, currentIndex);
          }}
          onTouchStart={overflowMode === "dropdown" ? handleTouchStart : undefined}
          onTouchMove={overflowMode === "dropdown" ? handleTouchMove : undefined}
          onTouchEnd={overflowMode === "dropdown" ? handleTouchEnd : undefined}
        >
          {renderTabListContent()}
        </div>

        {/* Scroll right arrow */}
        {showOverflowControls && canScrollRight && (
          <button
            className="tabs__scroll-arrow tabs__scroll-arrow--right"
            onClick={() => {
              scrollTabs("right");
            }}
            aria-label={scrollRightLabel}
            tabIndex={-1}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M8 5L13 10L8 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Overflow menu (menu mode) */}
        {renderOverflowMenu()}
      </div>

      {renderPanel && (
        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className={`tabs__panel ${panelClassName}`.trim()}
          tabIndex={0}
        >
          {activeTabContent}
        </div>
      )}
    </div>
  );
}
