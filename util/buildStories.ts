#!/usr/bin/env node

import fs from "fs";
import path from "path";
import "dotenv/config";

import { getStarterCommand, parseStarters, getStarterFiles } from "../src/";
import { rewriteReadmeSection } from "./updateReadme";

/* For each starter in `startersPath`, write a Storybook page including the
 * title, description, command and previewable code
 */
(async () => {
  const startersPath = path.join(__dirname, "../../");
  const storiesPath = path.join(__dirname, "../stories/starters/");
  const groups = parseStarters(startersPath);

  try {
    fs.mkdirSync(storiesPath, { recursive: true });
  } catch (e) {
    null;
  }

  const readme = fs.readFileSync(
    path.join(__dirname, "../../README.md"),
    "utf-8",
  );
  const readmeWithoutStarters = rewriteReadmeSection(
    readme,
    "## Starters",
    "View available starters on the left",
  );

  // Write out an overview story
  const outFileMdx = path.join(storiesPath, "../", "jump-start.mdx");
  const mdx = `
import { Meta, Title } from '@storybook/blocks';

<Meta title='Jump Start' />
[View on GitHub](https://github.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO})

${readmeWithoutStarters}
`;

  fs.writeFileSync(outFileMdx, mdx);

  // Write out a story for each starter
  for (const group in groups) {
    const groupDir = path.join(storiesPath, group);
    try {
      fs.mkdirSync(groupDir);
    } catch (e) {
      null;
    }
    for (const starter of groups[group]) {
      const outDir = path.join(groupDir, starter.title);
      const outStarterJson = path.join(outDir, "starter.json");
      const outFilesJson = path.join(outDir, "files.json");
      const outFileMdx = path.join(outDir, `${starter.title}.mdx`);

      try {
        fs.mkdirSync(outDir, { recursive: true });
      } catch (e) {
        null;
      }

      fs.writeFileSync(outStarterJson, JSON.stringify(starter, null, 2));
      const files = await getStarterFiles(
        path.join(startersPath, starter.group, starter.title),
      );
      fs.writeFileSync(outFilesJson, JSON.stringify(files, null, 2));

      const mdx = `
import { Meta, Title } from '@storybook/blocks';
import StarterPreview from '../../../../src/app/StarterPreview';
import files from './files.json';
import starter from './starter.json';

<Meta title='${starter.group}/${starter.title}' />
<Title>${starter.group}/${starter.title}</Title>

${starter.description}

[View on GitHub](https://github.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/tree/main/${starter.group}/${starter.title})

## Use this starter

\`\`\`
${getStarterCommand(starter, process.env.GITHUB_USERNAME, process.env.GITHUB_REPO, process.env.DEGIT_MODE)}
\`\`\`

<StarterPreview files={files} starter={starter} />
`;
      fs.writeFileSync(outFileMdx, mdx);
    }
  }
})();
