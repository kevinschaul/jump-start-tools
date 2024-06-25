import updateReadme from "../src/util/updateReadme";

type UpdateReadmeOpts = {
  startersDir: string;
};

const task = async (opts: UpdateReadmeOpts) => {
  console.log(`Using startersDir: ${opts.startersDir}`);

  updateReadme(opts.startersDir);
  console.log(`Readme updated`)
};
export default task;
