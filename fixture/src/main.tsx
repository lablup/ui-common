/**
 * Install fixture for @lablup/ui-common.
 *
 * A minimal external consumer: a clean React project that shares nothing
 * with this repository, installs the packed tarball, and renders against it.
 * It exercises each import shape a product uses:
 *
 * - Astryx components from the package root (`Button`, `Text`, `Theme`)
 * - an Astryx component from its mirrored subpath (`@lablup/ui-common/Card`)
 * - the pre-built Lablup theme and its stylesheet (see index.css)
 * - ui-common customs from the root (`PageLayout`, `PageHeader`, `StatCard`)
 * - a ui-common custom from its own top-level subpath (`@lablup/ui-common/Modal`)
 * - ui-common's string catalog at Astryx's provider (`i18n-catalog`)
 *
 * If this fails to type-check or build, the package is not actually
 * installable, even when `pnpm run verify` is green.
 */

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  PageHeader,
  PageLayout,
  StatCard,
  Text,
  Theme,
} from "@lablup/ui-common";
import { Card } from "@lablup/ui-common/Card";
import { InternationalizationProvider } from "@lablup/ui-common/i18n";
import { uiCommonMessages } from "@lablup/ui-common/i18n-catalog";
import { Modal } from "@lablup/ui-common/Modal";
import { lablupTheme } from "@lablup/ui-common/theme/lablup/built";
import "./index.css";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <InternationalizationProvider locale="en" messages={uiCommonMessages}>
      <Theme theme={lablupTheme}>
        <PageLayout>
          <PageHeader
            title="ui-common install fixture"
            description="Astryx through ui-common, the Lablup theme, and ui-common customs, rendered against the packed artifact."
          />

          <StatCard label="Sample metric" value={1234} tone="info" />

          <Card padding={4}>
            <Text>Imported from @lablup/ui-common/Card.</Text>
          </Card>

          <Button
            variant="primary"
            label="Open modal"
            onClick={() => setIsModalOpen(true)}
          />

          <Modal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            title="Top-level subpath import"
            onAction={() => setIsModalOpen(false)}
          >
            <Text>Imported from @lablup/ui-common/Modal.</Text>
          </Modal>
        </PageLayout>
      </Theme>
    </InternationalizationProvider>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Fixture root element (#root) is missing from index.html.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
