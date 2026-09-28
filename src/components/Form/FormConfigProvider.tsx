/**
 * App-level form configuration: antd's `<ConfigProvider form={{
 * validateMessages, requiredMark }}>` for the engine. A nested provider
 * inherits what it does not set.
 *
 * Validation messages need no provider: every `<Form>` resolves them from
 * ui-common's catalog in the locale of the nearest Astryx
 * `InternationalizationProvider`. `validateMessages` here wins over that.
 */
import * as React from "react";

import { useUicTranslator } from "../../i18n/useUicTranslator";
import { FormConfigContext, type FormConfig, type RequiredMark } from "./context";
import type { ValidateMessages } from "./interface";
import { buildValidateMessages } from "./messages";

/** The validate-message table in the active locale, from ui-common's catalog. */
export function useFormValidateMessages(): ValidateMessages {
  const t = useUicTranslator();
  return React.useMemo(() => buildValidateMessages(t), [t]);
}

/** The `requiredMark="optional"` suffix in the active locale. */
export function useFormOptionalLabel(): string {
  const t = useUicTranslator();
  return t("uic.Form.optional");
}

export const FormConfigProvider: React.FC<
  FormConfig & { children?: React.ReactNode }
> = ({ children, validateMessages, requiredMark, optionalLabel }) => {
  const parent = React.useContext(FormConfigContext);
  const value = React.useMemo(
    () => ({
      ...parent,
      ...(validateMessages !== undefined ? { validateMessages } : null),
      ...(requiredMark !== undefined ? { requiredMark } : null),
      ...(optionalLabel !== undefined ? { optionalLabel } : null),
    }),
    [parent, validateMessages, requiredMark, optionalLabel],
  );
  return (
    <FormConfigContext.Provider value={value}>{children}</FormConfigContext.Provider>
  );
};

export type { FormConfig, RequiredMark };
