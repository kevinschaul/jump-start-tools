import { join } from "node:path";
import { watch } from "chokidar";
import { copyJumpStartTools, spawnWithIO } from "./util";
import updateStories from "../src/util/updateStories";
import { Command } from "commander";
const root = join(import.meta.dirname, "../");

type StorybookOpts = {
  startersDir: string;
  noWatch: boolean;
};

const storybook = async (opts: StorybookOpts, command: Command) => {
  console.log(`Using startersDir: ${opts.startersDir}`);

  const toolsRoot = copyJumpStartTools(root, opts.startersDir);

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
  spawnWithIO("storybook", ["dev", "--ci", "-p", "6006", ...command.args], { cwd: toolsRoot });
};
export default storybook;
