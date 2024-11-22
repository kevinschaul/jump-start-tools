import * as path from "node:path";
import { spawn } from "node:child_process";
import { type Instance, type Settings } from "./config";

export type FindOpts = {
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

  let args: string[] = ["--ignore-case"];

  if (opts.text) {
    // For text search, look in yaml files
    args.push("-tyaml");
  } else if (opts.code) {
    // For code search, exclude yaml files
    args.push("--type-not=yaml");
  }

  args = [...args, searchTerm, instance.path];

  return new Promise<void>((resolve, reject) => {
    // Execute content search
    const contentChild = spawn("rg", args);

    const totalProcesses = 1;
    let completedProcesses = 0;
    const checkComplete = () => {
      completedProcesses++;
      if (completedProcesses === totalProcesses) {
        resolve();
      }
    };

    const cleanup = () => {
      if (contentChild.stdout?.removeListener) {
        contentChild.stdout.removeListener("data", handleData);
      }
      if (contentChild.stderr?.removeListener) {
        contentChild.stderr.removeListener("data", handleError);
      }
      if (contentChild.removeListener) {
        contentChild.removeListener("error", cleanup);
        contentChild.removeListener("close", onClose);
      }
    };

    const onClose = (code: number) => {
      if (code !== 0 && code !== 1) {
        cleanup();
        reject(new Error(`ripgrep search exited with code ${code}`));
      }
      checkComplete();
      cleanup();
    };

    const handleError = (data: Buffer | string) => {
      process.stderr.write(data);
    };

    const handleData = (data: Buffer | string) => {
      const starter = handleRgStdout({ instance, data });
      if (starter) {
        const key = `${starter.group}/${starter.starter}`;
        if (!matchingStarters.has(key)) {
          matchingStarters.set(key, starter);
          onMatch(starter);
        }
      }
    };

    contentChild.stdout?.on("data", handleData);
    contentChild.stderr?.on("data", handleError);

    contentChild.on("error", (err) => {
      cleanup();
      reject(err);
    });

    contentChild.on("close", onClose);
  });
};

const find = async (config: Settings, searchTerm: string, opts: FindOpts) => {
  if (!searchTerm.trim()) {
    return;
  }
  const promises = config.instances.map((instance) =>
    executeRipgrep(instance, searchTerm, opts, (starter) => {
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
