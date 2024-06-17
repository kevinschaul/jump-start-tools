import { join } from "node:path";
import { cpSync, rmSync } from "node:fs";
import { watch } from "chokidar";
import { spawnWithIO, symlinkStarters } from "./util";
import updateStories from "../src/util/updateStories";
import { Command } from "commander";
const root = join(import.meta.dirname, "../");

type StorybookOpts = {
  startersDir: string;
  noWatch: boolean;
};

const storybook = async (opts: StorybookOpts, command: Command) => {
  console.log(`Using startersDir: ${opts.startersDir}`);

  // Copy jump-start-tools out of node_modules to avoid compilation errors with
  // storybook
  const toolsRoot = join(opts.startersDir, "./jump-start-tools");
  console.log(`Copying ${root} to ${toolsRoot}`);
  rmSync(toolsRoot, { recursive: true, force: true })
  cpSync(root, toolsRoot, { recursive: true });
  console.log(`Copy complete.`);

  symlinkStarters(toolsRoot, opts.startersDir);

  // Rewrite stories now and any time a change is made to the starters
  console.log('Updating stories')
  const storiesDir = join(toolsRoot, "./src/stories");
  updateStories(opts.startersDir, storiesDir);
  console.log('Update stories complete.')

  if (!opts.noWatch) {
    const watcher = watch(opts.startersDir, {
      ignoreInitial: true,
      ignored: /node_modules|stories|jump-start-tools|src\/starters/,
    });
    watcher.on("all", (event, path) => {
      console.log(`${event} detected: ${path}. Rewriting stories.`);
      updateStories(opts.startersDir, storiesDir);
    });
  }

  // Start the storybook server, including any additional commands passed
  // through
  spawnWithIO("storybook", ["dev", "-p", "6006", ...command.args], { cwd: toolsRoot });
};
export default storybook;
