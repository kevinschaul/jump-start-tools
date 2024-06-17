import fs from "fs";
import path from "path";
import "dotenv/config";
import type { StarterGroupLookup } from "../types";
import { getStarterCommand } from "./getStarterCommand";
import { parseStarters } from "./parseStarters";

export function generateReadmeSection(groups: StarterGroupLookup) {
  const output: string[] = [];

  for (const [groupName, groupData] of Object.entries(groups)) {
    output.push(`---\n\n### ${groupName}\n`);

    for (const data of groupData) {
      const tags = data.tags?.map((tag) => `\`${tag}\``).join(", ");
      output.push(`#### ${data.title}`);
      output.push(`
\`\`\`
${getStarterCommand(data, process.env.GITHUB_USERNAME, process.env.GITHUB_REPO, process.env.DEGIT_MODE)}
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

export default function updateReadme(startersDir: string) {
  const readmePath = path.join(startersDir, "README.md");

  const groups = parseStarters(startersDir);
  const startersSection = generateReadmeSection(groups);

  const existingReadme = fs.readFileSync(readmePath, "utf8");
  const updatedReadme = rewriteReadmeSection(
    existingReadme,
    "## Starters",
    startersSection,
  );
  fs.writeFileSync(readmePath, updatedReadme);
}
