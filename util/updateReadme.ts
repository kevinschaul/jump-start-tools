#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { GroupLookup, parseStarters } from "./parseStarters";

export function generateReadmeSection(groups: GroupLookup) {
  const output: string[] = [];

  for (const [groupName, groupData] of Object.entries(groups)) {
    output.push(`### ${groupName}\n`);

    for (const data of groupData) {
      const tags = data.tags?.map((tag) => `\`${tag}\``).join(", ");
      output.push(`#### ${data.title}\n`);
      output.push(`    npx degit kevinschaul/jump-start/${data.dir} ${data.defaultDir || data.dir}\n`);
      if (data.description) {
        output.push(data.description);
      }
      if (data.tags) {
        output.push(`Tags: ${tags}`);
        output.push("");
      }
    }
  }

  return output.join("\n");
}

export function rewriteReadmeSection(
  existingContent: string,
  section: string,
  newContent: string,
): string {
  const lines = existingContent.split("\n");
  const rewrittenLines: string[] = [];
  let isInSection = false;
  for (const line of lines) {
    if (line === section) {
      isInSection = true;
      rewrittenLines.push(line);
      rewrittenLines.push("");
      rewrittenLines.push(newContent);
      rewrittenLines.push("");
    } else {
      if (line.startsWith("## ")) {
        isInSection = false;
      }
      if (!isInSection) {
        rewrittenLines.push(line);
      }
    }
  }
  return rewrittenLines.join("\n");
}

if (path.basename(import.meta.url) === "updateReadme.ts") {
  const groups = parseStarters(".");
  const startersSection = generateReadmeSection(groups);

  const existingReadme = fs.readFileSync("README.md", "utf8");
  const updatedReadme = rewriteReadmeSection(
    existingReadme,
    "## Starters",
    startersSection,
  );
  fs.writeFileSync("README.md", updatedReadme);
}
