#!/usr/bin/env -S npx tsx

import { Command } from "commander";
import storybook from "./storybook";
import buildStorybook from "./buildStorybook";
import updateReadme from "./updateReadme";

const program = new Command();

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
  .option("--no-watch", "Don't watch for file changes")
  .option("--update-images", "Update the preview images", false)
  .option("--no-update-images", "Don't update the preview images", true)
  .action(storybook);

program
  .command("build-storybook")
  .description("Build the storybook site")
  .option(
    "--starters-dir <dir>",
    "Directory where starters are. Defaults to cwd.",
    process.cwd(),
  )
  .option("--update-images", "Update the preview images", true)
  .option("--no-update-images", "Don't update the preview images", false)
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
