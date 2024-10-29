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

});
