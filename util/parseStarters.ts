import fs from "fs";
import { globSync } from "glob";
import path from "path";
// @ts-ignore
import yaml from "js-yaml";

export type StarterPreviewConfig = {
  template?: string;
  dependencies?: { [name: string]: [version: string] };
};
export type Starter = {
  dir: string;
  group: string;
  title: string;
  description?: string;
  tags?: string[];
  defaultDir?: string;
  mainFile?: string;
  preview?: StarterPreviewConfig;
};

export type GroupLookup = {
  [key: string]: Starter[];
};

export function parseStarters(dirPath: string): GroupLookup {
  const groups: GroupLookup = {};

  const filePattern = path.join("./**", "jump-start.yaml");
  const files = globSync(filePattern, {
    fs: fs,
    cwd: dirPath,
    nodir: true,
    follow: true,
    ignore: ["*/src/starters/**"],
  });

  for (const filePath of files) {
    const fileData = yaml.load(
      fs.readFileSync(path.join(dirPath, filePath), "utf8"),
    ) as Starter;

    const dir = path.dirname(filePath);
    const group = path.dirname(path.dirname(filePath));
    const title = path.basename(path.dirname(filePath));

    fileData.dir = dir;
    fileData.title = title;
    fileData.group = group;

    if (!(group in groups)) {
      groups[group] = [];
    }

    groups[group].push(fileData);
  }
  return groups;
}

export function getStarterCommand(
  starter: Starter,
  githubUsername: string = "kevinschaul",
  githubRepo: string = "jump-start",
  degitMode: string = "tar",
): string {
  const outDirArg = starter.defaultDir || starter.dir;
  const degitModeString = degitMode === "tar" ? "" : ` --mode=${degitMode}`
  const firstArgs = `npx degit${degitModeString} ${githubUsername}/${githubRepo}/${starter.dir}`;
  const separator = firstArgs.length + outDirArg.length > 60 ? " \\\n  " : " ";
  return `${firstArgs}${separator}${outDirArg}`;
}

export async function getStarterFiles(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  let out = [];

  for (const file of files) {
    if (!["jump-start.yaml", "degit.json"].includes(file)) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        out.push({
          path: file,
          type: "dir",
        });
      } else {
        out.push({
          path: file,
          type: "file",
          contents: fs.readFileSync(filePath, "utf8"),
        });
      }
    }
  }

  return out;
}
