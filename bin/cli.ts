#!/usr/bin/env -S npx tsx

import { Command } from "commander";
import configCommand, { Config } from "./config";
import find, { FindOpts } from "./find";
import use from "./use";
import storybook from "./storybook";
import buildStorybook from "./buildStorybook";
import updateReadme from "./updateReadme";

const program = new Command();
const config = new Config("jump-start");

const withConfig = (action: Function) => {
  return action.bind(null, config.load());
};

program.option(
  "--config-file <path>",
  "Path to your config file",
  config.getConfigFile(),
);

program.option(
  "--instance <name>",
  "Which jump-start instance to operate on. Defaults to the instance marked `default` in your config.",
);

program
  .command("config")
  .description("Print path to your jump-start config file")
  .action(configCommand);

program
  .command("find")
  .description("Search your installed starters")
  .option("--no-text", "Don't search the starter text")
  .option("--code", "Search the starter code")
  .argument("<search-term>")
  .action(
    withConfig((config: Config, searchTerm: string, options: FindOpts) => {
      // text will be true by default
      // --no-text will set it to false
      // --code will set it to false (unless --text is explicitly provided)
      const text = options.code ? false : options.text;

      return find(config, searchTerm, { ...options, text });
    }),
  );

program
  .command("use")
  .description("Use a starter")
  .option(
    "--out <dir>",
    "Where to save the starter. Defaults to the starter's defaultDir.",
  )
  .argument("<starter>")
  .action(withConfig(use));

program
  .command("storybook")
  .description("Start the storybook server")
  .addHelpText(
    "after",
    `

Arguments passed following "--" are passed along to storybook, e.g.:
  $ jump-start storybook -- --port 8000`,
  )
  .option(
    "--starters-dir <dir>",
    "Directory where starters are. Defaults to cwd.",
    process.cwd(),
  )
  .option("--no-watch", "Don't watch for file changes", process.cwd())
  .action(storybook);

program
  .command("build-storybook")
  .description("Build the storybook site")
  .option(
    "--starters-dir <dir>",
    "Directory where starters are. Defaults to cwd.",
    process.cwd(),
  )
  .action(buildStorybook);

program
  .command("update-readme")
  .description("Update the readme's Starters section")
  .option(
    "--starters-dir <dir>",
    "Directory where starters are. Defaults to cwd.",
    process.cwd(),
  )
  .action(updateReadme);

program.parse();
