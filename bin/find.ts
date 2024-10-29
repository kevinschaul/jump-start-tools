import * as path from "node:path";
import { spawn } from "node:child_process";
import { type Instance, type Settings } from "./config";

type FindOpts = {
  startersDir: string;
  text: boolean;
  code: boolean;
};

type MatchingStarter = {
  path: string;
  group: string;
  starter: string;
};

export const handleRgStdout = ({
  instance,
  data,
}: {
  instance: Instance;
  data: Buffer | string;
}) => {
  const fullPath = data.toString().split(":")[0];
  const starterPath = path.relative(instance.path, fullPath);
  const [group, starter] = starterPath.split(path.sep);
  const pathToStarter = path.join(instance.path, group, starter);
  return { path: pathToStarter, group, starter };
};

const find = async (config: Settings, searchTerm: string, opts: FindOpts) => {
  for (const instance of config.instances) {
    const matchingStarters = new Set<MatchingStarter>();
    let args: string[] = [];
    if (opts.text) {
      args.push("-tyaml");
    }

    // Possibly add --files-with-matches

    args.push(searchTerm);
    args.push(instance.path);

    const child = spawn("rg", args);

    child.stdout?.on("data", (data) => {
      const starter = handleRgStdout({ instance, data });
      if (!matchingStarters.has(starter)) {
        matchingStarters.add(starter);
        process.stdout.write(
          [starter.path, starter.group, starter.starter].join("\t") + "\n",
        );
      }
    });

    child.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });

    child.on("close", (code) => {});
  }
};

export default find;
