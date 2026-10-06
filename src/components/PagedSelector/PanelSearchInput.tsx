// Copyright (c) Meta Platforms, Inc. and affiliates.
// Modifications copyright (c) Lablup Inc.
//
// Adapted from @astryxdesign/core 0.6.5, dist/Field/PanelSearchInput.js and
// dist/utils/interactionModality.js (MIT; see NOTICE). Neither is exported by
// the package; Selector and MultiSelector use them for their search row.

"use client";

/**
 * The search row at the top of PagedSelector's panel: magnifier, borderless
 * input, and a clear button once a query is typed, in a rounded box shaped
 * like the option rows beneath it. Astryx's own, so the row reads exactly as
 * `Selector`'s does.
 *
 * It renders with the class names Astryx compiled for this version (their
 * rules arrive with `astryx.css`), so it needs no stylesheet and no StyleX
 * compiler. The keyboard-only focus ring is Astryx's too. The test suite
 * fails when an Astryx bump drops one of these classes.
 */
import {
  useCallback,
  useEffect,
  useState,
  type KeyboardEventHandler,
  type Ref,
} from "react";
import { InputClearButton } from "@astryxdesign/core/Field";
import { Icon } from "@astryxdesign/core/Icon";

import { compiledStyles } from "../../forks/compiled";

/** Astryx's compiled classes, from dist/Field/PanelSearchInput.js and Selector's `searchRowInput`. */
export const PANEL_SEARCH_CLASS_NAMES = {
  /** `styles.wrapper` with Selector's popover `searchRowInput` padding. */
  wrapper: "xu0wf1k x2hg6jq",
  field:
    "x9f619 x78zum5 x6s0dn4 x1txdalj xh8yej3 x1vofgu7 xf314gf xh6dtrn xkdsq27 xuedmi6 x12w9bfk xlr8y92",
  /** Added to `field` while focus arrived by keyboard: draws the inset ring. */
  fieldKeyboardFocus: "x1gnnqk1 x1btxeh5",
  input:
    "x1iyjqo2 xs83m0k xeuugli x1717udv x1ghz6dp xc342km xng3xce xjbqb8w x1tgivj0 x9ynric xcr08ib x1w61h2b x1kq96og x1a2a7pz xeyghm5",
} as const;

const iconStyles = compiledStyles({
  icon: { k1xSpc: "x78zum5", kGNEyG: "x6s0dn4", kmuXW: "x2lah0s", $$css: true },
});

// Astryx's interaction-modality store, shared through the same document
// symbol, so this copy and Astryx's agree on how the user last interacted.
// `:focus-visible` matches a text input focused by pointer too, so the ring
// is gated on the last modality being the keyboard.
type Modality = "keyboard" | "pointer";
type ModalityStore = {
  modality: Modality;
  isListening: boolean;
  onPointerDown: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
};
const MODALITY_STORE_KEY = Symbol.for("@astryxdesign/core/interaction-modality/v1");

function getModalityStore(doc: Document): ModalityStore {
  const holder = doc as unknown as Record<symbol, ModalityStore | undefined>;
  const existing = holder[MODALITY_STORE_KEY];
  if (existing != null) return existing;
  const store: ModalityStore = {
    modality: "keyboard",
    isListening: false,
    onPointerDown: () => {
      store.modality = "pointer";
    },
    onKeyDown: (event) => {
      if (event.metaKey || event.altKey || event.ctrlKey) return;
      store.modality = "keyboard";
    },
  };
  Object.defineProperty(doc, MODALITY_STORE_KEY, { value: store });
  return store;
}

function trackInteractionModality(): void {
  if (typeof document === "undefined") return;
  const store = getModalityStore(document);
  if (store.isListening) return;
  store.isListening = true;
  document.addEventListener("pointerdown", store.onPointerDown, {
    capture: true,
    passive: true,
  });
  document.addEventListener("keydown", store.onKeyDown, {
    capture: true,
    passive: true,
  });
}

function getInteractionModality(): Modality {
  return typeof document === "undefined"
    ? "keyboard"
    : getModalityStore(document).modality;
}

export interface PanelSearchInputProps {
  ref?: Ref<HTMLInputElement>;
  label: string;
  clearLabel: string;
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  "aria-controls"?: string;
  "aria-activedescendant"?: string;
}

export function PanelSearchInput({
  ref,
  label,
  clearLabel,
  placeholder,
  value,
  onValueChange,
  onKeyDown,
  ...ariaProps
}: PanelSearchInputProps) {
  const [isKeyboardFocus, setIsKeyboardFocus] = useState(false);
  const [input, setInput] = useState<HTMLInputElement | null>(null);

  useEffect(() => trackInteractionModality(), []);

  const attachInput = useCallback(
    (node: HTMLInputElement | null) => {
      setInput(node);
      if (typeof ref === "function") ref(node);
      else if (ref != null)
        (ref as { current: HTMLInputElement | null }).current = node;
    },
    [ref],
  );

  const handleClear = useCallback(
    (event?: React.MouseEvent) => {
      onValueChange("");
      // Upstream: keyboard keeps focus synchronously; a tap defers it past the
      // button's unmount so touch browsers do not jump the page.
      if (!event || event.detail === 0) input?.focus();
      else requestAnimationFrame(() => input?.focus({ preventScroll: true }));
    },
    [input, onValueChange],
  );

  return (
    <div className={PANEL_SEARCH_CLASS_NAMES.wrapper}>
      <div
        data-keyboard-focus={isKeyboardFocus ? "true" : undefined}
        className={
          isKeyboardFocus
            ? `${PANEL_SEARCH_CLASS_NAMES.field} ${PANEL_SEARCH_CLASS_NAMES.fieldKeyboardFocus}`
            : PANEL_SEARCH_CLASS_NAMES.field
        }
      >
        <Icon icon="search" size="sm" color="secondary" xstyle={iconStyles.icon} />
        <input
          ref={attachInput}
          type="text"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setIsKeyboardFocus(getInteractionModality() === "keyboard")}
          onBlur={() => setIsKeyboardFocus(false)}
          className={PANEL_SEARCH_CLASS_NAMES.input}
          role="combobox"
          aria-expanded
          aria-autocomplete="list"
          {...ariaProps}
        />
        {value !== "" && <InputClearButton label={clearLabel} onClick={handleClear} />}
      </div>
    </div>
  );
}
