/**
 * SelectionLabel
 *
 * "3 selected" beside a bulk-action toolbar, with an optional button that
 * clears the selection. Renders nothing while `count` is 0 or less.
 *
 * @example
 * <SelectionLabel count={selectedKeys.length} onClear={() => setSelectedKeys([])} />
 */
import type { ReactNode } from "react";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

import { useUicTranslator } from "../../i18n/useUicTranslator";

export interface SelectionLabelProps {
  /** How many items are selected. 0 or less renders nothing. */
  count: number;
  /** Clears the selection. Without it, no clear button renders. */
  onClear?: () => void;
  /**
   * The text. @default the catalog's uic.SelectionLabel.selectedCount
   * ("{count} selected")
   */
  label?: string;
  /**
   * Accessible name and tooltip of the clear button.
   * @default the catalog's uic.SelectionLabel.clear ("Deselect all")
   */
  clearLabel?: string;
  /** Glyph of the clear button. @default the theme's `close` icon */
  clearIcon?: ReactNode;
}

export function SelectionLabel({
  count,
  onClear,
  label,
  clearLabel,
  clearIcon,
}: SelectionLabelProps) {
  const t = useUicTranslator();
  if (count <= 0) return null;
  const clearText = clearLabel ?? t("uic.SelectionLabel.clear");
  return (
    <HStack gap={1} align="center">
      <Text>{label ?? t("uic.SelectionLabel.selectedCount", { count })}</Text>
      {onClear ? (
        <IconButton
          variant="ghost"
          size="sm"
          icon={clearIcon ?? <Icon icon="close" />}
          label={clearText}
          tooltip={clearText}
          onClick={onClear}
        />
      ) : null}
    </HStack>
  );
}

SelectionLabel.displayName = "SelectionLabel";
