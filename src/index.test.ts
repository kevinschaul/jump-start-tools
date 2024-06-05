import { expect, test } from "vitest";
import * as index from "./";
require("dotenv").config({ path: "./.env.test", override: true });

test('exports', () => {
  expect(index).toHaveProperty("parseStarters");
  expect(index).toHaveProperty("getStarterFiles");
  expect(index).toHaveProperty("getStarterCommand");
})
