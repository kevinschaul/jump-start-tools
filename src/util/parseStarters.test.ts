import { expect, test, vi } from "vitest";
import { vol } from "memfs";
import type { StarterGroupLookup } from "../types";
import { parseStarters } from "./parseStarters";
require("dotenv").config({ path: "./.env.test", override: true });

vi.mock("node:fs", async () => {
  const memfs = await vi.importActual("memfs");
  return { default: memfs.fs };
});

test("basic", () => {
  vol.fromNestedJSON({
    ".": {
      "react-d3": {
        Chart: {
          "jump-start.yaml": `
---
description: |
  An empty React component for writing a responsive D3 chart.

  * Adds size prop
  * Sets up margin convention
tags:
  - react
  - d3
  - chart
`,
        },
      },
    },
  });

  const expected: StarterGroupLookup = {
    "react-d3": [
      {
        title: "Chart",
        group: "react-d3",
        dir: "react-d3/Chart",
        description: `An empty React component for writing a responsive D3 chart.

* Adds size prop
* Sets up margin convention
`,
        tags: ["react", "d3", "chart"],
      },
    ],
  };
  expect(parseStarters(".")).toStrictEqual(expected);
});
