/**
 * PagedSelector
 *
 * A searchable selector, single or multiple, over a list that loads a page at
 * a time: scrolling the panel near its end calls `onEndReached`, which is
 * where a consumer loads the next page (a Relay `loadNext`, a cursor fetch).
 * Search is the consumer's too: `onSearchChange` reports every keystroke.
 *
 * Astryx's `Selector` / `MultiSelector` mount every option and have no
 * scroll callback; `Typeahead` replaces its list on each query. This is
 * built on `ComplexSelector` (ui-common's copy), which owns the field,
 * trigger, popover and focus return and hands the panel body back, so the
 * body can own the scroll container. The body is drawn the way `Selector`'s
 * is: Astryx's panel search row, then option rows with the theme's check.
 *
 * - `value` holds option values: a string (or null) alone, a string array
 *   with `isMultiple`. `onChange` also gets each chosen value's label, so a
 *   consumer can keep labels for values that are not on the loaded page.
 * - A selected value missing from `options` (on another page, or filtered out
 *   by the query) is named from `labels`, then from any page it was seen on,
 *   then shown as the value itself.
 * - Keyboard: ArrowUp/Down, Home/End move a highlight that skips disabled
 *   rows; Enter commits it, and Space too when there is no search box. The
 *   panel is `ComplexSelector`'s dialog holding a listbox, not an ARIA
 *   combobox.
 * - Options render one DOM row each; paging is what keeps that bounded.
 *
 * @example
 * <PagedSelector
 *   label="Owner"
 *   value={ownerId}
 *   onChange={(id) => setOwnerId(id)}
 *   options={users.map((u) => ({ value: u.id, label: u.email }))}
 *   onSearchChange={setQuery}
 *   onEndReached={() => hasNext && loadNext(10)}
 *   isLoadingMore={isLoadingNext}
 *   totalCount={count}
 * />
 */
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ComplexSelector,
  type ComplexSelectorProps,
} from "../../forks/ComplexSelector";
import { compiledStyles } from "../../forks/compiled";
import { Divider } from "@astryxdesign/core/Divider";
import { useIndicator } from "@astryxdesign/core/Indicator";
import { SelectorOption } from "@astryxdesign/core/Selector";
import { Spinner } from "@astryxdesign/core/Spinner";
import { HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden";
import { themeProps } from "@astryxdesign/core/utils";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { PanelSearchInput } from "./PanelSearchInput";
import "./PagedSelector.css";

export interface PagedSelectorOption {
  value: string;
  /** The option's name: the trigger text and the row's accessible name. */
  label: string;
  /** Drawn in the row in place of `label`, for a row richer than a string. */
  labelContent?: ReactNode;
  /** Leading visual (avatar, glyph). */
  icon?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
  /** Trailing content (tokens, meta). */
  endContent?: ReactNode;
  isDisabled?: boolean;
}

/** A chosen value with its label, as `onChange` reports it. */
export interface PagedSelectorSelectedItem {
  value: string;
  label: string;
}

type Passthrough = Pick<
  ComplexSelectorProps<string[]>,
  | "label"
  | "isLabelHidden"
  | "description"
  | "isOptional"
  | "isRequired"
  | "isDisabled"
  | "isLoading"
  | "status"
  | "statusVariant"
  | "labelTooltip"
  | "size"
  | "variant"
  | "startIcon"
  | "width"
  | "placement"
  | "alignment"
  | "onOpenChange"
  | "xstyle"
  | "className"
  | "style"
  | "data-testid"
>;

interface PagedSelectorBaseProps extends Passthrough {
  /** The loaded options, every page so far, in order. */
  options: readonly PagedSelectorOption[];
  /** Labels for selected values that may not be among `options`. */
  labels?: Readonly<Record<string, string>>;
  /**
   * Placeholder while nothing is selected.
   * @default the catalog's uic.PagedSelector.placeholder ("Select {label}")
   */
  placeholder?: string;
  /** Show the search box at the top of the panel. @default true */
  hasSearch?: boolean;
  /** Controlled search text; uncontrolled without it. */
  searchValue?: string;
  /** Called on every keystroke in the search box; debounce it yourself. */
  onSearchChange?: (searchValue: string) => void;
  /** @default the catalog's uic.PagedSelector.searchPlaceholder ("Search") */
  searchPlaceholder?: string;
  /** @default the catalog's uic.PagedSelector.searchOptions ("Search options") */
  searchLabel?: string;
  /** @default the catalog's uic.PagedSelector.clearSearch ("Clear search options") */
  clearSearchLabel?: string;
  /**
   * Called once each time the list is scrolled to within
   * `endReachedThreshold` px of its end. Load the next page here.
   */
  onEndReached?: () => void;
  /** Distance from the end, in px, that counts as reaching it. @default 30 */
  endReachedThreshold?: number;
  /** Called when the list arrives at, or leaves, its end. */
  onAtEndChange?: (isAtEnd: boolean) => void;
  /** A spinner in the foot while the next page loads. */
  isLoadingMore?: boolean;
  /** Options in all pages; shows the "Total N items" foot when positive. */
  totalCount?: number;
  /** @default the catalog's uic.PagedSelector.totalItems ("Total {total} items") */
  formatTotalCount?: (total: number) => string;
  /**
   * Replaces the empty list's content, the loading row included.
   * @default the catalog's uic.PagedSelector.loading while `isLoading`, else
   * uic.PagedSelector.noResults ("No results")
   */
  emptyText?: ReactNode;
  /** Above the option list, under the search box. */
  header?: ReactNode;
  /** Below the option list, in place of the total count. A function gets `close`. */
  footer?: ReactNode | ((close: () => void) => ReactNode);
  /** Height the option list scrolls within, in px. @default 260 */
  listMaxHeight?: number;
  /**
   * How a multiple selection shows in the trigger: `labels` ("A, B, C, +2",
   * as `MultiSelector`) or `badges` (tokens). @default "labels"
   */
  triggerDisplay?: "labels" | "badges";
  /** Selected items the trigger names before "+N". @default 3 */
  maxTriggerItems?: number;
  /** How a selected row is marked: the theme's check at its end, or a checkbox at its start. @default "check" */
  selectionIndicator?: "check" | "checkbox";
  /** A clear button in the trigger while something is selected. */
  hasClear?: boolean;
  /** Runs on clear. @default onChange(null) alone, onChange([]) with isMultiple */
  onClear?: () => void;
}

export interface PagedSelectorSingleProps extends PagedSelectorBaseProps {
  isMultiple?: false;
  value?: string | null;
  onChange?: (value: string | null, item: PagedSelectorSelectedItem | null) => void;
}

export interface PagedSelectorMultipleProps extends PagedSelectorBaseProps {
  isMultiple: true;
  value?: readonly string[];
  onChange?: (value: string[], items: PagedSelectorSelectedItem[]) => void;
}

export type PagedSelectorProps = PagedSelectorSingleProps | PagedSelectorMultipleProps;

/**
 * `ComplexSelector` insets its panel body by `--spacing-3`; this body brings
 * Selector's own gutters, so the inset goes. Astryx's compiled `padding: 0`
 * class (kmVPX3 is StyleX's key for `padding`), so no StyleX compiler is
 * needed; the test suite fails if astryx.css stops defining it.
 */
export const CONTENT_RESET = { padding: "x1717udv" } as const;
const contentStyles = compiledStyles({
  reset: { kmVPX3: CONTENT_RESET.padding, $$css: true },
});

export function PagedSelector(props: PagedSelectorProps) {
  const {
    label,
    options,
    labels,
    placeholder,
    hasSearch = true,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    searchLabel,
    clearSearchLabel,
    onEndReached,
    endReachedThreshold = 30,
    onAtEndChange,
    isLoadingMore,
    totalCount,
    formatTotalCount,
    emptyText,
    header,
    footer,
    listMaxHeight = 260,
    triggerDisplay = "labels",
    maxTriggerItems = 3,
    selectionIndicator = "check",
    hasClear,
    onClear,
    onOpenChange,
    isLoading,
    size,
    isMultiple,
    value: _value,
    onChange: _onChange,
    ...rest
  } = props;
  const t = useUicTranslator();
  const CheckMark = useIndicator("check");
  const CheckboxMark = useIndicator("checkbox");
  const listboxId = useId();
  const optionIdPrefix = useId();

  const selectedValues: string[] = props.isMultiple
    ? [...(props.value ?? [])]
    : props.value != null
      ? [props.value]
      : [];

  // Labels of every option seen, so a value picked from a page the list has
  // since dropped (a new query) keeps its name.
  const seenLabels = useRef(new Map<string, string>());
  for (const option of options) seenLabels.current.set(option.value, option.label);
  const labelOf = (value: string) =>
    labels?.[value] ??
    options.find((option) => option.value === value)?.label ??
    seenLabels.current.get(value) ??
    value;

  const emit = (values: string[]) => {
    const items = values.map((value) => ({ value, label: labelOf(value) }));
    if (props.isMultiple) props.onChange?.(values, items);
    else props.onChange?.(values[0] ?? null, items[0] ?? null);
  };

  // -1: an opened Astryx Selector highlights nothing until the pointer or an
  // arrow key picks a row.
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [internalSearch, setInternalSearch] = useState("");
  const search = searchValue ?? internalSearch;
  const isAtEnd = useRef(false);

  const optionIdOf = (index: number) => `${optionIdPrefix}-option-${index}`;
  const clampedIndex =
    options.length === 0 || highlightedIndex < 0
      ? -1
      : Math.min(highlightedIndex, options.length - 1);
  // A row that went disabled under a page append does not keep the highlight.
  const activeIndex =
    clampedIndex >= 0 && options[clampedIndex]?.isDisabled ? -1 : clampedIndex;

  const nextEnabledIndex = (from: number, step: 1 | -1) => {
    for (let i = from; i >= 0 && i < options.length; i += step) {
      if (!options[i]?.isDisabled) return i;
    }
    return -1;
  };

  useLayoutEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(optionIdOf(activeIndex))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!onEndReached && !onAtEndChange) return;
    const el = event.currentTarget;
    const isAtEndNow =
      el.scrollHeight - el.scrollTop - el.clientHeight <= endReachedThreshold;
    if (isAtEndNow === isAtEnd.current) return;
    isAtEnd.current = isAtEndNow;
    onAtEndChange?.(isAtEndNow);
    if (isAtEndNow) onEndReached?.();
  };

  const isSelected = (value: string) => selectedValues.includes(value);

  const commit = (option: PagedSelectorOption, close: () => void) => {
    if (!isMultiple) {
      emit([option.value]);
      close();
      return;
    }
    emit(
      isSelected(option.value)
        ? selectedValues.filter((value) => value !== option.value)
        : [...selectedValues, option.value],
    );
  };

  // Shared by the search box and, with no search box, the listbox itself.
  // Space commits only where it is not typing into the search box.
  const handleNavKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    close: () => void,
    hasSpaceCommit: boolean,
  ) => {
    if (options.length === 0) return;
    const moveTo = (index: number) => {
      if (index >= 0) setHighlightedIndex(index);
    };
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveTo(nextEnabledIndex(activeIndex < 0 ? 0 : activeIndex + 1, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        moveTo(
          activeIndex < 0
            ? nextEnabledIndex(0, 1)
            : nextEnabledIndex(activeIndex - 1, -1),
        );
        break;
      case "Home":
        event.preventDefault();
        moveTo(nextEnabledIndex(0, 1));
        break;
      case "End":
        event.preventDefault();
        moveTo(nextEnabledIndex(options.length - 1, -1));
        break;
      case " ":
      case "Enter": {
        if (event.key === " " && !hasSpaceCommit) break;
        const option = options[activeIndex];
        if (!option || option.isDisabled) break;
        event.preventDefault();
        commit(option, close);
        break;
      }
      default:
        break;
    }
  };

  const triggerLabel = (() => {
    if (selectedValues.length === 0) return undefined;
    if (!isMultiple) return labelOf(selectedValues[0]!);
    const shown = selectedValues.slice(0, maxTriggerItems);
    const remaining = selectedValues.length - shown.length;
    if (triggerDisplay === "badges") {
      // Display-only: the trigger is ComplexSelector's own <button>, so a
      // removable token would nest a button in a button.
      return (
        <HStack gap={0.5} vAlign="center" wrap="wrap">
          {shown.map((value) => (
            <Token key={value} label={labelOf(value)} size="sm" />
          ))}
          {remaining > 0 ? <Text color="secondary">{`+${remaining}`}</Text> : null}
        </HStack>
      );
    }
    const joined = shown.map(labelOf).join(", ");
    return remaining > 0 ? `${joined}, +${remaining}` : joined;
  })();

  const totalText = (total: number) =>
    formatTotalCount?.(total) ?? t("uic.PagedSelector.totalItems", { total });
  const loadingText = t("uic.PagedSelector.loading");

  return (
    <ComplexSelector<string[]>
      {...rest}
      label={label}
      value={selectedValues}
      onChange={emit}
      triggerLabel={triggerLabel}
      placeholder={placeholder ?? t("uic.PagedSelector.placeholder", { label })}
      isLoading={isLoading}
      size={size}
      hasClear={hasClear}
      onClear={onClear ?? (() => emit([]))}
      onOpenChange={(isOpen) => {
        // Astryx drops its highlight when the panel closes, so the next open
        // starts clean.
        if (!isOpen) setHighlightedIndex(-1);
        onOpenChange?.(isOpen);
      }}
      contentXstyle={contentStyles.reset}
    >
      {(_current, _commit, close) => (
        <div>
          {hasSearch ? (
            <>
              <PanelSearchInput
                label={searchLabel ?? t("uic.PagedSelector.searchOptions")}
                clearLabel={clearSearchLabel ?? t("uic.PagedSelector.clearSearch")}
                placeholder={
                  searchPlaceholder ?? t("uic.PagedSelector.searchPlaceholder")
                }
                value={search}
                onValueChange={(next) => {
                  setInternalSearch(next);
                  // Seeds the first selectable row, so type-then-Enter works.
                  setHighlightedIndex(nextEnabledIndex(0, 1));
                  onSearchChange?.(next);
                }}
                onKeyDown={(event) => handleNavKeyDown(event, close, false)}
                aria-controls={listboxId}
                aria-activedescendant={
                  activeIndex >= 0 ? optionIdOf(activeIndex) : undefined
                }
              />
              <Divider />
            </>
          ) : null}
          {header}
          <div
            id={listboxId}
            role="listbox"
            aria-label={label}
            aria-multiselectable={isMultiple || undefined}
            // With no search box nothing else in the panel takes focus, so the
            // popover's autofocus lands here and the arrows work.
            tabIndex={hasSearch ? undefined : 0}
            aria-activedescendant={
              !hasSearch && activeIndex >= 0 ? optionIdOf(activeIndex) : undefined
            }
            onKeyDown={
              hasSearch ? undefined : (event) => handleNavKeyDown(event, close, true)
            }
            onScroll={handleScroll}
            className="uic-paged-selector__listbox"
            style={{ maxHeight: listMaxHeight }}
          >
            {options.length === 0 ? (
              <div className="uic-paged-selector__empty">
                {emptyText !== undefined ? (
                  emptyText
                ) : isLoading ? (
                  <HStack gap={1} vAlign="center" hAlign="center">
                    <Spinner size="sm" />
                    <Text color="secondary">{loadingText}</Text>
                  </HStack>
                ) : (
                  <Text color="secondary">{t("uic.PagedSelector.noResults")}</Text>
                )}
              </div>
            ) : (
              options.map((option, index) => {
                const selected = isSelected(option.value);
                const isDisabled = option.isDisabled ?? false;
                return (
                  <div
                    key={option.value}
                    id={optionIdOf(index)}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={isDisabled || undefined}
                    className="uic-paged-selector__option"
                    data-size={size === "sm" ? "sm" : undefined}
                    data-selected={selected ? "true" : undefined}
                    data-highlighted={index === activeIndex ? "true" : undefined}
                    data-disabled={isDisabled ? "true" : undefined}
                    onClick={() => {
                      if (isDisabled) return;
                      setHighlightedIndex(index);
                      commit(option, close);
                    }}
                    onMouseEnter={() => {
                      if (!isDisabled) setHighlightedIndex(index);
                    }}
                  >
                    {selectionIndicator === "checkbox" && (
                      <span className="uic-paged-selector__option-mark">
                        <CheckboxMark
                          state={selected ? "checked" : "unchecked"}
                          size="sm"
                          isDisabled={isDisabled}
                        />
                      </span>
                    )}
                    <span className="uic-paged-selector__option-content">
                      <SelectorOption
                        icon={option.icon}
                        label={option.labelContent ?? option.label}
                        description={option.description}
                        endContent={option.endContent}
                      />
                    </span>
                    {/* Rendered with the state passed down: a theme that swaps
                        the check for a radio draws its empty circle too. */}
                    {selectionIndicator === "check" && (
                      <span className="uic-paged-selector__option-mark">
                        <CheckMark
                          state={selected ? "checked" : "unchecked"}
                          size="sm"
                          isDisabled={isDisabled}
                          {...themeProps("selector-check")}
                        />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {(typeof footer === "function" ? footer(close) : footer) ??
            (typeof totalCount === "number" && totalCount > 0 ? (
              <HStack
                gap={1}
                vAlign="center"
                hAlign="end"
                className="uic-paged-selector__foot"
              >
                {isLoadingMore ? <Spinner size="sm" /> : null}
                <Text color="secondary" size="sm">
                  {totalText(totalCount)}
                </Text>
              </HStack>
            ) : null)}
          <VisuallyHidden as="div" aria-live="polite">
            {options.length === 0 && isLoading
              ? loadingText
              : totalText(options.length)}
          </VisuallyHidden>
        </div>
      )}
    </ComplexSelector>
  );
}
