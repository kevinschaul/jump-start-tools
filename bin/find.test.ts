import { expect, test } from "vitest";
import { handleRgStdout } from "./find";

test("basic", () => {
  const rgStdout =
    "/home/kevin/dev/jump-start/react-d3/Chart/jump-start.yaml:  - d3";

  const instance = {
    username: "kevinschaul",
    path: "/home/kevin/dev/jump-start",
  };
  expect(handleRgStdout({ instance, data: rgStdout })).toEqual({
    group: "react-d3",
    starter: "Chart",
    path: "/home/kevin/dev/jump-start/react-d3/Chart",
  });
});
import { describe, expect, it } from "vitest";
import { handleRgStdout } from "./find";
import { Instance } from "./config";

describe("handleRgStdout", () => {
  it("correctly parses ripgrep output", () => {
    const instance: Instance = {
      username: "test-user",
      path: "/home/test/starters"
    };
    
    const testData = "/home/test/starters/python/script/jump-start.yaml:1:description: A basic Python script";
    
    const result = handleRgStdout({
      instance,
      data: testData
    });

    expect(result).toEqual({
      path: "/home/test/starters/python/script",
      group: "python",
      starter: "script"
    });
  });

  it("handles different path separators correctly", () => {
    const instance: Instance = {
      username: "test-user",
      path: "C:\\Users\\test\\starters"
    };
    
    const testData = "C:\\Users\\test\\starters\\web\\react\\jump-start.yaml:1:description: React starter";
    
    const result = handleRgStdout({
      instance,
      data: testData
    });

    expect(result).toEqual({
      path: "C:\\Users\\test\\starters\\web\\react",
      group: "web",
      starter: "react"
    });
  });
});
