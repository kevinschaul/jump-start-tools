#!/usr/bin/env node

/**
 * This script updates the given changelog.md file with the version given in the arguments
 * It replaces ## main with ## <version>
 * Removes _...Add new stuff here..._
 * And adds on top a ## main with add stuff here.
 */

import * as fs from 'fs';

const changelogPath = process.argv[2];
const date = new Date();
const dateStr = `${
  date.getMonth() + 1
}/${date.getDate()}/${date.getFullYear()}`;
let changelog = fs.readFileSync(changelogPath, 'utf8');
changelog = changelog.replace('## main', `## ${process.argv[3]} (${dateStr})`);
changelog = changelog.replaceAll('- _...Add new stuff here..._\n', '');
changelog = `## main
- _...Add new stuff here..._

${changelog}`;

fs.writeFileSync(changelogPath, changelog, 'utf8');
