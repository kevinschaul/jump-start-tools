import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { executeRipgrep } from "./find";
import { Instance } from "./config";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("integration tests", () => {
  let tempDir: string;
  let instance: Instance;

  beforeAll(() => {
    // Create a temporary directory
    tempDir = mkdtempSync(join(tmpdir(), "just-start-tools-test-"));

    // Set up test directory structure
    const pythonDir = join(tempDir, "python/script");
    mkdirSync(pythonDir, { recursive: true });

    // Create test files
    writeFileSync(
      join(pythonDir, "convert.py"),
      'def main():\n    print("python test")\n',
    );
    writeFileSync(
      join(pythonDir, "jump-start.yaml"),
      "title: Python Script\ndescription: A test script\n",
    );

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
