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
  onMatch: (starter: MatchingStarter) => void,
) => {
  const matchingStarters = new Set<MatchingStarter>();
  // Search in both file contents and paths
  let args: string[] = ["--glob", "!node_modules"];

  if (opts.text) {
    args.push("-tyaml");
  }

  // Add path search if enabled
  if (opts.code) {
    args.push("--glob");
  }

  args.push(searchTerm);
  args.push(instance.path);

  return new Promise<void>((resolve, reject) => {
    // Execute content search
    const contentChild = spawn("rg", args);

    // Execute path search
    const pathChild = spawn("rg", [
      "--glob",
      "!node_modules",
      "--files",
      "--glob",
      `*${searchTerm}*`,
      instance.path,
    ]);

    let completedProcesses = 0;
    const checkComplete = () => {
      completedProcesses++;
      if (completedProcesses === 2) {
        resolve();
      }
    };

    // Handle content search results
    contentChild.stdout?.on("data", (data) => {
      const starter = handleRgStdout({ instance, data });
      if (!matchingStarters.has(starter)) {
        matchingStarters.add(starter);
        onMatch(starter);
      }
    });

    // Handle path search results
    pathChild.stdout?.on("data", (data) => {
      const starter = handleRgStdout({ instance, data });
      if (!matchingStarters.has(starter)) {
        matchingStarters.add(starter);
        onMatch(starter);
      }
    });

    contentChild.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });

    pathChild.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });

    contentChild.on("close", (code) => {
      if (code !== 0 && code !== 1) {
        // 1 means no matches found
        reject(new Error(`ripgrep content search exited with code ${code}`));
      }
      checkComplete();
    });

    pathChild.on("close", (code) => {
      if (code !== 0 && code !== 1) {
        // 1 means no matches found
        reject(new Error(`ripgrep path search exited with code ${code}`));
      }
      checkComplete();
    });
  });
};

const find = async (config: Settings, searchTerm: string, opts: FindOpts) => {
  const promises = config.instances.map((instance) =>
    executeRipgrep(instance, searchTerm, opts, (starter) => {
      process.stdout.write(
        [starter.path, starter.group, starter.starter].join("\t") + "\n",
      );
    }),
  );

  await Promise.all(promises);
};

export default find;
