import { join } from "node:path";
import { spawn } from "node:child_process";
import { copyJumpStartTools, spawnWithIO } from "./util";
import updateStories from "../src/util/updateStories";
import updateScreenshots from "../src/util/updateScreenshots";
const root = join(import.meta.dirname, "../");

type BuildStorybookOpts = {
  startersDir: string;
  updateImages: string;
};

async function startStorybookUpdateScreenshots(
  toolsRoot: string,
  startersDir: string,
  storiesDir: string,
) {
  return new Promise((resolve, reject) => {
    // Start the storybook server
    console.log("Starting dev server to update images");
    const child = spawn("storybook", ["dev", "--ci", "-p", "6006"], {
      cwd: toolsRoot,
    });

    // When the dev server logs that storybook has started, call
    // updateScreenshots
    child.stdout?.on("data", (data) => {
      if (/Storybook .* started/.test(data.toString())) {
        console.log("Updating images");
        updateScreenshots(startersDir, storiesDir);
        child.kill();
        console.log("Images updated");
        resolve(true);
      }
    });
  });
}

const buildStorybook = async (opts: BuildStorybookOpts) => {
  console.log(`Using startersDir: ${opts.startersDir}`);

  const toolsRoot = copyJumpStartTools(root, opts.startersDir);

  // Rewrite stories now
  console.log("Updating stories");
  const storiesDir = join(toolsRoot, "./src/stories");
  updateStories(opts.startersDir, storiesDir);
  console.log("Update stories complete.");

  if (opts.updateImages) {
    await startStorybookUpdateScreenshots(
      toolsRoot,
      opts.startersDir,
      storiesDir,
    );
  }

  // Build the site
  const outDir = join(opts.startersDir, "dist");
  console.log(`Building site to ${outDir}`);
  spawnWithIO("storybook", ["build", "--output-dir", outDir], {
    cwd: toolsRoot,
  });
};
export default buildStorybook;
