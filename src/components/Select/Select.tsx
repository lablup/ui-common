/**
 * Select Component
 *
 * Single-select listbox with an optional search filter, icons, descriptions and
 * a disabled-but-visible option state. The listbox is portalled, so a select
 * near the bottom of a scrolling panel is not clipped by it.
 *
 * Every string it renders arrives as a prop with an English default, so the
 * component resolves no locale key of its own.
 */

import { useState, useRef, useEffect, useCallback, useId, useMemo } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Select.css";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Keep an unavailable choice visible while preventing its selection. */
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  options: SelectOption<T>[];
  /**
   * Field label rendered above the trigger, the way `TextInput` renders its
   * own. Names the trigger and the listbox through `aria-labelledby`, so a
   * caller that supplies it does not also need `aria-label`.
   */
  label?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  size?: "small" | "default" | "medium" | "large";
  fullWidth?: boolean;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  invalid?: boolean;
  /**
   * Shown in place of the list when a search matches nothing. English default,
   * because this package cannot resolve a consumer's locale key: a product that
   * localises passes its own words.
   */
  noOptionsLabel?: string;
}

export function Select<T extends string = string>({
  value,
  onChange,
  onBlur,
  options,
  label,
  placeholder = "Select...",
  disabled = false,
  size = "default",
  fullWidth = false,
  className = "",
  searchable = false,
  searchPlaceholder,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  invalid = false,
  noOptionsLabel = "No options",
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<(HTMLDivElement | null)[]>([]);
  const listboxId = useId();
  const optionIdPrefix = useId();
  const labelId = useId();
  const hasLabel = label !== undefined && label !== null && label !== false;

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);
  const visibleOptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!searchable || normalizedQuery.length === 0) return options;
    return options.filter((option) =>
      [option.label, option.value, option.description ?? ""].some((candidate) =>
        candidate.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [options, searchQuery, searchable]);

  const findEnabledIndex = useCallback(
    (start: number, step: 1 | -1): number => {
      for (
        let index = start;
        index >= 0 && index < visibleOptions.length;
        index += step
      ) {
        const option = visibleOptions[index];
        if (option && !option.disabled) return index;
      }
      return -1;
    },
    [visibleOptions],
  );

  // Generate unique option ID
  const getOptionId = (index: number) => `${optionIdPrefix}-option-${String(index)}`;

  // Get active descendant ID for screen readers
  const activeDescendantId = focusedIndex >= 0 ? getOptionId(focusedIndex) : undefined;

  // Calculate dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width, // Use trigger width as minimum, but allow expansion
    });
  }, []);

  // Open dropdown
  const openDropdown = useCallback(() => {
    if (disabled) return;
    updateDropdownPosition();
    setIsOpen(true);
    const selectedIndex = visibleOptions.findIndex(
      (opt) => opt.value === value && !opt.disabled,
    );
    setFocusedIndex(selectedIndex !== -1 ? selectedIndex : findEnabledIndex(0, 1));
  }, [disabled, visibleOptions, value, updateDropdownPosition, findEnabledIndex]);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    setSearchQuery("");
    triggerRef.current?.focus();
  }, []);

  // Handle option selection
  const selectOption = useCallback(
    (option: SelectOption<T>, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (option.disabled) return;
      onChange(option.value);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      const target = event.target as Node;
      // Check if click is outside both the container and the dropdown (which is portaled)
      const isOutsideContainer =
        containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown =
        dropdownRef.current && !dropdownRef.current.contains(target);
      if (isOutsideContainer && isOutsideDropdown) {
        closeDropdown();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeDropdown]);

  // Handle window resize/scroll to update dropdown position
  useEffect(() => {
    if (!isOpen) return;

    const handlePositionUpdate = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", handlePositionUpdate);
    window.addEventListener("scroll", handlePositionUpdate, true);

    return () => {
      window.removeEventListener("resize", handlePositionUpdate);
      window.removeEventListener("scroll", handlePositionUpdate, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (isOpen && searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    if (!isOpen || !searchable) return;
    optionsRef.current = [];
    const selectedIndex = visibleOptions.findIndex(
      (option) => option.value === value && !option.disabled,
    );
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : findEnabledIndex(0, 1));
  }, [isOpen, searchQuery, searchable, value, visibleOptions, findEnabledIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen) {
            const focusedOption = visibleOptions[focusedIndex];
            if (focusedOption) {
              selectOption(focusedOption);
            }
          } else {
            openDropdown();
          }
          break;

        case "Escape":
          e.preventDefault();
          if (isOpen) {
            closeDropdown();
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            const nextIndex = findEnabledIndex(focusedIndex + 1, 1);
            if (nextIndex >= 0) setFocusedIndex(nextIndex);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            const previousIndex = findEnabledIndex(focusedIndex - 1, -1);
            if (previousIndex >= 0) setFocusedIndex(previousIndex);
          }
          break;

        case "Tab":
          if (isOpen) {
            closeDropdown();
          }
          break;
      }
    },
    [
      disabled,
      isOpen,
      focusedIndex,
      visibleOptions,
      findEnabledIndex,
      openDropdown,
      closeDropdown,
      selectOption,
    ],
  );

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case "Enter": {
          event.preventDefault();
          const focusedOption = visibleOptions[focusedIndex];
          if (focusedOption) selectOption(focusedOption);
          break;
        }
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          closeDropdown();
          break;
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((current) => {
            const nextIndex = findEnabledIndex(current + 1, 1);
            return nextIndex >= 0 ? nextIndex : current;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((current) => {
            const previousIndex = findEnabledIndex(current - 1, -1);
            return previousIndex >= 0 ? previousIndex : current;
          });
          break;
        case "Tab":
          closeDropdown();
          break;
      }
    },
    [closeDropdown, focusedIndex, selectOption, visibleOptions, findEnabledIndex],
  );

  // Scroll focused option into view
  useEffect(() => {
    const focusedElement = optionsRef.current[focusedIndex];
    if (isOpen && focusedIndex >= 0 && focusedElement) {
      focusedElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [isOpen, focusedIndex]);

  const sizeClass = size !== "default" ? `select--${size}` : "";
  const widthClass = fullWidth ? "select--full-width" : "";
  const labelledClass = hasLabel ? "select--labelled" : "";
  // aria-labelledby wins over aria-label in the accessible-name calculation,
  // so a caller may pass either; the rendered label is preferred when present.
  const labelledBy = hasLabel ? labelId : undefined;
  const searchFieldLabel = searchPlaceholder ?? ariaLabel;

  return (
    <div
      ref={containerRef}
      className={`select ${sizeClass} ${widthClass} ${labelledClass} ${isOpen ? "select--open" : ""} ${disabled ? "select--disabled" : ""} ${className}`}
    >
      {hasLabel && (
        <span className="select__label" id={labelId}>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        className="select__trigger"
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={isOpen ? activeDescendantId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid || undefined}
      >
        {selectedOption ? (
          <span className="select__value">
            {selectedOption.icon && (
              <span className="select__value-icon">{selectedOption.icon}</span>
            )}
            <span className="select__value-label">{selectedOption.label}</span>
          </span>
        ) : (
          <span className="select__placeholder">{placeholder}</span>
        )}
        <span className={`select__chevron ${isOpen ? "select__chevron--open" : ""}`}>
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="select__dropdown select__dropdown--portal"
            style={{
              position: "fixed",
              top: `${String(dropdownPosition.top)}px`,
              left: `${String(dropdownPosition.left)}px`,
              width: `${String(dropdownPosition.width)}px`,
            }}
          >
            {searchable && (
              <div className="select__search">
                <input
                  ref={searchInputRef}
                  className="select__search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.currentTarget.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchFieldLabel}
                  aria-labelledby={searchFieldLabel ? undefined : labelledBy}
                  aria-controls={listboxId}
                  aria-activedescendant={activeDescendantId}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}
            <div
              className="select__options"
              role="listbox"
              id={listboxId}
              aria-label={ariaLabel}
              aria-labelledby={labelledBy}
            >
              {visibleOptions.length === 0 ? (
                <div className="select__empty">{noOptionsLabel}</div>
              ) : (
                visibleOptions.map((option, index) => (
                  <div
                    key={option.value}
                    id={getOptionId(index)}
                    ref={(el) => {
                      optionsRef.current[index] = el;
                    }}
                    className={`select__option ${
                      option.value === value ? "select__option--selected" : ""
                    } ${index === focusedIndex ? "select__option--focused" : ""} ${option.disabled ? "select__option--disabled" : ""}`}
                    role="option"
                    aria-selected={option.value === value}
                    aria-disabled={option.disabled || undefined}
                    aria-label={
                      option.description
                        ? option.label + ". " + option.description
                        : undefined
                    }
                    onClick={(e) => {
                      selectOption(option, e);
                    }}
                    onMouseEnter={() => {
                      if (!option.disabled) setFocusedIndex(index);
                    }}
                  >
                    {option.icon && (
                      <span className="select__option-icon">{option.icon}</span>
                    )}
                    <div className="select__option-content">
                      <span className="select__option-label">{option.label}</span>
                      {option.description && (
                        <span className="select__option-description">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {option.value === value && (
                      <span className="select__option-check">
                        <svg
                          width="14"
                          height="10"
                          viewBox="0 0 14 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 5L5 9L13 1"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
