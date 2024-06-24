import { join } from "node:path";
import { watch } from "chokidar";
import { copyJumpStartTools, spawnWithIO, symlinkStarters } from "./util";
import updateStories from "../src/util/updateStories";
import { Command } from "commander";
import updateScreenshots from "../src/util/updateScreenshots";
const root = join(import.meta.dirname, "../");

type StorybookOpts = {
  startersDir: string;
  noWatch: boolean;
  updateImages: boolean;
};

const storybook = async (opts: StorybookOpts, command: Command) => {
  console.log(`Using startersDir: ${opts.startersDir}`);

  const toolsRoot = copyJumpStartTools(root, opts.startersDir);
  symlinkStarters(toolsRoot, opts.startersDir);

  // Rewrite stories now and any time a change is made to the starters
  console.log("Updating stories");
  const storiesDir = join(toolsRoot, "./src/stories");
  updateStories(opts.startersDir, storiesDir);
  console.log("Update stories complete.");

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
  const child = spawnWithIO(
    "storybook",
    ["dev", "--ci", "-p", "6006", ...command.args],
    { cwd: toolsRoot },
  );

  if (opts.updateImages) {
    // When the dev server logs that storybook has started, call
    // updateScreenshots
    child.stdout?.on("data", (data) => {
      if (/Storybook .* started/.test(data.toString())) {
        updateScreenshots(opts.startersDir, storiesDir);
      }
    });
  }
};
export default storybook;
