import { type Starter } from "../types";

export function getStarterCommand(
  starter: Starter,
  githubUsername: string = "kevinschaul",
  githubRepo: string = "jump-start",
  degitMode: string = "tar",
): string {
  const outDirArg = starter.defaultDir || starter.dir;
  const degitModeString = degitMode === "tar" ? "" : ` --mode=${degitMode}`;
  const firstArgs = `npx tiged${degitModeString} ${githubUsername}/${githubRepo}/${starter.dir}`;
  const separator = firstArgs.length + outDirArg.length > 60 ? " \\\n  " : " ";
  return `${firstArgs}${separator}${outDirArg}`;
}
