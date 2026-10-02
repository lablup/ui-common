import "./entry.css";

import { SidePanel } from "@observability/kit";
import { Button, Theme } from "@astryxdesign/core";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <Theme theme={neutralTheme}>
    <Button label="Open" />
    <SidePanel title="Hosts" />
  </Theme>,
);
