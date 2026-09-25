import { createRoot } from "react-dom/client";
import "@lablup/ui-common/styles/base.css";
import "./design-system/common-components.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
