/**
 * `TagsInput`: free-form tags held as `string[]`, antd's `Select mode="tags"`.
 * It is ui-common's Tokenizer (../Tokenizer) over an empty search source, so
 * the field chrome is `Form.Item`'s as for every form control
 * (../formControl.tsx).
 *
 * What antd's tags mode did and Astryx's Tokenizer does not:
 *
 * - The value is the tags themselves, deduplicated, not `{id, label}` items.
 * - `tokenSeparators` cut a tag on the keystroke, and take a pasted
 *   `"a,b,c"` apart when it is committed.
 * - Text left in the input when focus leaves the field becomes tags.
 * - The "Create" row is translated (`uic.TagsInput.create`).
 */
import { useMemo, useRef, type FocusEvent, type KeyboardEvent } from "react";
import { useMergedRefs } from "@astryxdesign/core/hooks";
import {
  TypeaheadItem,
  type SearchableItem,
  type SearchSource,
} from "@astryxdesign/core/Typeahead";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { EMPTY_ARRAY, useMergedValue, type DistributiveOmit } from "../formControl";
import { Tokenizer, type TokenizerProps } from "../Tokenizer/Tokenizer";

export type TagsInputProps = DistributiveOmit<
  TokenizerProps<SearchableItem>,
  "value" | "defaultValue" | "onChange" | "searchSource" | "hasCreate"
> & {
  value?: string[];
  /** The starting value when `value` is not set (uncontrolled), as in antd. */
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Characters that end a tag as they are typed, and split a pasted entry. */
  tokenSeparators?: string[];
};

const NO_SUGGESTIONS: SearchSource<SearchableItem> = {
  search: () => [],
  bootstrap: () => [],
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Empties the input the way typing would, so Tokenizer drops its query. */
function clearInput(input: HTMLInputElement) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
    input,
    "",
  );
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function TagsInput({
  value,
  defaultValue,
  onChange,
  tokenSeparators,
  renderItem,
  onKeyDown,
  onBlur,
  ref,
  ...rest
}: TagsInputProps) {
  const t = useUicTranslator();
  const [mergedValue, setTags] = useMergedValue(
    value,
    defaultValue,
    onChange,
    EMPTY_ARRAY,
  );
  const tags = mergedValue ?? EMPTY_ARRAY;
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(inputRef, ref);
  // One identity per value: Tokenizer resets its search when `value` changes.
  const items = useMemo(() => tags.map((tag) => ({ id: tag, label: tag })), [tags]);

  const split = (text: string): string[] => {
    const parts = tokenSeparators?.length
      ? text.split(new RegExp(tokenSeparators.map(escapeRegExp).join("|")))
      : [text];
    return parts.map((part) => part.trim()).filter(Boolean);
  };
  const commit = (next: string[]) => {
    const unique = [...new Set(next)];
    const limited =
      rest.maxEntries == null
        ? unique
        : unique.slice(0, Math.max(rest.maxEntries, tags.length));
    if (limited.length !== tags.length || limited.some((tag, i) => tag !== tags[i])) {
      setTags(limited);
    }
  };
  const commitInput = (input: HTMLInputElement) => {
    if (!input.value.trim()) return;
    commit([...tags, ...split(input.value)]);
    clearInput(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    const input = event.target;
    if (
      !tokenSeparators?.includes(event.key) ||
      !(input instanceof HTMLInputElement) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    // A separator is never part of a tag, even with nothing to commit.
    event.preventDefault();
    commitInput(input);
  };
  const handleBlur = (event: FocusEvent) => {
    if (inputRef.current) commitInput(inputRef.current);
    onBlur?.(event);
  };

  return (
    <Tokenizer<SearchableItem>
      {...rest}
      ref={mergedRef}
      value={items}
      onChange={(next) => commit(next.flatMap((item) => split(item.label)))}
      searchSource={NO_SUGGESTIONS}
      hasCreate
      renderItem={
        renderItem ??
        ((item) => {
          const created = (item as SearchableItem<{ __createdValue?: unknown }>)
            .auxiliaryData?.__createdValue;
          return (
            <TypeaheadItem
              item={
                typeof created === "string"
                  ? { ...item, label: t("uic.TagsInput.create", { value: created }) }
                  : item
              }
            />
          );
        })
      }
      // Searching costs nothing, and an Enter right after typing has to find
      // the create row already listed.
      debounceMs={rest.debounceMs ?? 0}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
