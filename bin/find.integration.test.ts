import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { executeRipgrep } from "./find";
import { Instance } from "./config";
import fs from "fs";
import path from "path";
import os from "os";

describe("integration tests", () => {
  let tempDir: string;
  let instance: Instance;

  beforeAll(() => {
    // Create a temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'find-test-'));
    
    // Set up test directory structure
    const pythonDir = path.join(tempDir, 'python/script');
    fs.mkdirSync(pythonDir, { recursive: true });
    
    // Create test files
    fs.writeFileSync(
      path.join(pythonDir, 'convert.py'),
      'def main():\n    print("python test")\n'
    );
    fs.writeFileSync(
      path.join(pythonDir, 'jump-start.yaml'),
      'title: Python Script\ndescription: A test script\n'
    );

    instance = {
      name: "test-user",
      path: tempDir,
    };
  });

  afterAll(() => {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
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
