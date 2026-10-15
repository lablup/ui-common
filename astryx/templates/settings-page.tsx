/**
 * Settings page: grouped settings, one card per group, saved together.
 *
 * Each group has a title and a short description; each setting is a Form.Item
 * with its control. Save stays disabled until something changed, and Reset
 * puts the saved values back.
 *
 * Presentation only. `saved` and `save` stand in for the app's settings
 * query and mutation.
 */
import { useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Form,
  HStack,
  Heading,
  PageHeader,
  PageLayout,
  Selector,
  Switch,
  Text,
  VStack,
} from "@lablup/ui-common";

interface SettingsValues {
  isAutoLogoutEnabled: boolean;
  isTelemetryEnabled: boolean;
  defaultLanguage: string;
  theme: string;
}

const saved: SettingsValues = {
  isAutoLogoutEnabled: true,
  isTelemetryEnabled: false,
  defaultLanguage: "en",
  theme: "system",
};

/** Placeholder for the app's mutation. */
async function save(values: SettingsValues): Promise<void> {
  void values;
}

function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <VStack gap={3}>
        <VStack gap={1}>
          <Heading level={3}>{title}</Heading>
          <Text color="secondary">{description}</Text>
        </VStack>
        {children}
      </VStack>
    </Card>
  );
}

export default function SettingsPage() {
  const [form] = Form.useForm<SettingsValues>();
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  return (
    <PageLayout>
      <VStack gap={4}>
        <PageHeader title="Settings" description="Preferences for every user." />
        <Form<SettingsValues>
          form={form}
          layout="vertical"
          initialValues={saved}
          onValuesChange={() => setIsDirty(true)}
          onFinish={async (values: SettingsValues) => {
            setIsSaving(true);
            try {
              await save(values);
              setIsDirty(false);
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <VStack gap={4}>
            <SettingsGroup
              title="Security"
              description="Sign-in and session behaviour."
            >
              <Form.Item
                name="isAutoLogoutEnabled"
                label="Automatic logout"
                extra="Sign users out after 30 minutes without activity."
              >
                <Switch />
              </Form.Item>
            </SettingsGroup>
            <SettingsGroup title="General" description="Defaults for new users.">
              <Form.Item name="defaultLanguage" label="Default language">
                <Selector
                  options={[
                    { value: "en", label: "English" },
                    { value: "ko", label: "Korean" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="theme" label="Theme">
                <Selector
                  options={[
                    { value: "system", label: "System" },
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="isTelemetryEnabled"
                label="Usage statistics"
                extra="Send anonymous usage statistics."
              >
                <Switch />
              </Form.Item>
            </SettingsGroup>
            <HStack gap={2} justify="end">
              <Button
                label="Reset"
                variant="secondary"
                isDisabled={!isDirty}
                onClick={() => {
                  form.resetFields();
                  setIsDirty(false);
                }}
              />
              <Button
                type="submit"
                label="Save"
                variant="primary"
                isDisabled={!isDirty}
                isLoading={isSaving}
              />
            </HStack>
          </VStack>
        </Form>
      </VStack>
    </PageLayout>
  );
}
