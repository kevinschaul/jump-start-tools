#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { globSync } from "glob";

function convertPathToComponentName(path: string) {
  const [group, component] = path.split("/");

  const groupName = group
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const componentName = component
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  return `${groupName}${componentName}`;
}

if (path.basename(import.meta.url) === "generatePreviewComponentMap.ts") {
  if (process.argv.length !== 3) {
    console.log(`USAGE: tsx util/generatePreviewComponentMap.ts STARTERS_PATH`);
    process.exit(1);
  }

  const startersPath = process.argv[2];

  const files = globSync("**/Preview.js", {
    cwd: startersPath,
    nodir: true,
    follow: true,
    ignore: "jump-start-gallery/**",
  });

  let importsOutput: string[] = [];
  let mapOutput: string[] = [
    "type ComponentMap = {",
    "  [key: string]: () => JSX.Element;",
    "};",
    "export const componentMap: ComponentMap = {",
  ];

  files.forEach((file) => {
    const dir = path.dirname(file);
    const component = convertPathToComponentName(dir);
    importsOutput.push(
      `import { default as ${component} } from "../starters/${file}"`,
    );

    mapOutput.push(`"${dir}": ${component},`);
  });

  mapOutput.push("};")

  const output = importsOutput.concat(mapOutput)

  fs.writeFileSync("src/app/componentMap.ts", output.join("\n"));
}
