/**
 * ColorPicker
 *
 * A colour field: a swatch trigger that opens a popover holding the
 * platform's colour input and a hex text field, and optionally a clear
 * button. Astryx has no colour picker, so the picking area is the native
 * `<input type="color">` and everything around it is Astryx.
 *
 * The value is a `#rrggbb` string on both edges. `onChange` fires when the
 * user settles on a colour (the native input's `change` event, or a complete
 * hex typed into the field), not on every pointer move while dragging, so a
 * caller that writes a setting writes it once. There is no alpha.
 *
 * @example
 * <ColorPicker value={accent} onChange={setAccent} hasValueLabel hasClear onClear={reset} />
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Popover } from "@astryxdesign/core/Popover";
import { VStack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import "./ColorPicker.css";

const FULL_HEX = /^#[0-9a-fA-F]{6}$/;
const SHORT_HEX = /^#[0-9a-fA-F]{3}$/;
const HEX_WITH_ALPHA = /^#[0-9a-fA-F]{8}$/;
const RGB_FUNCTION = /^rgba?\(([^)]+)\)$/i;

const toHexPair = (channel: number) =>
  Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, "0");

/**
 * Normalises `#rgb`, `#rrggbb`, `#rrggbbaa` (alpha dropped), `rgb()` and
 * `rgba()` to lower-case `#rrggbb`. Anything else is `null`, so an
 * unparseable value renders as unset instead of painting black.
 */
export function toHexColor(value?: string | null): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (FULL_HEX.test(raw)) return raw.toLowerCase();
  if (HEX_WITH_ALPHA.test(raw)) return raw.slice(0, 7).toLowerCase();
  if (SHORT_HEX.test(raw)) {
    const [, r, g, b] = raw;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const rgb = RGB_FUNCTION.exec(raw);
  if (rgb) {
    const parts = rgb[1]!
      .split(/[,/\s]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
      return `#${toHexPair(parts[0]!)}${toHexPair(parts[1]!)}${toHexPair(parts[2]!)}`;
    }
  }
  return null;
}

export interface ColorPickerProps {
  /** The colour: hex, or anything `toHexColor` normalises. */
  value?: string | null;
  /** Fires with `#rrggbb` when the user settles on a colour. */
  onChange?: (hex: string) => void;
  /** Shows the hex value next to the swatch on the trigger. */
  hasValueLabel?: boolean;
  /** Offers a clear button in the popover. */
  hasClear?: boolean;
  /** Fires when the clear button is pressed. */
  onClear?: () => void;
  isDisabled?: boolean;
  /**
   * Accessible name of the trigger and the colour area.
   * @default the catalog's uic.ColorPicker.label ("Select color")
   */
  label?: string;
  /** @default the catalog's uic.ColorPicker.hexValue ("Hex value") */
  hexValueLabel?: string;
  /** @default the catalog's uic.ColorPicker.clear ("Clear") */
  clearLabel?: string;
  /** Shown on the trigger when there is no colour. @default the catalog's uic.ColorPicker.noColor ("No color") */
  noColorLabel?: string;
  className?: string;
  style?: CSSProperties;
  /**
   * Test id of the trigger. The colour area, the hex field, the clear button
   * and the value label get `<id>-area`, `<id>-hex`, `<id>-clear` and
   * `<id>-value`.
   */
  "data-testid"?: string;
}

export function ColorPicker({
  value,
  onChange,
  hasValueLabel,
  hasClear,
  onClear,
  isDisabled,
  label,
  hexValueLabel,
  clearLabel,
  noColorLabel,
  className,
  style,
  "data-testid": testId,
}: ColorPickerProps) {
  const t = useUicTranslator();
  const areaRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const hex = toHexColor(value);
  // The popover's working copy, seeded when it opens. An unshowable value
  // opens the area on black; the trigger keeps showing it as unset.
  const [draft, setDraft] = useState<string>(hex ?? "#000000");
  const [text, setText] = useState<string>(hex ?? "");

  const commit = (next: string) => {
    const normalised = toHexColor(next);
    if (!normalised || normalised === hex) return;
    onChange?.(normalised);
  };

  // React's onChange is the `input` event, which fires all through a drag;
  // the settled value is the native `change` event, subscribed on the node.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const handleChange = () => commit(el.value);
    el.addEventListener("change", handleChange);
    return () => el.removeEventListener("change", handleChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hex]);

  const triggerLabel = label ?? t("uic.ColorPicker.label");

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setDraft(hex ?? "#000000");
          setText(hex ?? "");
        }
        // Closing commits nothing: both commit paths have fired by then, and a
        // close-commit would re-send a value the user just cleared.
      }}
      label={triggerLabel}
      placement="below"
      alignment="start"
      content={
        <VStack gap={3} align="stretch" className="uic-color-picker__panel">
          <input
            ref={areaRef}
            type="color"
            className="uic-color-picker__area"
            aria-label={triggerLabel}
            data-testid={testId ? `${testId}-area` : undefined}
            value={draft}
            disabled={isDisabled}
            onChange={(e) => {
              setDraft(e.target.value);
              setText(e.target.value);
            }}
          />
          <TextInput
            label={hexValueLabel ?? t("uic.ColorPicker.hexValue")}
            isLabelHidden
            size="sm"
            value={text}
            placeholder="#000000"
            isDisabled={isDisabled}
            data-testid={testId ? `${testId}-hex` : undefined}
            onChange={(next) => {
              setText(next);
              // The field has no OK button: commit as soon as the text is a
              // whole colour, since a click back onto the page loses it.
              const normalised = toHexColor(next);
              if (normalised) {
                setDraft(normalised);
                commit(normalised);
              }
            }}
            onEnter={() => commit(text)}
          />
          {hasClear ? (
            <Button
              variant="ghost"
              size="sm"
              label={clearLabel ?? t("uic.ColorPicker.clear")}
              data-testid={testId ? `${testId}-clear` : undefined}
              isDisabled={isDisabled}
              onClick={() => {
                onClear?.();
                setIsOpen(false);
              }}
            />
          ) : null}
        </VStack>
      }
    >
      <button
        type="button"
        className={["uic-color-picker__trigger", className].filter(Boolean).join(" ")}
        disabled={isDisabled}
        style={style}
        data-testid={testId}
        aria-label={hasValueLabel ? undefined : triggerLabel}
      >
        <span className="uic-color-picker__swatch" aria-hidden="true">
          <span
            className="uic-color-picker__swatch-fill"
            style={{ backgroundColor: hex ?? "transparent" }}
          />
        </span>
        {hasValueLabel ? (
          <span data-testid={testId ? `${testId}-value` : undefined}>
            {hex ?? noColorLabel ?? t("uic.ColorPicker.noColor")}
          </span>
        ) : null}
      </button>
    </Popover>
  );
}

ColorPicker.displayName = "ColorPicker";
