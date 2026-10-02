import "./index.css";

import { Theme } from "@astryxdesign/core";
import { InternationalizationProvider } from "@astryxdesign/core/i18n";
import astryxKo from "@astryxdesign/core/locales/ko-KR.json";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InternationalizationProvider locale="ko-KR" messages={{ "ko-KR": astryxKo }}>
      <Theme theme={neutralTheme}>
        <App />
      </Theme>
    </InternationalizationProvider>
  </StrictMode>,
);
