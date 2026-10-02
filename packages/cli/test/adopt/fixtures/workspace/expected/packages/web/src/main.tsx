import "./entry.css";

import { SidePanel } from "@observability/kit";
import { Button, Theme } from "@lablup/ui-common";
import { neutralTheme } from "@lablup/ui-common/theme/neutral/built";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <Theme theme={neutralTheme}>
    <Button label="Open" />
    <SidePanel title="Hosts" />
  </Theme>,
);
