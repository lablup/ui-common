import "./index.css";

import { Theme } from "@lablup/ui-common";
import { InternationalizationProvider } from "@lablup/ui-common/i18n";
import astryxKo from "@lablup/ui-common/locales/ko-KR.json";
import { neutralTheme } from "@lablup/ui-common/theme/neutral/built";
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
