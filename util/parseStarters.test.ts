import { beforeEach, expect, test } from "vitest";
import { GroupLookup, parseStarters } from "./parseStarters.ts";
import mockFS from "mock-fs";

test("basic", () => {
  beforeEach(() => {
    mockFS({
      ".": {
        "react-d3": {
          Chart: {
            "jump-start.yml": `
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
  });
  const expected: GroupLookup = {
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
