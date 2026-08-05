/**
 * Install fixture for @lablup/ui-common.
 *
 * A minimal external consumer: a clean React project that shares nothing
 * with this repository, installs the packed tarball, and renders a handful
 * of components imported from the package root plus one component subpath.
 * If this fails to type-check or build, the package is not actually
 * installable, even when `pnpm run verify` is green.
 */

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Badge, Button, PageHeader, PageLayout, StatusTag } from "@lablup/ui-common";
import { Drawer } from "@lablup/ui-common/components/Drawer";
import "@lablup/ui-common/styles/base.css";

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <PageLayout>
      <PageHeader
        title="ui-common install fixture"
        description="Root import plus one component subpath import, rendered against the packed artifact."
      />

      <p>
        <Badge variant="success">Installed</Badge>{" "}
        <StatusTag state="running" label="Fixture running" />
      </p>

      <Button variant="primary" onClick={() => setIsDrawerOpen(true)}>
        Open drawer
      </Button>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Component subpath import"
      >
        <p>Imported from @lablup/ui-common/components/Drawer.</p>
      </Drawer>
    </PageLayout>
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
