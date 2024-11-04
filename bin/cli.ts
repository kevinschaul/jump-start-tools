#!/usr/bin/env -S npx tsx

import { Command } from "commander";
import configCommand, { Config } from "./config";
import find from "./find";
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

program
  .command("config")
  .description("Print path to your jump-start config file")
  .action(configCommand);

program
  .command("find")
  .description("Search your installed starters")
  .option("--text", "Search the starter text", true)
  .option("--code", "Search the starter code", false)
  .argument("<search-term>")
  .action(withConfig(find));

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

// TODO
// program
//   .command("update-screenshots")
//   .option(
//     "--starters-dir <dir>",
//     "Directory where starters are. Defaults to cwd.",
//     process.cwd(),
//   )
//   .action(updateScreenshots);

program.parse();
