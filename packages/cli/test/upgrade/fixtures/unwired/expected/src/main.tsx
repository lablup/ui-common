// The app entry: 0.1 components loaded their own CSS, so nothing here
// loads ui-common's.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui-common-entry.css";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
