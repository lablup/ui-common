/**
 * Tabbed page: a page whose body is a card of tabs, each tab one list or
 * settings view, with an item count beside each tab label.
 *
 * Presentation only. The active tab is controlled: keep it in the URL (a
 * query parameter) so a reload or a shared link lands on the same tab. Render
 * each tab's content where `renderTab` is; mount only the active one.
 */
import { useState, type ReactNode } from "react";
import {
  Button,
  Card,
  CountBadge,
  PageHeader,
  PageLayout,
  Tab,
  TabList,
  Text,
  VStack,
} from "@lablup/ui-common";
import { Plus } from "lucide-react";

const TABS = [
  { key: "users", label: "Users", count: 128 },
  { key: "credentials", label: "Credentials", count: 12 },
  { key: "policies", label: "Policies", count: 4 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function renderTab(key: TabKey): ReactNode {
  // Replace with each tab's own list or settings component.
  return <Text color="secondary">Content of the {key} tab.</Text>;
}

export default function TabbedPage() {
  const [activeKey, setActiveKey] = useState<TabKey>("users");
  return (
    <PageLayout>
      <VStack gap={4}>
        <PageHeader
          title="Users"
          actions={
            <Button
              label="Create"
              variant="primary"
              icon={<Plus />}
              onClick={() => {
                // Open the create modal for the active tab.
              }}
            />
          }
        />
        <Card padding={0}>
          <VStack gap={0}>
            <TabList
              value={activeKey}
              onChange={(value) => {
                const tab = TABS.find((t) => t.key === value);
                if (tab) setActiveKey(tab.key);
              }}
              hasDivider
            >
              {TABS.map((tab) => (
                <Tab
                  key={tab.key}
                  value={tab.key}
                  label={tab.label}
                  endContent={
                    <CountBadge count={tab.count} label={`${tab.count} ${tab.label}`} />
                  }
                />
              ))}
            </TabList>
            <VStack gap={3} padding={4}>
              {renderTab(activeKey)}
            </VStack>
          </VStack>
        </Card>
      </VStack>
    </PageLayout>
  );
}
