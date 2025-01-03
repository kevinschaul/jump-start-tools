import * as path from "node:path";
import { spawn } from "node:child_process";
import { type Instance, type Settings } from "./config";

type MatchingStarter = {
  path: string;
  group: string;
  starter: string;
};

export const handleStdout = ({
  instance,
  data,
}: {
  instance: Instance;
  data: Buffer | string;
}) => {
  // This works for both `rg` and `fd`. `rg` separates paths by colon, and `fd`
  // simply outputs paths.
  const fullPath = data.toString().split(":")[0];
  const starterPath = path.relative(instance.path, fullPath);
  const parts = starterPath.split(path.sep);

  // Validate path structure: should be group/starter/...
  if (parts.length < 2) return null;
  const [group, starter] = parts;

  // Ensure we have both group and starter
  if (!group || !starter) return null;

  const pathToStarter = path.join(instance.path, group, starter);
  return { path: pathToStarter, group, starter };
};

export const executeSearches = async (
  instance: Instance,
  searchTerm: string,
  onMatch: (starter: MatchingStarter) => void,
) => {
  const matchingStarters = new Map<string, MatchingStarter>();
  await Promise.all([
    executeSearch(
      instance,
      searchTerm,
      "rg",
      ["--smart-case"],
      matchingStarters,
      onMatch,
    ),
    executeSearch(instance, searchTerm, "fd", [], matchingStarters, onMatch),
  ]);
};

const executeSearch = async (
  instance: Instance,
  searchTerm: string,
  command: string,
  args: string[],
  matchingStarters: Map<string, MatchingStarter>,
  onMatch: (starter: MatchingStarter) => void,
) => {
  return new Promise<void>((resolve, reject) => {
    const childProcess = spawn(command, [...args, searchTerm, instance.path]);

    const cleanup = () => {
      if (childProcess.stdout?.removeListener) {
        childProcess.stdout?.removeListener("data", handleData);
      }
      if (childProcess.stderr?.removeListener) {
        childProcess.stderr?.removeListener("data", handleError);
      }
      if (childProcess.removeListener) {
        childProcess.removeListener("error", onError);
        childProcess.removeListener("close", onClose);
      }
    };

    const onClose = (code: number) => {
      if (code !== 0 && code !== 1) {
        cleanup();
        reject(new Error(`${command} search exited with code ${code}`));
      }
      resolve();
      cleanup();
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const handleError = (data: Buffer | string) => {
      process.stderr.write(data);
    };

    const handleData = (data: Buffer | string) => {
      const starter = handleStdout({ instance, data });
      if (starter) {
        const key = `${starter.group}/${starter.starter}`;
        if (!matchingStarters.has(key)) {
          matchingStarters.set(key, starter);
          onMatch(starter);
        }
      }
    };

    childProcess.stdout?.on("data", handleData);
    childProcess.stderr?.on("data", handleError);
    childProcess.on("error", onError);
    childProcess.on("close", onClose);
  });
};

const find = async (config: Settings, searchTerm: string) => {
  if (!searchTerm.trim()) {
    return;
  }
  const promises = config.instances.map((instance) =>
    executeSearches(instance, searchTerm, (starter) => {
      process.stdout.write(
        [starter.path, instance.name, starter.group, starter.starter].join(
          "\t",
        ) + "\n",
      );
    }),
  );

  await Promise.all(promises);
};

export default find;
