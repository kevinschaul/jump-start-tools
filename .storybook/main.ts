import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: [
    // Seems redundant, but this forces Storybook to
    // default to the jump start index page
    "../src/stories/*.mdx",
    "../src/stories/**/*.mdx",
  ],
  staticDirs: ["../src/stories/assets"],
  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};
export default config;
