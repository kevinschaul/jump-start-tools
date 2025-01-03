import * as path from "node:path";
import { spawn } from "node:child_process";
import { type Instance, type Settings } from "./config";

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

export const handleFdStdout = ({
  instance,
  data,
}: {
  instance: Instance;
  data: Buffer | string;
}) => {
  const fullPath = data.toString();
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

export const executeSearches = async (
  instance: Instance,
  searchTerm: string,
  onMatch: (starter: MatchingStarter) => void,
) => {
  const matchingStarters = new Map<string, MatchingStarter>();

  let rgArgs: string[] = ["--smart-case"];
  rgArgs = [...rgArgs, searchTerm, instance.path];

  let fdArgs: string[] = [];
  fdArgs = [...fdArgs, searchTerm, instance.path];

  return new Promise<void>((resolve, reject) => {
    const rgProcess = spawn("rg", rgArgs);
    const fdProcess = spawn("fd", fdArgs);

    const totalProcesses = 2;
    let completedProcesses = 0;
    const checkComplete = () => {
      completedProcesses++;
      if (completedProcesses === totalProcesses) {
        resolve();
      }
    };

    const rgCleanup = () => {
      if (rgProcess.stdout?.removeListener) {
        rgProcess.stdout.removeListener("data", rgHandleData);
      }
      if (rgProcess.stderr?.removeListener) {
        rgProcess.stderr.removeListener("data", rgHandleError);
      }
      if (rgProcess.removeListener) {
        rgProcess.removeListener("error", rgCleanup);
        rgProcess.removeListener("close", rgOnClose);
      }
    };

    const rgOnClose = (code: number) => {
      if (code !== 0 && code !== 1) {
        rgCleanup();
        reject(new Error(`rg search exited with code ${code}`));
      }
      checkComplete();
      rgCleanup();
    };

    const rgHandleError = (data: Buffer | string) => {
      process.stderr.write(data);
    };

    const rgHandleData = (data: Buffer | string) => {
      const starter = handleRgStdout({ instance, data });
      if (starter) {
        const key = `${starter.group}/${starter.starter}`;
        if (!matchingStarters.has(key)) {
          matchingStarters.set(key, starter);
          onMatch(starter);
        }
      }
    };

    rgProcess.stdout?.on("data", rgHandleData);
    rgProcess.stderr?.on("data", rgHandleError);

    rgProcess.on("error", (err) => {
      rgCleanup();
      reject(err);
    });

    rgProcess.on("close", rgOnClose);

    const fdCleanup = () => {
      if (fdProcess.stdout?.removeListener) {
        fdProcess.stdout.removeListener("data", fdHandleData);
      }
      if (fdProcess.stderr?.removeListener) {
        fdProcess.stderr.removeListener("data", fdHandleError);
      }
      if (fdProcess.removeListener) {
        fdProcess.removeListener("error", fdCleanup);
        fdProcess.removeListener("close", fdOnClose);
      }
    };

    const fdOnClose = (code: number) => {
      if (code !== 0 && code !== 1) {
        fdCleanup();
        reject(new Error(`fd search exited with code ${code}`));
      }
      checkComplete();
      fdCleanup();
    };

    const fdHandleError = (data: Buffer | string) => {
      process.stderr.write(data);
    };

    const fdHandleData = (data: Buffer | string) => {
      const starter = handleFdStdout({ instance, data });
      if (starter) {
        const key = `${starter.group}/${starter.starter}`;
        if (!matchingStarters.has(key)) {
          matchingStarters.set(key, starter);
          onMatch(starter);
        }
      }
    };

    fdProcess.stdout?.on("data", fdHandleData);
    fdProcess.stderr?.on("data", fdHandleError);

    fdProcess.on("error", (err) => {
      fdCleanup();
      reject(err);
    });

    fdProcess.on("close", fdOnClose);
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
