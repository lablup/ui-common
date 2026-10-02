/**
 * Validation messages come from ui-common's catalog in the active Astryx
 * locale, with no provider at the call site; `FormConfigProvider` and the
 * form's own `validateMessages` win over them.
 */
import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";

import { uiCommonMessages } from "../../i18n/messages";
import { FormConfigProvider } from "./FormConfigProvider";
import { Form } from "./index";
import type { FormInstance } from "./interface";

const Input: React.FC<any> = ({ value = "", onChange, ...rest }) => (
  <input value={value} onChange={onChange} {...rest} />
);

function withLocale(locale: string | undefined, node: React.ReactElement) {
  return locale ? (
    <InternationalizationProvider locale={locale} messages={uiCommonMessages}>
      {node}
    </InternationalizationProvider>
  ) : (
    node
  );
}

/** Validate a one-field form and return the messages it produced. */
async function messagesFor(
  field: React.ReactElement,
  options: { locale?: string; validateMessages?: any; initialValues?: any } = {},
) {
  let form: FormInstance | undefined;
  const Harness = () => {
    const [f] = Form.useForm();
    form = f;
    return (
      <FormConfigProvider validateMessages={options.validateMessages}>
        <Form form={f} initialValues={options.initialValues}>
          {field}
        </Form>
      </FormConfigProvider>
    );
  };
  render(withLocale(options.locale, <Harness />));
  let errors: string[] = [];
  await act(async () => {
    await form!.validateFields().catch((info: any) => {
      errors = info.errorFields.flatMap((f: any) => f.errors);
    });
  });
  return errors;
}

const requiredName = (
  <Form.Item name="name" label="Name" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
);

describe("validation messages", () => {
  it("uses the catalog's English with no provider at all", async () => {
    expect(await messagesFor(requiredName)).toEqual(["Please enter Name"]);
  });

  it.each([
    ["ko-KR", "Name 값을 입력해 주세요"],
    ["ja-JP", "Nameを入力してください"],
    ["de-DE", "Bitte geben Sie Name an"],
    ["zh-CN", "请输入Name"],
  ])("follows the Astryx locale into %s", async (locale, expected) => {
    expect(await messagesFor(requiredName, { locale })).toEqual([expected]);
  });

  it("interpolates the rule's values inside a translated template", async () => {
    const errors = await messagesFor(
      <Form.Item name="nickname" label="Nickname" rules={[{ type: "string", max: 3 }]}>
        <Input />
      </Form.Item>,
      { locale: "ko-KR", initialValues: { nickname: "abcdef" } },
    );
    expect(errors).toEqual(["Nickname 3글자 이하여야 합니다"]);
  });

  it("lets FormConfigProvider's validateMessages win over the catalog", async () => {
    const errors = await messagesFor(requiredName, {
      locale: "ko-KR",
      validateMessages: { required: "CUSTOM ${label}" },
    });
    expect(errors).toEqual(["CUSTOM Name"]);
  });

  it("falls back to English for a locale ui-common does not translate", async () => {
    expect(await messagesFor(requiredName, { locale: "sw-KE" })).toEqual([
      "Please enter Name",
    ]);
  });

  it("localizes the requiredMark='optional' suffix", () => {
    render(
      withLocale(
        "ko-KR",
        <Form requiredMark="optional">
          <Form.Item name="nick" label="Nick">
            <Input />
          </Form.Item>
        </Form>,
      ),
    );
    expect(screen.getByText("(선택사항)")).toBeInTheDocument();
  });

  it("lets FormConfigProvider's optionalLabel win", () => {
    render(
      <FormConfigProvider optionalLabel="[opt]">
        <Form requiredMark="optional">
          <Form.Item name="nick" label="Nick">
            <Input />
          </Form.Item>
        </Form>
      </FormConfigProvider>,
    );
    expect(screen.getByText("[opt]")).toBeInTheDocument();
  });
});
