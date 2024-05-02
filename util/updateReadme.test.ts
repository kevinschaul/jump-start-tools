import { expect, test } from "vitest";
import { GroupLookup, parseStarters } from "./parseStarters.ts";
import { generateReadmeSection, rewriteReadmeSection } from "./updateReadme.ts";

test("basic", () => {
  expect(
    generateReadmeSection({
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
    }),
  ).toBe(`### react-d3

#### Chart

    degit kevinschaul/jump-start/react-d3/Chart

An empty React component for writing a responsive D3 chart.

* Adds size prop
* Sets up margin convention

Tags: \`react\`, \`d3\`, \`chart\`
`);
});

test("basic", () => {
  expect(
    rewriteReadmeSection(
      `
# jump-start

## Usage

etc. etc.

## Starters

This should get removed

## Development

This should remain
`,
      "## Starters",
      "New starter content",
    ),
  ).toBe(`
# jump-start

## Usage

etc. etc.

## Starters

New starter content

## Development

This should remain
`);
});
