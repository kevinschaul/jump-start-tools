#!/usr/bin/env -S npx tsx

import { Command } from "commander";
import configCommand, { Config, Settings } from "./config";
import find from "./find";
import use from "./use";
import add from "./add";
import storybook from "./storybook";
import buildStorybook from "./buildStorybook";
import updateReadme from "./updateReadme";

const program = new Command();
const config = new Config("jump-start");

const withConfig = <T extends unknown[], R>(
  action: (config: Settings, ...args: T) => R,
) => {
  return (...args: T) => action(config.load(), ...args);
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
  .description("Search your installed starters. Searches both filenames and file content.")
  .argument("<search-term>")
  .action(withConfig(find));

program
  .command("use")
  .description("Use a starter.")
  .option(
    "--out <dir>",
    "Where to save the starter. Defaults to the starter's defaultDir.",
  )
  .argument("<starter-string>", "Specify the starter with `<group>/<starter>` or `<instance>/<group>/<starter>`.")
  .action(withConfig(use));

program
  .command("add")
  .description("Add a starter.")
  .argument("<starter-string>", "Specify the starter with `<group>/<starter>` or `<instance>/<group>/<starter>`.")
  .argument("<files>", "A JSON string containing an array of files to add, with keys `name` and `contents`.")
  .action(withConfig(add));

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
