#!/usr/bin/env tsx

import { mkdirSync } from "fs";
import path from "path";
import "dotenv/config";
import { parseStarters } from "./parseStarters";
import { execSync } from "child_process";

if (path.basename(import.meta.url) === "updateScreenshots.ts") {
  let startersPath = process.env["JUMP_START_STARTERS"];

  if (!startersPath) {
    console.log(`No env variable found: JUMP_START_STARTER`);
    console.log(`Using JUMP_START_STARTER=./ by default`);
    startersPath = "./";
  }

  const groups = parseStarters(startersPath);
  for (const group in groups) {
    for (const starter of groups[group]) {
      if (starter.preview) {
        const outDir = path.join(
          startersPath,
          "jump-start-gallery",
          "public",
          "screenshots",
          starter.group,
        );
        const outFile = path.join(outDir, `${starter.title}.png`);
        try {
          mkdirSync(outDir);
        } catch (e) {}

        console.log(`Taking screenshot of ${starter.group}/${starter.title}`);
        execSync(
          `
          shot-scraper \
            http://localhost:3000/${starter.group}/${starter.title} \
            --selector '.starter-preview iframe' \
            --wait-for 'document.querySelector(".starter-preview[data-has-rendered=true]")' \
            --javascript 'document.head.appendChild(document.createElement("style")).innerHTML = "\
              .sp-preview-actions { display: none; } \
            ";' \
            --width 400 \
            --output ${outFile}
        `,
          { timeout: 30000 },
        );
      }
    }
  }
}
