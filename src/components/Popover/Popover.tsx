/**
 * Popover, Astryx's with one change: its content is not part of the
 * `Form.Item` it opens from. Astryx renders the content inside the trigger's
 * React tree, so without this a control in a filter popover opened from an
 * item takes that item's error border and label. antd's Popover resets the
 * item's context the same way (`NoFormStyle`); `Modal` and `Drawer` do too.
 * The API is Astryx's, unchanged.
 */
import {
  Popover as AstryxPopover,
  type PopoverProps,
} from "@astryxdesign/core/Popover";

import { NoFormItemContext } from "../Form/context";

export type { PopoverProps };

export function Popover({ content, ...rest }: PopoverProps) {
  return (
    <AstryxPopover
      {...rest}
      content={<NoFormItemContext>{content}</NoFormItemContext>}
    />
  );
}
