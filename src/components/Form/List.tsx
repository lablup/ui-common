/**
 * `Form.List`: repeated field groups. `move` is not implemented.
 *
 * Row identity is not the array index: `keyManager.keys` holds a stable id per
 * row and is spliced in lockstep with the value array, so `remove(index)`
 * does not move the removed row's errors onto its neighbour.
 * `listContext.getKey` maps an absolute field path back to
 * `[stableRowKey, restPath]`; `FormItem` uses it to key bubbled `noStyle`
 * metas by row identity too.
 */
import Field from "./Field";
import { FieldContext, ListContext, type ListContextValue } from "./context";
import type { Meta, Rule, StoreValue } from "./interface";
import { getNamePath, type InternalNamePath, type NamePath } from "./namePath";
import * as React from "react";

export interface ListField {
  name: number;
  key: number;
  isListField: boolean;
}

export interface ListOperations {
  add: (defaultValue?: StoreValue, insertIndex?: number) => void;
  remove: (index: number | number[]) => void;
}

export interface ListProps {
  name: NamePath;
  rules?: Rule[];
  validateTrigger?: string | string[] | false;
  initialValue?: any[];
  isListField?: boolean;
  children: (
    fields: ListField[],
    operations: ListOperations,
    meta: Meta,
  ) => React.ReactNode;
}

const List: React.FC<ListProps> = ({
  name,
  initialValue,
  children,
  rules,
  validateTrigger,
  isListField,
}) => {
  const context = React.useContext(FieldContext);
  const wrapperListContext = React.useContext(ListContext);
  const keyRef = React.useRef<{ keys: number[]; id: number }>({
    keys: [],
    id: 0,
  });
  const keyManager = keyRef.current;

  // Nested lists compose: the inner list's prefix is the outer prefix plus
  // its own (relative) name — `AdminDeploymentPresetModelConfigItem` nests
  // `preStartActions` inside `modelDefinition.models[N].service`.
  const prefixName: InternalNamePath = React.useMemo(() => {
    const parentPrefixName = getNamePath(context.prefixName) || [];
    return [...parentPrefixName, ...getNamePath(name)];
  }, [context.prefixName, name]);

  const fieldContext = React.useMemo(
    () => ({ ...context, prefixName }),
    [context, prefixName],
  );

  const listContext: ListContextValue = React.useMemo(
    () => ({
      getKey: (namePath) => {
        const len = prefixName.length;
        const pathName = namePath[len] as number;
        return [keyManager.keys[pathName]!, namePath.slice(len + 1)];
      },
    }),
    [keyManager, prefixName],
  );

  if (typeof children !== "function") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Form] Form.List only accepts a function as children.");
    }
    return null;
  }

  /**
   * The list container re-renders on EXTERNAL changes only. An internal
   * `onChange` (add/remove) already re-renders through the value it wrote;
   * returning true here as well would double-render every mutation.
   */
  const shouldUpdate = (
    prevValue: any,
    nextValue: any,
    { source }: { source?: string },
  ) => {
    if (source === "internal") {
      return false;
    }
    return prevValue !== nextValue;
  };

  return (
    <ListContext.Provider value={listContext}>
      <FieldContext.Provider value={fieldContext}>
        <Field
          name={[]}
          shouldUpdate={shouldUpdate}
          rules={rules}
          validateTrigger={validateTrigger}
          initialValue={initialValue}
          isList
          isListField={isListField ?? !!wrapperListContext}
        >
          {({ value = [], onChange }: any, meta: Meta) => {
            const { getFieldValue } = context;
            // Always read the live value: the app may have replaced the whole
            // list through `form.setFieldsValue` since the last render.
            const getNewValue = (): any[] => getFieldValue(prefixName || []) || [];

            const operations: ListOperations = {
              add: (defaultValue, index) => {
                const newValue = getNewValue();
                if (index !== undefined && index >= 0 && index <= newValue.length) {
                  keyManager.keys = [
                    ...keyManager.keys.slice(0, index),
                    keyManager.id,
                    ...keyManager.keys.slice(index),
                  ];
                  onChange([
                    ...newValue.slice(0, index),
                    defaultValue,
                    ...newValue.slice(index),
                  ]);
                } else {
                  keyManager.keys = [...keyManager.keys, keyManager.id];
                  onChange([...newValue, defaultValue]);
                }
                keyManager.id += 1;
              },
              remove: (index) => {
                const newValue = getNewValue();
                const indexSet = new Set(Array.isArray(index) ? index : [index]);
                if (indexSet.size <= 0) {
                  return;
                }
                keyManager.keys = keyManager.keys.filter(
                  (_, keysIndex) => !indexSet.has(keysIndex),
                );
                onChange(newValue.filter((_, valueIndex) => !indexSet.has(valueIndex)));
              },
            };

            let listValue: any[] = value || [];
            if (!Array.isArray(listValue)) {
              listValue = [];
            }

            return children(
              listValue.map((__, index) => {
                let key = keyManager.keys[index];
                if (key === undefined) {
                  keyManager.keys[index] = keyManager.id;
                  key = keyManager.keys[index];
                  keyManager.id += 1;
                }
                return { name: index, key, isListField: true };
              }),
              operations,
              meta,
            );
          }}
        </Field>
      </FieldContext.Provider>
    </ListContext.Provider>
  );
};

export default List;
