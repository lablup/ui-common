/**
 * React contexts of the form engine. Collapses what upstream splits across
 * rc-field-form's `FieldContext` / `FormContext` / `ListContext` and antd's
 * `form/context` into one module.
 */
import type {
  FieldData,
  FormInstance,
  InternalFormInstance,
  InternalHooks,
  Meta,
  ValidateMessages,
} from "./interface";
import type { InternalNamePath } from "./namePath";
import * as React from "react";

/** Guard for `getInternalHooks`; keeps the engine-private API out of reach. */
export const HOOK_MARK = "UIC_FORM_INTERNAL_HOOKS";

const noop = () => {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[Form] Field used outside of a <Form>. Wrap it in a Form, or pass an explicit `form` instance.",
    );
  }
  return undefined as any;
};

/**
 * Carries the live `FormInstance` down to every `Field`. Also carries
 * `prefixName`, which is what makes `Form.List` children address their fields
 * RELATIVELY while `dependencies` and `useWatch` stay ABSOLUTE.
 */
export const FieldContext = React.createContext<InternalFormInstance>({
  getFieldValue: noop,
  getFieldsValue: noop,
  getFieldError: noop,
  getFieldWarning: noop,
  getFieldsError: noop,
  isFieldsTouched: noop,
  isFieldTouched: noop,
  isFieldValidating: noop,
  isFieldsValidating: noop,
  resetFields: noop,
  setFields: noop,
  setFieldValue: noop,
  setFieldsValue: noop,
  validateFields: noop,
  submit: noop,
  scrollToField: noop,
  focusField: noop,
  getFieldInstance: noop,
  getInternalHooks: () => null,
} as unknown as InternalFormInstance);

export interface ListContextValue {
  /** Map an absolute field path to `[stableKey, restPath]` for the row it belongs to. */
  getKey: (namePath: InternalNamePath) => [React.Key, InternalNamePath];
}

export const ListContext = React.createContext<ListContextValue | null>(null);

// ============================== Form.Provider ===============================

export interface FormProviderContextValue {
  validateMessages?: ValidateMessages;
  triggerFormChange: (name: string | undefined, changedFields: FieldData[]) => void;
  triggerFormFinish: (name: string | undefined, values: any) => void;
  registerForm: (name: string | undefined, form: FormInstance) => void;
  unregisterForm: (name: string | undefined) => void;
}

export const FormProviderContext = React.createContext<FormProviderContextValue>({
  triggerFormChange: () => {},
  triggerFormFinish: () => {},
  registerForm: () => {},
  unregisterForm: () => {},
});

// ========================= App-level form configuration =====================

export type RequiredMark =
  | boolean
  | "optional"
  | ((label: React.ReactNode, info: { required: boolean }) => React.ReactNode);

export interface FormConfig {
  /**
   * Message templates, `${label}`-based. Every `<Form>` already defaults them
   * to ui-common's catalog in the active locale; these win over that.
   */
  validateMessages?: ValidateMessages;
  requiredMark?: RequiredMark;
  /**
   * The suffix `requiredMark="optional"` appends. Defaults to the catalog's
   * `uic.Form.optional`.
   */
  optionalLabel?: React.ReactNode;
}

/** What antd sourced from `<ConfigProvider form={{...}}>`. */
export const FormConfigContext = React.createContext<FormConfig>({});

// The provider lives in `./FormConfigProvider.tsx`: this module is engine
// core, and stays free of anything heavier than React.

// ============================ Per-form UI context ===========================

/**
 * What antd carries on its own `FormContext` — the per-form visual settings a
 * `Form.Item` inherits unless it states its own. antd's `feedbackIcons`,
 * `classNames`, `styles` and `variant` are not supported.
 */
export interface FormItemLayoutContextValue {
  form?: FormInstance;
  layout: FormLayout;
  requiredMark?: RequiredMark;
  disabled?: boolean;
  name?: string;
  size?: FormSize;
  colon?: boolean;
  labelAlign?: "left" | "right";
  labelCol?: FormItemCol;
  wrapperCol?: FormItemCol;
  labelWrap?: boolean;
}

export type FormLayout = "vertical" | "horizontal" | "inline";
export type FormSize = "small" | "middle" | "large";

/** antd `Col` props, reduced to `span`, `offset`, `flex`, `className` and `style`. */
export interface FormItemCol {
  span?: number;
  offset?: number;
  flex?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const FormItemLayoutContext = React.createContext<FormItemLayoutContextValue>({
  // antd's default: a form that states no layout is horizontal.
  layout: "horizontal",
});

// ========================== Item status / bubbling ===========================

export interface FormItemStatusContextValue {
  status?: "success" | "warning" | "error" | "validating" | "";
  errors?: React.ReactNode[];
  warnings?: React.ReactNode[];
  hasFeedback?: boolean;
  isFormItemInput?: boolean;
}

/** Read by `Form.Item.useStatus()` and by controls that paint the item's status. */
export const FormItemInputContext = React.createContext<FormItemStatusContextValue>({});

export type SubItemMeta = Partial<Meta> & {
  name: InternalNamePath;
  destroy?: boolean;
};

/**
 * How a rendering `Form.Item` collects the errors of the `noStyle` items
 * nested inside it. Without it, a layout-only item loses its children's
 * messages.
 */
export const NoStyleItemContext = React.createContext<
  ((meta: SubItemMeta, uniqueKeys: React.Key[]) => void) | null
>(null);

export type { InternalHooks };
