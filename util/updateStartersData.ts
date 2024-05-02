#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { parseStarters } from "./parseStarters";

if (path.basename(import.meta.url) === "updateStartersData.ts") {
  const groups = parseStarters(".");
  fs.writeFileSync("src/starters.json", JSON.stringify(groups, null, 2));
}
