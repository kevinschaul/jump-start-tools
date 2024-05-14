import { expect, test } from "vitest";
import * as index from "./";

test('exports', () => {
  expect(index).toHaveProperty("parseStarters");
  expect(index).toHaveProperty("getStarterFiles");
  expect(index).toHaveProperty("getStarterCommand");
})
