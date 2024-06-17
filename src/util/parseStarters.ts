import fs from "fs";
import { globSync } from "glob";
import path from "path";
// @ts-ignore
import yaml from "js-yaml";
import type { File, Starter, StarterGroupLookup } from "../types";

export function parseStarters(
  dirPath: string,
  includeFileData = false,
): StarterGroupLookup {
  const groups: StarterGroupLookup = {};

  const filePattern = path.join("./**", "jump-start.yaml");
  const files = globSync(filePattern, {
    fs: fs,
    cwd: dirPath,
    nodir: true,
    ignore: ["node_modules/**/*", "jump-start-tools/**/*"],
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

    if (includeFileData) {
      fileData.files = getStarterFiles(path.join(dirPath, dir));
    }

    if (!(group in groups)) {
      groups[group] = [];
    }

    groups[group].push(fileData);
  }
  return groups;
}

export function getStarterFiles(dirPath: string): File[] {
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
        } as File);
      } else {
        out.push({
          path: file,
          type: "file",
          contents: fs.readFileSync(filePath, "utf8"),
        } as File);
      }
    }
  }

  return out;
}
