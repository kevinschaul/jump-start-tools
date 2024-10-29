import { describe, expect, it, vi } from "vitest";
import { handleRgStdout, executeRipgrep } from "./find";
import { Instance } from "./config";

describe("find functionality", () => {
  const instance: Instance = {
    username: "test-user",
    path: "/home/test/starters"
  };

  it("correctly parses ripgrep content output", () => {
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

  it("correctly parses ripgrep path output", () => {
    const testData = "/home/test/starters/python/test-script/jump-start.yaml";
    
    const result = handleRgStdout({
      instance,
      data: testData
    });

    expect(result).toEqual({
      path: "/home/test/starters/python/test-script",
      group: "python",
      starter: "test-script"
    });
  });

  it("executes ripgrep with correct arguments", async () => {
    const mockSpawn = vi.fn().mockReturnValue({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: (event: string, cb: (code: number) => void) => cb(0)
    });
    
    vi.mock('node:child_process', () => ({
      default: {
        spawn: (...args: any[]) => mockSpawn(...args)
      },
      spawn: (...args: any[]) => mockSpawn(...args)
    }));

    const onMatch = vi.fn();
    await executeRipgrep(instance, "test", { text: true, code: true, startersDir: "" }, onMatch);

    expect(mockSpawn).toHaveBeenCalledWith("rg", expect.arrayContaining([
      "--glob", "!node_modules",
      "-tyaml",
      "--files-with-matches",
      "test",
      "/home/test/starters"
    ]));
  });
});
