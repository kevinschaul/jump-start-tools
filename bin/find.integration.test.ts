import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { executeRipgrep } from "./find";
import { Instance } from "./config";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const createTestDirectory = (fileStructure: Record<string, any>) => {
  const tempDir = mkdtempSync(join(tmpdir(), "just-start-tools-test-"));

  // Recursively create directories and files
  const createNestedStructure = (
    structure: Record<string, any>,
    currentPath: string,
  ) => {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = join(currentPath, name);

      if (typeof content === "string") {
        // If content is a string, create a file
        writeFileSync(fullPath, content.trim().replace(/^\s+/gm, ""));
      } else if (typeof content === "object") {
        // If content is an object, create a directory and recurse
        mkdirSync(fullPath, { recursive: true });
        createNestedStructure(content, fullPath);
      }
    }
  };

  createNestedStructure(fileStructure, tempDir);
  return tempDir;
};

const fixturePythonScript = {
  "python/script": {
    "jump-start.yaml": `
            title: Python script
            description: A test script
        `,
    "convert.py": `
            def main():
                print("python test")
        `,
  },
};

describe("find: integration tests", () => {
  let tempDir: string;
  let instance: Instance;

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("text mode searches the yaml file", async () => {
    tempDir = createTestDirectory(fixturePythonScript);

    instance = {
      name: "test-user",
      path: tempDir,
    };
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "Python script",
      { text: true, code: false, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      },
    );

    expect(matches).toContain("python/script");
  });

  it("code mode does not search the yaml file", async () => {
    tempDir = createTestDirectory({
      "python/script": {
        "jump-start.yaml": `
            title: Python script
            description: A test script
        `,
        "convert.py": `
            def main():
                print("python test")
        `,
      },
    });
    tempDir = createTestDirectory(fixturePythonScript);

    instance = {
      name: "test-user",
      path: tempDir,
    };
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "Python script",
      { text: false, code: true, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      },
    );

    expect(matches).toEqual([]);
  });

  it("text mode does not search the python file", async () => {
    tempDir = createTestDirectory(fixturePythonScript);

    instance = {
      name: "test-user",
      path: tempDir,
    };
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "python test",
      { text: true, code: false, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      },
    );

    expect(matches).toEqual([]);
  });

  it("code mode searches the python", async () => {
    tempDir = createTestDirectory(fixturePythonScript);

    instance = {
      name: "test-user",
      path: tempDir,
    };
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "python test",
      { text: false, code: true, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      },
    );

    expect(matches).toContain("python/script");
  });

  it("search is case-insensitive", async () => {
    tempDir = createTestDirectory(fixturePythonScript);

    instance = {
      name: "test-user",
      path: tempDir,
    };
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "a test script",
      { text: true, code: false, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      },
    );

    expect(matches).toContain("python/script");
  });
});
