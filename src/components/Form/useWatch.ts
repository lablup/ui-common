/**
 * `Form.useWatch` and `Form.useFormInstance`.
 *
 * `{ preserve: true }` reads the raw store rather than the registered-field
 * projection, so a value whose field is unmounted is still observed. Paths are
 * absolute even inside a `Form.List`, because `useWatch` reads from the form
 * instance, never from `prefixName`.
 *
 * Change detection is by deep equality (`isEqual`), so a watcher on an object
 * path settles instead of re-rendering on every new identity.
 */
import { FieldContext, FormItemLayoutContext, HOOK_MARK } from "./context";
import type { FormInstance, InternalFormInstance, StoreValue } from "./interface";
import { isEqual } from "./isEqual";
import { getNamePath, getValue, type NamePath, type Store } from "./namePath";
import * as React from "react";

function isFormInstance(form: any): form is InternalFormInstance {
  return form && !!form._init;
}

export interface WatchOptions<Form = FormInstance> {
  form?: Form;
  /** Read the raw store, including values whose field is unmounted. */
  preserve?: boolean;
}

function useWatch<Values = StoreValue>(
  dependencies: NamePath | ((values: Store) => Values),
  formOrOptions?: FormInstance | WatchOptions,
): Values {
  const options: WatchOptions = isFormInstance(formOrOptions)
    ? { form: formOrOptions }
    : ((formOrOptions ?? {}) as WatchOptions);
  const form = options.form as InternalFormInstance | undefined;

  const fieldContext = React.useContext(FieldContext);
  const formInstance = (form || fieldContext) as InternalFormInstance;
  const isValidForm = !!formInstance && !!formInstance._init;

  const read = (values?: Store, allValues?: Store) => {
    const watchValue = options.preserve
      ? (allValues ?? formInstance.getFieldsValue(true))
      : (values ?? formInstance.getFieldsValue());
    return typeof dependencies === "function"
      ? (dependencies as any)(watchValue)
      : getValue(watchValue, getNamePath(dependencies as NamePath));
  };

  // Seed from the store rather than from `undefined`. Upstream starts empty
  // and syncs in a mount effect; reading here removes that extra render (and
  // the `undefined` flash a `useWatch`-gated subtree shows because of it).
  // Fields that register AFTER this hook still reach us: `registerField`
  // notifies every watcher, and that notification is batched onto a
  // macrotask, by which point the subscription below is in place.
  const [value, setValue] = React.useState<any>(() =>
    isValidForm
      ? read()
      : typeof dependencies === "function"
        ? (dependencies as any)({})
        : undefined,
  );

  // The registered watcher reads `read` / `isValidForm` through this ref, not a
  // render closure: React 19.2 keeps the first closure of a memo()/forwardRef()
  // fiber's useEffectEvent (facebook/react#34818).
  const latestRef = React.useRef({ read, isValidForm });
  React.useLayoutEffect(() => {
    latestRef.current = { read, isValidForm };
  });

  // The last value handed to `setValue`, so an unchanged read queues nothing.
  const lastValueRef = React.useRef(value);
  const triggerUpdate = React.useCallback((values?: Store, allValues?: Store) => {
    const latest = latestRef.current;
    if (!latest.isValidForm) return;
    const nextValue = latest.read(values, allValues);
    if (isEqual(lastValueRef.current, nextValue)) return;
    lastValueRef.current = nextValue;
    setValue(() => nextValue);
  }, []);

  // A selector function has no stable serialisation, so it identifies itself.
  const flattenDeps =
    typeof dependencies === "function" ? dependencies : JSON.stringify(dependencies);

  React.useEffect(() => {
    if (!isValidForm) return undefined;
    const registerWatch = formInstance.getInternalHooks(HOOK_MARK)?.registerWatch;
    const cancel = registerWatch?.((values, allValues) => {
      triggerUpdate(values, allValues);
    });
    // Re-read when the form or the watched path changes (a dynamic
    // `['rows', index]`, say). An inline selector is a new key every commit;
    // those re-reads are no-ops unless the value differs.
    triggerUpdate();
    return cancel;
  }, [isValidForm, formInstance, flattenDeps, triggerUpdate]);

  return value;
}

export default useWatch;

/** The nearest `<Form>`'s instance, or `undefined` outside one. */
export function useFormInstance<Values = any>(): FormInstance<Values> {
  const { form } = React.useContext(FormItemLayoutContext);
  return form as FormInstance<Values>;
}
