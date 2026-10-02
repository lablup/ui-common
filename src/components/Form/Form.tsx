/**
 * `<Form>`: store wiring, contexts and submit/reset plumbing (rc-field-form's
 * `<Form>`) plus layout, `requiredMark`, `disabled` and `scrollToFirstError`
 * (antd's `<Form>`).
 *
 * `layout` defaults to `'horizontal'`, as in antd: a form that states no
 * layout but passes a `labelCol` span only makes sense horizontally.
 */
import useForm, { FormStore } from "./FormStore";
import {
  FieldContext,
  FormConfigContext,
  FormItemLayoutContext,
  FormProviderContext,
  HOOK_MARK,
  ListContext,
  type FormItemCol,
  type FormLayout,
  type FormProviderContextValue,
  type FormSize,
  type RequiredMark,
} from "./context";
import type {
  Callbacks,
  FieldData,
  FormInstance,
  InternalFormInstance,
  ValidateErrorEntity,
  ValidateMessages,
} from "./interface";
import { useFormValidateMessages } from "./FormConfigProvider";
import { mergeValidateMessages } from "./messages";
import type { Store } from "./namePath";
import * as React from "react";

export interface FormProps<Values = any> extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit" | "children" | "onChange" | "onReset"
> {
  form?: FormInstance<Values>;
  name?: string;
  initialValues?: Store;
  /** `false` drops unmounted fields' values; the default `true` keeps them. */
  preserve?: boolean;
  layout?: FormLayout;
  requiredMark?: RequiredMark;
  disabled?: boolean;
  size?: FormSize;
  labelCol?: FormItemCol;
  wrapperCol?: FormItemCol;
  colon?: boolean;
  labelAlign?: "left" | "right";
  labelWrap?: boolean;
  validateMessages?: ValidateMessages;
  validateTrigger?: string | string[] | false;
  scrollToFirstError?: boolean | Record<string, unknown>;
  clearOnDestroy?: boolean;
  onValuesChange?: Callbacks<Values>["onValuesChange"];
  onFieldsChange?: Callbacks<Values>["onFieldsChange"];
  onFinish?: Callbacks<Values>["onFinish"];
  onFinishFailed?: Callbacks<Values>["onFinishFailed"];
  /** `false` renders no wrapper element at all (context only). */
  component?: React.ComponentType<any> | string | false;
  children?: React.ReactNode;
}

/**
 * What `<Form ref>` hands back. `nativeElement` is OPTIONAL on purpose: call
 * sites declare `useRef<FormInstance>(null)`, and a required extra member
 * would make that ref type unassignable to the element's `ref` prop.
 */
export type FormRef<Values = any> = FormInstance<Values> & {
  nativeElement?: HTMLElement | null;
};

const InternalForm = <Values,>(
  props: FormProps<Values>,
  ref: React.Ref<FormRef<Values>>,
) => {
  const {
    name,
    initialValues,
    form,
    preserve,
    children,
    component: Component = "form",
    validateMessages,
    validateTrigger = "onChange",
    onValuesChange,
    onFieldsChange,
    onFinish,
    onFinishFailed,
    clearOnDestroy,
    layout = "horizontal",
    requiredMark,
    disabled,
    scrollToFirstError,
    // Visual props antd consumed through its stylesheet + `FormContext`. They
    // are published on the layout context (never forwarded onto the DOM node,
    // where React would warn) and the visual shell lays out from them.
    size,
    labelCol,
    wrapperCol,
    colon,
    labelAlign,
    labelWrap,
    ...restProps
  } = props;

  const nativeElementRef = React.useRef<HTMLElement | null>(null);
  const formProviderContext = React.useContext(FormProviderContext);
  const formConfig = React.useContext(FormConfigContext);
  const localizedMessages = useFormValidateMessages();

  const [formInstance] = useForm(form as InternalFormInstance | undefined);
  const hooks = formInstance.getInternalHooks(HOOK_MARK)!;
  const {
    useSubscribe,
    setInitialValues,
    setCallbacks,
    setValidateMessages,
    setPreserve,
    destroyForm,
  } = hooks;

  React.useImperativeHandle(
    ref,
    () =>
      ({
        ...formInstance,
        nativeElement: nativeElementRef.current,
      }) as FormRef<Values>,
  );

  React.useEffect(() => {
    formProviderContext.registerForm(name, formInstance);
    return () => {
      formProviderContext.unregisterForm(name);
    };
  }, [formProviderContext, formInstance, name]);

  // Templates: the catalog in the active locale < app config < Form.Provider
  // < this form's own prop.
  setValidateMessages(
    mergeValidateMessages(
      localizedMessages,
      formConfig.validateMessages,
      formProviderContext.validateMessages,
      validateMessages,
    ),
  );

  setCallbacks({
    onValuesChange,
    onFieldsChange: (changedFields: FieldData[], ...rest) => {
      // Fires for PROGRAMMATIC changes too, unlike `onValuesChange` — which
      // is exactly why `Form.Provider onFormChange` can observe
      // `setFieldValue`.
      formProviderContext.triggerFormChange(name, changedFields);
      onFieldsChange?.(changedFields, ...(rest as [FieldData[]]));
    },
    onFinish: (values: any) => {
      formProviderContext.triggerFormFinish(name, values);
      onFinish?.(values);
    },
    onFinishFailed: (errorInfo: ValidateErrorEntity) => {
      if (scrollToFirstError && errorInfo.errorFields.length) {
        const options =
          typeof scrollToFirstError === "object" ? scrollToFirstError : {};
        formInstance.scrollToField(errorInfo.errorFields[0]!.name, {
          focus: true,
          ...options,
        });
      }
      onFinishFailed?.(errorInfo);
    },
  });
  setPreserve(preserve);

  // Seed the store — exactly once, in `useState`'s lazy initialiser.
  React.useState(() => {
    setInitialValues(initialValues, true);
    return null;
  });
  // Then on EVERY render, refresh what `initialValues` currently is without
  // re-seeding: a changed
  // `initialValues` prop must not overwrite what the user has typed, but it
  // IS what a later `resetFields()` restores.
  setInitialValues(initialValues, false);

  React.useEffect(
    () => () => destroyForm(clearOnDestroy),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useSubscribe(true);

  const formContextValue = React.useMemo(
    () => ({ ...formInstance, validateTrigger }) as InternalFormInstance,
    [formInstance, validateTrigger],
  );

  const layoutContextValue = React.useMemo(
    () => ({
      form: formInstance as FormInstance,
      layout,
      requiredMark: requiredMark ?? formConfig.requiredMark,
      disabled,
      name,
      size,
      colon,
      labelAlign,
      labelCol,
      wrapperCol,
      labelWrap,
    }),
    [
      formInstance,
      layout,
      requiredMark,
      formConfig.requiredMark,
      disabled,
      name,
      size,
      colon,
      labelAlign,
      labelCol,
      wrapperCol,
      labelWrap,
    ],
  );

  const wrapperNode = (
    <ListContext.Provider value={null}>
      <FormItemLayoutContext.Provider value={layoutContextValue}>
        <FieldContext.Provider value={formContextValue}>
          {children}
        </FieldContext.Provider>
      </FormItemLayoutContext.Provider>
    </ListContext.Provider>
  );

  if (Component === false) {
    return wrapperNode;
  }

  const Wrapper = Component as any;
  return (
    <Wrapper
      {...restProps}
      // An inline form is `display: flex; flex-wrap: wrap` on the FORM, which
      // no per-item style can express (antd's `.ant-form-inline`).
      className={["uic-form", restProps.className].filter(Boolean).join(" ")}
      data-layout={layout}
      data-size={size}
      ref={nativeElementRef}
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        formInstance.submit();
      }}
      onReset={(event: React.FormEvent) => {
        event.preventDefault();
        formInstance.resetFields();
      }}
    >
      {wrapperNode}
    </Wrapper>
  );
};

/**
 * The ref is declared as `Ref<FormInstance<Values>>`, not `Ref<FormRef<…>>`:
 * call sites write `useRef<FormInstance<MyValues>>(null)`, and inference
 * through the plain generic recovers `Values` from that, where an
 * intersection type does not. The runtime object still carries
 * `nativeElement`, which `FormRef` describes for anyone who wants it.
 */
const Form = React.forwardRef(InternalForm) as <Values = any>(
  props: FormProps<Values> & { ref?: React.Ref<FormInstance<Values>> },
) => React.ReactElement;

// ============================== Form.Provider ===============================

export interface FormProviderProps {
  validateMessages?: ValidateMessages;
  onFormChange?: (
    name: string | undefined,
    info: { changedFields: FieldData[]; forms: Record<string, FormInstance> },
  ) => void;
  onFormFinish?: (
    name: string | undefined,
    info: { values: Store; forms: Record<string, FormInstance> },
  ) => void;
  children?: React.ReactNode;
}

/**
 * Cross-form listener. `onFormChange` is wired to `onFieldsChange`, NOT to
 * `onValuesChange`, so it observes programmatic mutations (`setFieldValue`,
 * `setFieldsValue`, `setFields`) as well as user edits.
 */
export const FormProvider: React.FC<FormProviderProps> = ({
  validateMessages,
  onFormChange,
  onFormFinish,
  children,
}) => {
  const parent = React.useContext(FormProviderContext);
  const formsRef = React.useRef<Record<string, FormInstance>>({});

  const value: FormProviderContextValue = {
    ...parent,
    validateMessages: {
      ...parent.validateMessages,
      ...validateMessages,
    },
    // Unnamed forms fire too, with `name` undefined, as in rc-field-form.
    triggerFormChange: (formName, changedFields) => {
      onFormChange?.(formName, { changedFields, forms: formsRef.current });
      parent.triggerFormChange(formName, changedFields);
    },
    triggerFormFinish: (formName, values) => {
      onFormFinish?.(formName, { values, forms: formsRef.current });
      parent.triggerFormFinish(formName, values);
    },
    registerForm: (formName, formInstance) => {
      if (formName) {
        formsRef.current = { ...formsRef.current, [formName]: formInstance };
      }
      parent.registerForm(formName, formInstance);
    },
    unregisterForm: (formName) => {
      if (formName) {
        const newForms = { ...formsRef.current };
        delete newForms[formName];
        formsRef.current = newForms;
      }
      parent.unregisterForm(formName);
    },
  };

  return (
    <FormProviderContext.Provider value={value}>
      {children}
    </FormProviderContext.Provider>
  );
};

export { useForm, FormStore };
export default Form;
