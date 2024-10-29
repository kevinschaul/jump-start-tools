import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleRgStdout, executeRipgrep } from "./find";
import { Instance } from "./config";

const mockSpawn = vi.fn().mockReturnValue({
  stdout: { on: vi.fn() },
  stderr: { on: vi.fn() },
  on: (event: string, cb: (code: number) => void) => cb(0),
});

vi.mock("node:child_process", () => ({
  default: {
    spawn: (...args: any[]) => mockSpawn(...args),
  },
  spawn: (...args: any[]) => mockSpawn(...args),
}));

describe("find functionality", () => {
  beforeEach(() => {
    mockSpawn.mockClear();
  });

  const instance: Instance = {
    username: "test-user",
    path: "/home/test/starters",
  };

  it("correctly parses ripgrep content output", () => {
    const testData =
      "/home/test/starters/python/script/jump-start.yaml:1:description: A basic Python script";

    const result = handleRgStdout({
      instance,
      data: testData,
    });

    expect(result).toEqual({
      path: "/home/test/starters/python/script",
      group: "python",
      starter: "script",
    });
  });

  it("correctly parses ripgrep path output", () => {
    const testData = "/home/test/starters/python/test-script/jump-start.yaml";

    const result = handleRgStdout({
      instance,
      data: testData,
    });

    expect(result).toEqual({
      path: "/home/test/starters/python/test-script",
      group: "python",
      starter: "test-script",
    });
  });

  it("executes ripgrep with correct arguments", async () => {
    const onMatch = vi.fn();
    await executeRipgrep(
      instance,
      "test",
      { text: true, code: true, startersDir: "" },
      onMatch,
    );

    // Verify content search call
    expect(mockSpawn).toHaveBeenCalledWith("rg", [
      "--glob",
      "!node_modules",
      "-tyaml",
      "test",
      "/home/test/starters",
    ]);

    // Verify path search call
    expect(mockSpawn).toHaveBeenCalledWith("rg", [
      "--glob",
      "!node_modules",
      "--files",
      "--glob",
      "*test*",
      "/home/test/starters",
    ]);
  });

  it("handles multiple matches from the same directory", async () => {
    const onMatch = vi.fn();
    const mockInstance: Instance = {
      username: "kevin",
      path: "/home/kevin/dev/jump-start",
    };

    // Mock the spawn implementation to simulate both content and path search results
    const mockEventEmitter = {
      stdout: {
        on: (event: string, callback: (data: string) => void) => {
          if (event === "data") {
            // Simulate finding both Chart and LineChart
            callback("/home/kevin/dev/jump-start/react-d3/Chart/jump-start.yaml:1:description: d3 chart");
            callback("/home/kevin/dev/jump-start/react-d3/LineChart/jump-start.yaml:1:description: d3 line chart");
          }
        },
      },
      stderr: { on: vi.fn() },
      on: (event: string, cb: (code: number) => void) => cb(0),
    };

    mockSpawn.mockReturnValueOnce(mockEventEmitter);

    await executeRipgrep(
      mockInstance,
      "d3",
      { text: true, code: false, startersDir: "" },
      onMatch,
    );

    // Verify both matches were found and handled
    expect(onMatch).toHaveBeenCalledTimes(2);
    expect(onMatch).toHaveBeenCalledWith({
      path: "/home/kevin/dev/jump-start/react-d3/Chart",
      group: "react-d3",
      starter: "Chart",
    });
    expect(onMatch).toHaveBeenCalledWith({
      path: "/home/kevin/dev/jump-start/react-d3/LineChart",
      group: "react-d3",
      starter: "LineChart",
    });
  });

  it("executes ripgrep with correct arguments for code search", async () => {
    const onMatch = vi.fn();
    await executeRipgrep(
      instance,
      "test",
      { text: false, code: true, startersDir: "" },
      onMatch,
    );

    // Verify content search call excludes yaml files
    expect(mockSpawn).toHaveBeenCalledWith("rg", [
      "--glob",
      "!node_modules",
      "--type-not=yaml",
      "test",
      "/home/test/starters",
    ]);

    // No path search should be executed for code search
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });
});
