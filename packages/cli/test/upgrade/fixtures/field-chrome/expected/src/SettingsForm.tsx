import { useTranslation } from "react-i18next";
import { Button, CheckboxInput, Form, Selector, Switch } from "@lablup/ui-common";
import { TextInput } from "@lablup/ui-common/TextInput";
import { NumberInput as Amount } from "@lablup/ui-common/NumberInput";

interface Props {
  busy: boolean;
  nameError?: string;
  fieldProps: Record<string, unknown>;
}

export function SettingsForm({ busy, nameError, fieldProps }: Props) {
  const { t } = useTranslation();
  return (
    <Form>
      <TextInput aria-label={t("settings.search")} placeholder="Search" />
      <Selector
        aria-label="Region"
        disabled={busy}
        options={[{ label: "Seoul", value: "seoul" }]} />
      <Amount status="error" disabled />
      <CheckboxInput>Remember me</CheckboxInput>
      <Switch value={!busy}>{t("settings.notifications")}</Switch>

      <Form.Item name="name" label="Name">
        <TextInput label="Name" description="Shown on your profile" isRequired />
      </Form.Item>
      <TextInput status={nameError ? { type: "error", message: nameError } : undefined} />
      <TextInput {...fieldProps} isDisabled />
      <Button isDisabled={busy} label="Save" />
    </Form>
  );
}
