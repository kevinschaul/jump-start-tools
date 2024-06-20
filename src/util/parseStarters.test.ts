import { describe, expect, test, vi } from "vitest";
import { vol } from "memfs";
import type { StarterFile, StarterGroupLookup } from "../types";
import { parseStarters, getStarterFiles } from "./parseStarters";
require("dotenv").config({ path: "./.env.test", override: true });
import fs from "fs";

vi.mock("node:fs", async () => {
  const memfs = await vi.importActual("memfs");
  return { default: memfs.fs };
});

describe("parseStarters", () => {
  test("basic", () => {
    vol.reset();
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
});

describe("getStarterFiles", () => {
  test("starter with subdirectory", () => {
    vol.reset();
    vol.fromNestedJSON({
      ".": {
        "jump-start.yaml": "description: tk",
        subdirectory: {
          "data.txt": "some data",
        },
      },
    });

    const expected: StarterFile[] = [
      {
        path: "subdirectory/data.txt",
        type: "file",
        contents: "some data",
      },
      {
        path: "subdirectory",
        type: "dir",
      },
    ];
    expect(getStarterFiles(".")).toStrictEqual(expected);
  });
});
