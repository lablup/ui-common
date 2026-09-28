/**
 * `@lablup/ui-common/Form`: a form engine with antd's form API (`Form`,
 * `Form.Item`, `Form.List`, `Form.ErrorList`, `Form.Provider`,
 * `Form.useForm`, `Form.useWatch`, `Form.useFormInstance`,
 * `Form.Item.useStatus`), so code written against antd's form moves onto it
 * with an import rewrite. The state half is a behavioural port of
 * rc-field-form; the item shell renders on Astryx.
 *
 * The API is a form-state API, not an Astryx-shaped component: it keeps
 * antd's names and shapes on purpose.
 */
import ErrorList from "./ErrorList";
import InternalForm, { FormProvider, useForm } from "./Form";
import FormItem, { useFormItemStatus } from "./FormItem";
import List from "./List";
import useWatch, { useFormInstance } from "./useWatch";

type InternalFormType = typeof InternalForm;

interface FormInterface extends InternalFormType {
  Item: typeof FormItem;
  List: typeof List;
  ErrorList: typeof ErrorList;
  useForm: typeof useForm;
  useFormInstance: typeof useFormInstance;
  useWatch: typeof useWatch;
  Provider: typeof FormProvider;
}

type FormItemWithStatus = typeof FormItem & {
  useStatus: typeof useFormItemStatus;
};

(FormItem as FormItemWithStatus).useStatus = useFormItemStatus;

const Form = InternalForm as FormInterface;
Form.Item = FormItem;
Form.List = List;
Form.ErrorList = ErrorList;
Form.useForm = useForm;
Form.useFormInstance = useFormInstance;
Form.useWatch = useWatch;
Form.Provider = FormProvider;

export default Form;
export { Form };

export {
  FormItem,
  List as FormList,
  ErrorList,
  FormProvider,
  useForm,
  useWatch,
  useFormInstance,
};
export { FormItemVisual, type FormItemVisualProps } from "./FormItemVisual";
export {
  // Read by controls that paint their item's validation status, and by
  // custom item shells that publish sub-item metas.
  FormItemInputContext,
  NoStyleItemContext,
  FormConfigContext,
  type FormConfig,
  type FormItemStatusContextValue,
  type RequiredMark,
} from "./context";
export { FormConfigProvider, useFormValidateMessages } from "./FormConfigProvider";
export { FormStore } from "./FormStore";
export { defaultValidateMessages } from "./messages";

export type { FormProps, FormRef } from "./Form";
export type { FormItemProps } from "./FormItem";
export type { ListProps as FormListProps, ListField, ListOperations } from "./List";
export type { ErrorListProps } from "./ErrorList";
export type { WatchOptions } from "./useWatch";
export type {
  FormInstance,
  FieldData,
  FieldError,
  Meta,
  NamePath,
  InternalNamePath,
  Rule,
  RuleObject,
  RuleRender,
  RuleType,
  Store,
  StoreValue,
  ValidateErrorEntity,
  ValidateMessages,
  ValidatorRule,
} from "./interface";
