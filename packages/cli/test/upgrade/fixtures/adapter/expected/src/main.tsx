import { createRoot } from "react-dom/client";
import "./ui-common-entry.css";
import "./design-system/common-components.css";
import { App } from "./App";
import { Theme } from "@lablup/ui-common";
import { lablupTheme } from "@lablup/ui-common/theme/lablup/built";

createRoot(document.getElementById("root")!).render(<Theme theme={lablupTheme}>
  <App />
</Theme>);
