import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleRgStdout, executeRipgrep } from "./find";
import { Instance } from "./config";

const createMockEventEmitter = () => ({
  stdout: { on: vi.fn(), removeListener: vi.fn() },
  stderr: { on: vi.fn(), removeListener: vi.fn() },
  on: vi.fn((event: string, cb: Function) => {
    if (event === "close") {
      // Simulate successful close with code 0
      setTimeout(() => cb(0), 0);
    }
  }),
  removeListener: vi.fn(),
});

describe("ripgrep integration tests", () => {
  const instance: Instance = {
    name: "test-user",
    path: process.cwd() + "/test/starters",
  };

  it("executes real ripgrep and finds matches", async () => {
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "python",
      { text: true, code: true, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      }
    );

    // Should find the python/script starter
    expect(matches).toContain("python/script");
    
    // Verify the actual ripgrep command works
    const contentMatches = matches.filter(m => m.includes("python"));
    expect(contentMatches.length).toBeGreaterThan(0);
  });

  it("handles real ripgrep path search", async () => {
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "script",
      { text: true, code: true, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      }
    );

    // Should find paths containing "script"
    expect(matches).toContain("python/script");
  });
});

const mockSpawn = vi.fn().mockImplementation(() => createMockEventEmitter());

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
    name: "test-user",
    path: "/home/test/starters",
  };

  it("correctly parses valid ripgrep content output", () => {
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
      "-tyaml",
      "test",
      "/home/test/starters",
    ]);

    // Verify path search call
    expect(mockSpawn).toHaveBeenCalledWith("rg", [
      "--files",
      "--glob",
      "*test*",
      "/home/test/starters",
    ]);
  });

  it("handles multiple matches from the same directory", async () => {
    const onMatch = vi.fn();
    const mockInstance: Instance = {
      name: "kevin",
      path: "/home/kevin/dev/jump-start",
    };

    // Mock the spawn implementation to simulate both content and path search results
    const mockEventEmitter = {
      stdout: {
        on: (event: string, callback: (data: string) => void) => {
          if (event === "data") {
            // Simulate finding both Chart and LineChart
            callback(
              "/home/kevin/dev/jump-start/react-d3/Chart/jump-start.yaml:1:description: d3 chart",
            );
            callback(
              "/home/kevin/dev/jump-start/react-d3/LineChart/jump-start.yaml:1:description: d3 line chart",
            );
          }
        },
      },
      stderr: { on: vi.fn() },
      on: vi.fn((event: string, cb: Function) => {
        if (event === "close") {
          // Simulate successful close with code 0
          setTimeout(() => cb(0), 0);
        }
      }),
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

  it("handles empty search term without executing search", async () => {
    const onMatch = vi.fn();
    await executeRipgrep(
      instance,
      "",
      { text: true, code: true, startersDir: "" },
      onMatch,
    );

    // Verify ripgrep was not called
    expect(mockSpawn).not.toHaveBeenCalled();
    expect(onMatch).not.toHaveBeenCalled();
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
      "--type-not=yaml",
      "test",
      "/home/test/starters",
    ]);

    // No path search should be executed for code search
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  });

  it("cleans up event listeners when called repeatedly", async () => {
    const onMatch = vi.fn();
    const mockRemoveAllListeners = vi.fn();

    // Mock process with removeAllListeners
    const mockProcess = {
      stdout: {
        on: vi.fn(),
        removeListener: mockRemoveAllListeners,
        removeAllListeners: mockRemoveAllListeners,
      },
      stderr: {
        on: vi.fn(),
        removeListener: mockRemoveAllListeners,
        removeAllListeners: mockRemoveAllListeners,
      },
      on: vi.fn((event: string, cb: Function) => {
        if (event === "close") {
          // Simulate successful close with code 0
          setTimeout(() => cb(0), 0);
        }
      }),
      removeAllListeners: mockRemoveAllListeners,
    };

    mockSpawn.mockReturnValue(mockProcess);

    // Call executeRipgrep multiple times
    await executeRipgrep(
      instance,
      "test",
      { text: false, code: true, startersDir: "" },
      onMatch,
    );

    await executeRipgrep(
      instance,
      "test",
      { text: false, code: true, startersDir: "" },
      onMatch,
    );

    // Verify removeAllListeners was called for each process component
    expect(mockRemoveAllListeners).toHaveBeenCalled();
    expect(mockRemoveAllListeners.mock.calls.length).toBeGreaterThan(0);
  });
});
