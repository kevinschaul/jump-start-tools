import { join } from "node:path";
import { SpawnOptions, spawn } from "node:child_process";
import { cpSync, rmSync } from "node:fs";

export function getToolsRoot(startersDir: string) {
  return join(startersDir, "./.build/jump-start-tools");
}

export function copyJumpStartTools(root: string, startersDir: string) {
  // Copy jump-start-tools out of node_modules to avoid compilation errors with
  // storybook
  const toolsRoot = getToolsRoot(startersDir);
  console.log(`Copying ${root} to ${toolsRoot}`);
  rmSync(toolsRoot, { recursive: true, force: true });
  cpSync(root, toolsRoot, { recursive: true });
  return toolsRoot;
}

export function spawnWithIO(command: string, args: string[], options: SpawnOptions) {
  console.log("Starting server");
  const child = spawn(command, args, options);

  child.stdout?.on("data", (data) => {
    process.stdout.write(data);
  });

  child.stderr?.on("data", (data) => {
    process.stderr.write(data);
  });

  child.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  return child
}
