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
  let contentArgs: string[] = [];

  if (opts.text) {
    // For text search, look in yaml files
    contentArgs.push("-tyaml");
  } else if (opts.code) {
    // For code search, exclude yaml files
    contentArgs.push("--type-not=yaml");
  }

  contentArgs = [...contentArgs, searchTerm, instance.path];

  return new Promise<void>((resolve, reject) => {
    // Execute content search
    // console.log(contentArgs)
    const contentChild = spawn("rg", contentArgs);

    // For text search, also search filepaths
    const pathArgs = opts.text
      ? ["--files", "--glob", `*${searchTerm}*`, instance.path]
      : null;

    const pathChild = pathArgs ? spawn("rg", pathArgs) : null;

    const totalProcesses = pathChild ? 2 : 1;
    let completedProcesses = 0;
    const checkComplete = () => {
      completedProcesses++;
      if (completedProcesses === totalProcesses) {
        resolve();
      }
    };

    const cleanup = () => {
      if (contentChild.stdout?.removeListener) {
        contentChild.stdout.removeListener("data", handleContentData);
      }
      if (contentChild.stderr?.removeListener) {
        contentChild.stderr.removeListener("data", handleError);
      }
      if (contentChild.removeListener) {
        contentChild.removeListener("error", cleanup);
        contentChild.removeListener("close", onContentClose);
      }
      if (pathChild) {
        if (pathChild.stdout?.removeListener) {
          pathChild.stdout.removeListener("data", handlePathData);
        }
        if (pathChild.stderr?.removeListener) {
          pathChild.stderr.removeListener("data", handleError);
        }
        if (pathChild.removeListener) {
          pathChild.removeListener("error", cleanup);
          pathChild.removeListener("close", onPathClose);
        }
      }
    };

    const onContentClose = (code: number) => {
      if (code !== 0 && code !== 1) {
        cleanup();
        reject(new Error(`ripgrep content search exited with code ${code}`));
      }
      checkComplete();
      cleanup();
    };

    const onPathClose = (code: number) => {
      if (code !== 0 && code !== 1) {
        cleanup();
        reject(new Error(`ripgrep path search exited with code ${code}`));
      }
      checkComplete();
    };

    const handleError = (data: Buffer | string) => {
      process.stderr.write(data);
    };

    const handleContentData = (data: Buffer | string) => {
      const starter = handleRgStdout({ instance, data });
      if (starter) {
        const key = `${starter.group}/${starter.starter}`;
        if (!matchingStarters.has(key)) {
          matchingStarters.set(key, starter);
          onMatch(starter);
        }
      }
    };

    const handlePathData = (data: Buffer | string) => {
      const starter = handleRgStdout({ instance, data });
      const key = `${starter.group}/${starter.starter}`;
      if (!matchingStarters.has(key)) {
        matchingStarters.set(key, starter);
        onMatch(starter);
      }
    };

    // Handle content search results
    contentChild.stdout?.on("data", handleContentData);
    contentChild.stderr?.on("data", handleError);

    // Handle path search results if path search is enabled
    if (pathChild) {
      pathChild.stdout?.on("data", handlePathData);
      pathChild.stderr?.on("data", handleError);

      pathChild.on("error", (err) => {
        cleanup();
        reject(err);
      });

      pathChild.on("close", (code) => {
        if (code !== 0 && code !== 1) {
          // 1 means no matches found
          cleanup();
          reject(new Error(`ripgrep path search exited with code ${code}`));
        }
        checkComplete();
      });
    }

    contentChild.on("error", (err) => {
      cleanup();
      reject(err);
    });

    contentChild.on("close", onContentClose);
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
