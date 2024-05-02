import fs from "fs";
import { globSync } from "glob";
import path from "path";
// @ts-ignore
import yaml from "js-yaml";

export type Starter = {
  dir: string;
  group: string;
  title: string;
  description?: string;
  tags?: string[];
  defaultDir?: string;
};

export type GroupLookup = {
  [key: string]: Starter[];
};

export function parseStarters(dirPath: string): GroupLookup {
  const groups: GroupLookup = {};

  const filePattern = path.join(dirPath, "**", "jump-start.yaml");
  const files = globSync(filePattern, { nodir: true });

  for (const filePath of files) {
    const fileData = yaml.load(fs.readFileSync(filePath, "utf8")) as Starter;
    
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
