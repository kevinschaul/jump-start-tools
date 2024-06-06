import { join } from "node:path";
import { symlinkStarters } from "./util";
import updateReadme from "../src/util/updateReadme";
const root = join(import.meta.dirname, "../");

type UpdateReadmeOpts = {
  startersDir: string;
};

const task = async (opts: UpdateReadmeOpts) => {
  console.log(`Using startersDir: ${opts.startersDir}`);

  symlinkStarters(root, opts.startersDir);

  updateReadme(opts.startersDir);
  console.log(`Readme updated`)
};
export default task;
