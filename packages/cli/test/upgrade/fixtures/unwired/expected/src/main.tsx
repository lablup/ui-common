// The app entry: 0.1 components loaded their own CSS, so nothing here
// loads ui-common's.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui-common-entry.css";
import { App } from "./App";
import "./index.css";
import { Theme } from "@lablup/ui-common";
import { lablupTheme } from "@lablup/ui-common/theme/lablup/built";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme theme={lablupTheme}>
      <App />
    </Theme>
  </StrictMode>,
);
