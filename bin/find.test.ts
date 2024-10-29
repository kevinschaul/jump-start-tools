import { expect, test } from "vitest";
import { handleRgStdout } from "./find";

test("basic", () => {
  const rgStdout =
    "/home/kevin/dev/jump-start/react-d3/Chart/jump-start.yaml:  - d3";

  const instance = {
    username: "kevinschaul",
    path: "/home/kevin/dev/jump-start",
  };
  expect([...handleRgStdout({ instance, data: rgStdout })]).toEqual([
    ["react-d3", "Chart"],
  ]);
});
