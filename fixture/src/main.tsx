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
 * - ui-common customs from the root (`PageLayout`, `PageHeader`)
 * - a legacy custom from its component subpath (`components/Drawer`)
 *
 * If this fails to type-check or build, the package is not actually
 * installable, even when `pnpm run verify` is green.
 */

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, PageHeader, PageLayout, Text, Theme } from "@lablup/ui-common";
import { Card } from "@lablup/ui-common/Card";
import { Drawer } from "@lablup/ui-common/components/Drawer";
import { lablupTheme } from "@lablup/ui-common/theme/lablup/built";
import "./index.css";

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Theme theme={lablupTheme}>
      <PageLayout>
        <PageHeader
          title="ui-common install fixture"
          description="Astryx through ui-common, the Lablup theme, and ui-common customs, rendered against the packed artifact."
        />

        <Card padding={4}>
          <Text>Imported from @lablup/ui-common/Card.</Text>
        </Card>

        <Button
          variant="primary"
          label="Open drawer"
          onClick={() => setIsDrawerOpen(true)}
        />

        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Component subpath import"
        >
          <p>Imported from @lablup/ui-common/components/Drawer.</p>
        </Drawer>
      </PageLayout>
    </Theme>
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
