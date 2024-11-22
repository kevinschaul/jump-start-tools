import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { executeRipgrep } from "./find";
import { Instance } from "./config";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const createTestDirectory = (fileStructure: Record<string, any>) => {
  // Create a temporary directory
  const tempDir = mkdtempSync(join(tmpdir(), "just-start-tools-test-"));

  // Recursively create directories and files
  const createNestedStructure = (structure: Record<string, any>, currentPath: string) => {
    for (const [name, content] of Object.entries(structure)) {
      const fullPath = join(currentPath, name);
      
      if (typeof content === 'string') {
        // If content is a string, create a file
        writeFileSync(fullPath, content.trim().replace(/^\s+/gm, ''));
      } else if (typeof content === 'object') {
        // If content is an object, create a directory and recurse
        mkdirSync(fullPath, { recursive: true });
        createNestedStructure(content, fullPath);
      }
    }
  };

  createNestedStructure(fileStructure, tempDir);
  return tempDir;
};

describe("integration tests", () => {
  let tempDir: string;
  let instance: Instance;

  beforeAll(() => {
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

    instance = {
      name: "test-user",
      path: tempDir,
    };
  });

  afterAll(() => {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("executes real ripgrep and finds matches", async () => {
    const matches: string[] = [];
    await executeRipgrep(
      instance,
      "python",
      { text: true, code: true, startersDir: "" },
      (starter) => {
        matches.push(`${starter.group}/${starter.starter}`);
      },
    );

    expect(matches).toContain("python/script");

    const contentMatches = matches.filter((m) => m.includes("python"));
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
      },
    );

    expect(matches).toContain("python/script");
  });
});
