import { join } from "node:path";
import { copyJumpStartTools, spawnWithIO, symlinkStarters } from "./util";
import updateStories from "../src/util/updateStories";
const root = join(import.meta.dirname, "../");

type BuildStorybookOpts = {
  startersDir: string;
};

const buildStorybook = async (opts: BuildStorybookOpts) => {
  console.log(`Using startersDir: ${opts.startersDir}`);

  const toolsRoot = copyJumpStartTools(root, opts.startersDir);
  symlinkStarters(toolsRoot, opts.startersDir);

  // Rewrite stories now
  console.log('Updating stories')
  const storiesDir = join(toolsRoot, "./src/stories");
  updateStories(opts.startersDir, storiesDir);
  console.log('Update stories complete.')

  // Build the site
  const outDir = join(opts.startersDir, "dist")
  console.log(`Building site to ${outDir}`);
  spawnWithIO("storybook", ["build", "--output-dir", outDir], { cwd: toolsRoot });
};
export default buildStorybook;
