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

export const executeRipgrep = async (
  instance: Instance,
  searchTerm: string,
  opts: FindOpts,
  onMatch: (starter: MatchingStarter) => void
) => {
  const matchingStarters = new Set<MatchingStarter>();
  // Search in both file contents and paths
  let args: string[] = ["--glob", "!node_modules"];
  
  if (opts.text) {
    args.push("-tyaml");
  }

  // Add path search if enabled
  if (opts.code) {
    args.push("--files-with-matches");
  }

  args.push(searchTerm);
  args.push(instance.path);

  // Also search in file paths
  const pathArgs = [...args];
  pathArgs.push("--files");  // List all files
  pathArgs.push("--glob");
  pathArgs.push(`*${searchTerm}*`); // Match paths containing the search term

  return new Promise<void>((resolve, reject) => {
    const child = spawn("rg", args);

    child.stdout?.on("data", (data) => {
      const starter = handleRgStdout({ instance, data });
      if (!matchingStarters.has(starter)) {
        matchingStarters.add(starter);
        onMatch(starter);
      }
    });

    child.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });

    child.on("close", (code) => {
      if (code === 0 || code === 1) { // 1 means no matches found
        resolve();
      } else {
        reject(new Error(`ripgrep process exited with code ${code}`));
      }
    });
  });
};

const find = async (config: Settings, searchTerm: string, opts: FindOpts) => {
  const promises = config.instances.map((instance) =>
    executeRipgrep(instance, searchTerm, opts, (starter) => {
      process.stdout.write(
        [starter.path, starter.group, starter.starter].join("\t") + "\n"
      );
    })
  );

  await Promise.all(promises);
};

export default find;
