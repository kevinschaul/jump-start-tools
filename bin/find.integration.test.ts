import { describe, expect, it } from "vitest";
import { executeRipgrep } from "./find";
import { Instance } from "./config";

describe("integration tests", () => {
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
