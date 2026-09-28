/**
 * BulkEditFormItem
 *
 * A `Form.Item` for editing one field across many records at once. It starts
 * in "keep as is" (the field's value stays `undefined`, so a submit leaves
 * every record's current value alone); clicking or focusing the placeholder
 * switches to editing the wrapped control; `hasClear` adds a "Clear" action
 * that sets the value to `null`; "Undo changes" returns to keep mode.
 *
 * The control is unmounted in keep mode, so its field registers only when the
 * user starts editing, and an `initialValue` applies at that moment rather
 * than marking every field edited on mount.
 *
 * @example
 * <BulkEditFormItem name="domain" label="Domain" hasClear clearValueLabel="No domain">
 *   <Selector options={domains} />
 * </BulkEditFormItem>
 */
import {
  cloneElement,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
  type FocusEvent,
  type ReactElement,
} from "react";
import { HStack } from "@astryxdesign/core/HStack";
import { Link } from "@astryxdesign/core/Link";
import { TextInput } from "@astryxdesign/core/TextInput";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { Form, type FormItemProps, type RuleObject, type RuleRender } from "../Form";

type BulkEditMode = "keep" | "edit" | "clear";

/** A rule without `required`: the item always shows the required marker itself. */
type RuleWithoutRequired = Omit<RuleObject, "required"> | RuleRender;

export interface BulkEditFormItemProps extends Omit<
  FormItemProps,
  "required" | "rules"
> {
  /** Offers "Clear", which sets the value to `null` for every record. */
  hasClear?: boolean;
  /** The placeholder in keep mode. @default "Keep as is" */
  keepValueLabel?: string;
  /** The placeholder once cleared. @default "Clear" */
  clearValueLabel?: string;
  /** The label of the clear action. @default "Clear" */
  clearLabel?: string;
  /** The label of the action that returns to keep mode. @default "Undo changes" */
  undoLabel?: string;
  /** The control that edits the value. */
  children?: ReactElement;
  rules?: RuleWithoutRequired[];
}

const noop = () => {};

export function BulkEditFormItem({
  name,
  hasClear = false,
  keepValueLabel,
  clearValueLabel,
  clearLabel,
  undoLabel,
  children,
  ...formItemProps
}: BulkEditFormItemProps) {
  const t = useUicTranslator();
  const form = Form.useFormInstance();
  const [mode, setMode] = useState<BulkEditMode>("keep");
  const controlRef = useRef<ControlWrapperRef>(null);

  const focusControl = () => {
    setTimeout(() => {
      controlRef.current?.focus();
      controlRef.current?.open();
    }, 0);
  };

  const handlePlaceholderClick = (e: MouseEvent | FocusEvent) => {
    e.preventDefault();
    setMode("edit");
    focusControl();
  };

  const handleControlBlur = () => {
    const currentValue = form.getFieldValue(name);
    if (currentValue === undefined) {
      setMode("keep");
    }
    if (currentValue === null && hasClear) {
      setMode("clear");
    }
  };

  const handleClear = () => {
    setMode("clear");
    form.setFieldValue(name, null);
  };

  const handleUndo = () => {
    setMode("keep");
    form.setFieldValue(name, undefined);
  };

  const resolvedKeepValueLabel = keepValueLabel ?? t("uic.BulkEditFormItem.keepAsIs");
  const resolvedClearValueLabel = clearValueLabel ?? t("uic.BulkEditFormItem.clear");

  const actions = (
    <HStack align="center">
      {mode === "keep" && hasClear && (
        <Link onClick={handleClear}>
          {clearLabel ?? t("uic.BulkEditFormItem.clear")}
        </Link>
      )}
      {/* A dependency-only item re-renders when the field's value changes. */}
      <Form.Item noStyle dependencies={[name]}>
        {({ getFieldValue }) =>
          mode !== "keep" &&
          getFieldValue(name) !== undefined && (
            <Link onClick={handleUndo}>
              {undoLabel ?? t("uic.BulkEditFormItem.undoChanges")}
            </Link>
          )
        }
      </Form.Item>
    </HStack>
  );

  const placeholder = (label: string) => (
    <TextInput
      label={label}
      isLabelHidden
      value={label}
      onChange={noop}
      onMouseDown={handlePlaceholderClick}
      onFocus={handlePlaceholderClick}
      width="100%"
    />
  );

  return (
    <Form.Item
      {...formItemProps}
      style={{ marginBottom: 0, ...formItemProps.style }}
      // The marker is shown for every bulk-edit field: the item has no rules
      // of its own to derive it from.
      required
      extra={
        <HStack
          justify={formItemProps.extra ? "between" : "end"}
          align="center"
          gap={2}
        >
          {formItemProps.extra}
          {actions}
        </HStack>
      }
    >
      {mode === "keep"
        ? placeholder(resolvedKeepValueLabel)
        : mode === "clear"
          ? placeholder(resolvedClearValueLabel)
          : null}
      {/* Clear mode stays mounted (hidden) so its `null` is still collected
          by validateFields / getFieldsValue. */}
      {mode !== "keep" && (
        <Form.Item name={name} {...formItemProps} noStyle hidden={mode !== "edit"}>
          {children && (
            <ControlWrapper ref={controlRef} onBlur={handleControlBlur}>
              {children}
            </ControlWrapper>
          )}
        </Form.Item>
      )}
    </Form.Item>
  );
}

BulkEditFormItem.displayName = "BulkEditFormItem";

interface ControlWrapperRef {
  open: () => void;
  focus: () => void;
}

interface ControlWrapperProps {
  children: ReactElement;
  onBlur?: () => void;
}

/**
 * Clones the control with a ref and a controlled `open` / `onOpenChange`
 * pair, so the item can focus it and open its popup when editing starts.
 * Any other props the item injects pass through.
 */
const ControlWrapper = forwardRef<ControlWrapperRef, ControlWrapperProps>(
  ({ children, ...props }, ref) => {
    const innerRef = useRef<{ focus?: () => void } | null>(null);
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => innerRef.current?.focus?.(),
      open: () => setOpen(true),
    }));

    const childProps = children.props as { onOpenChange?: (isOpen: boolean) => void };
    return cloneElement(children, {
      ...props,
      ref: innerRef,
      open,
      onOpenChange: (isOpen: boolean) => {
        setOpen(isOpen);
        childProps.onOpenChange?.(isOpen);
      },
    } as Record<string, unknown>);
  },
);
ControlWrapper.displayName = "ControlWrapper";
