import { useEffect, useState, type PropsWithChildren } from "react";
import {
  DocsContainer as BaseContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks";
import { DARK_MODE_EVENT_NAME } from "@vueless/storybook-dark-mode";
import { addons } from "storybook/preview-api";

import { storybookDarkTheme, storybookLightTheme } from "./storybookTheme";

const channel = addons.getChannel();

/** Docs pages follow the dark-mode toggle, like the stories do. */
export function DocsContainer({
  context,
  children,
}: PropsWithChildren<DocsContainerProps>) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    channel.on(DARK_MODE_EVENT_NAME, setIsDarkMode);
    return () => {
      channel.off(DARK_MODE_EVENT_NAME, setIsDarkMode);
    };
  }, []);

  return (
    <BaseContainer
      context={context}
      theme={isDarkMode ? storybookDarkTheme : storybookLightTheme}
    >
      {children}
    </BaseContainer>
  );
}
