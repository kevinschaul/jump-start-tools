import fs from "fs";
import path from "path";
import { getStarterFiles, parseStarters } from "./parseStarters";
import { getStarterCommand } from "./getStarterCommand";
import { rewriteReadmeSection } from "./updateReadme";

export default function updateStories(startersDir: string, storiesDir: string) {
  // Delete existing stories
  fs.rmSync(storiesDir, { recursive: true, force: true });

  const groups = parseStarters(startersDir, true);

  try {
    fs.mkdirSync(storiesDir, { recursive: true });
  } catch (e) {
    null;
  }

  const readme = fs.readFileSync(
    path.join(startersDir, "README.md"),
    "utf-8",
  );
  const readmeWithoutStarters = rewriteReadmeSection(
    readme,
    "## Starters",
    "View available starters on the left",
  );

  // Write out an overview story
  const outFileMdx = path.join(storiesDir, "./", "jump-start.mdx");
  const mdx = `
import { Meta, Title } from '@storybook/blocks';

<Meta title='Jump Start' />
[View on GitHub](https://github.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO})

${readmeWithoutStarters}
`;

  fs.writeFileSync(outFileMdx, mdx);

  // Write out a story for each starter
  for (const group in groups) {
    const groupDir = path.join(storiesDir, group);
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
      const files = getStarterFiles(
        path.join(startersDir, starter.group, starter.title),
      );
      fs.writeFileSync(outFilesJson, JSON.stringify(files, null, 2));

      const mdx = `
import { Meta, Title } from '@storybook/blocks';
import StarterPreview from '../../../StarterPreview';
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

<StarterPreview starter={starter} />
`;
      fs.writeFileSync(outFileMdx, mdx);
    }
  }
}
