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
  const parts = starterPath.split(path.sep);
  
  // Validate path structure: should be group/starter/...
  if (parts.length < 2) return null;
  
  // Skip if first part is a special directory
  const invalidDirs = ['node_modules', '.github', '.build', 'dist', 'build'];
  if (invalidDirs.includes(parts[0])) return null;
  
  const group = parts[0];
  const starter = parts[1];
  
  // Ensure we have both group and starter
  if (!group || !starter) return null;
  
  const pathToStarter = path.join(instance.path, group, starter);
  return { path: pathToStarter, group, starter };
};

export const executeRipgrep = async (
  instance: Instance,
  searchTerm: string,
  opts: FindOpts,
  onMatch: (starter: MatchingStarter) => void,
) => {
  if (!searchTerm.trim()) {
    return;
  }
  const matchingStarters = new Map<string, MatchingStarter>();
  // Search in both file contents and paths
  let contentArgs: string[] = ["--glob", "!node_modules"];
  
  if (opts.text) {
    // For text search, look in yaml files
    contentArgs.push("-tyaml");
  } else if (opts.code) {
    // For code search, exclude yaml files
    contentArgs.push("--type-not=yaml");
  }

  // Add more directories to ignore
  contentArgs = [
    ...contentArgs,
    "--glob", "!.github/**",
    "--glob", "!.build/**", 
    "--glob", "!build/**",
    "--glob", "!dist/**",
    searchTerm,
    instance.path
  ];

  return new Promise<void>((resolve, reject) => {
    // Execute content search
    const contentChild = spawn("rg", contentArgs);

    // For text search, also search filepaths
    const pathArgs = opts.text ? [
      "--glob",
      "!node_modules",
      "--files",
      "--glob",
      `*${searchTerm}*`,
      instance.path,
    ] : null;

    const pathChild = pathArgs ? spawn("rg", pathArgs) : null;

    const totalProcesses = pathChild ? 2 : 1;
    let completedProcesses = 0;
    const checkComplete = () => {
      completedProcesses++;
      if (completedProcesses === totalProcesses) {
        resolve();
      }
    };

    // Handle content search results
    contentChild.stdout?.on("data", (data) => {
      const starter = handleRgStdout({ instance, data });
      if (starter) {
        const key = `${starter.group}/${starter.starter}`;
        if (!matchingStarters.has(key)) {
          matchingStarters.set(key, starter);
          onMatch(starter);
        }
      }
    });

    // Handle path search results if path search is enabled
    if (pathChild) {
      pathChild.stdout?.on("data", (data) => {
        const starter = handleRgStdout({ instance, data });
        const key = `${starter.group}/${starter.starter}`;
        if (!matchingStarters.has(key)) {
          matchingStarters.set(key, starter);
          onMatch(starter);
        }
      });

      pathChild.stderr?.on("data", (data) => {
        process.stderr.write(data);
      });

      pathChild.on("close", (code) => {
        if (code !== 0 && code !== 1) {
          // 1 means no matches found
          reject(new Error(`ripgrep path search exited with code ${code}`));
        }
        checkComplete();
      });
    }

    contentChild.stderr?.on("data", (data) => {
      process.stderr.write(data);
    });

    contentChild.on("close", (code) => {
      if (code !== 0 && code !== 1) {
        // 1 means no matches found
        reject(new Error(`ripgrep content search exited with code ${code}`));
      }
      checkComplete();
    });
  });
};

const find = async (config: Settings, searchTerm: string, opts: FindOpts) => {
  if (!searchTerm.trim()) {
    return;
  }
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
