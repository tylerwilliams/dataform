import { DocsContainer, DocsPage } from "@storybook/addon-docs/blocks";
import { addDecorator, addParameters, configure } from "@storybook/react";
import * as React from "react";
import { Root } from "df/components/root";

addParameters({
  docs: {
    container: DocsContainer,
    page: DocsPage
  }
});

configure(require.context("./stories", true, /.[tj]sx?$/), module);

addDecorator(story => <Root>{story()}</Root>);
