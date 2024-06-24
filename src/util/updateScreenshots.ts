#!/usr/bin/env tsx

import { mkdirSync } from "fs";
import path from "path";
import "dotenv/config";
import { parseStarters } from "./parseStarters";
import { execSync } from "child_process";

export default function updateScreenshots(
  startersDir: string,
  storiesDir: string,
) {
  const groups = parseStarters(startersDir);
  for (const group in groups) {
    for (const starter of groups[group]) {
      if (starter.preview) {
        const outDir = path.join(storiesDir, "assets", starter.group);
        const outFile = path.join(outDir, `${starter.title}.png`);
        try {
          mkdirSync(outDir);
        } catch (e) {}

        // Note: This assumes that the storybook dev server is running, and specifically at port 6006
        const url = `http://localhost:6006/iframe.html?viewMode=docs&id=${starter.group.toLowerCase()}-${starter.title.toLowerCase()}--docs`;

        console.log(`Taking screenshot of ${starter.group}/${starter.title} at ${url}`);
        execSync(
          `
          shot-scraper \
            "${url}" \
            --selector '.starter-preview iframe' \
            --wait-for 'document.querySelector(".starter-preview[data-has-rendered=true]")' \
            --javascript 'document.head.appendChild(document.createElement("style")).innerHTML = "\
              .starter-preview iframe { flex-grow: 0; } \
              .sp-preview-actions { display: none !important; } \
            ";' \
            --wait 1000 \
            --width 400 \
            --output ${outFile}
        `,
          { timeout: 10000 },
        );
      }
    }
  }
}
