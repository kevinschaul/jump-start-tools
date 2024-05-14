#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { GroupLookup, getStarterCommand, parseStarters } from "./parseStarters";

export function generateReadmeSection(groups: GroupLookup) {
  const output: string[] = [];

  for (const [groupName, groupData] of Object.entries(groups)) {
    output.push(`---\n\n### ${groupName}\n`);

    for (const data of groupData) {
      const tags = data.tags?.map((tag) => `\`${tag}\``).join(", ");
      output.push(`#### ${data.title}`);
      output.push(`
\`\`\`
${getStarterCommand(data, process.env.JUMP_START_GITHUB_USERNAME, process.env.JUMP_START_GITHUB_REPO)}
\`\`\`
`);
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
  let startersPath = process.env["JUMP_START_STARTERS"];

  if (!startersPath) {
    console.log(`No env variable found: JUMP_START_STARTER`);
    console.log(`Using JUMP_START_STARTER=./ by default`);
    startersPath = "./";
  }

  const readmePath = path.join(startersPath, "README.md");

  const groups = parseStarters(startersPath);
  const startersSection = generateReadmeSection(groups);

  const existingReadme = fs.readFileSync(readmePath, "utf8");
  const updatedReadme = rewriteReadmeSection(
    existingReadme,
    "## Starters",
    startersSection,
  );
  fs.writeFileSync(readmePath, updatedReadme);
}
