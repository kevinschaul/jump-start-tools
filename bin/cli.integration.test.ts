import { describe, expect, it } from "vitest";
import { ChildProcess, execSync, spawn } from "child_process";
import { mkdtempSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const root = join(import.meta.dirname, "../");

const runCommand = (command: string, cwd = process.cwd()) => {
  console.log(`running ${command}`);
  return execSync(command, { timeout: 10000, cwd: cwd }).toString();
};

const fileContents = (path) => readFileSync(path, "utf-8");

const setupTmpdir = () => {
  return mkdtempSync(join(tmpdir(), "jump-start-tools-"));
};

const collectProcessOutput = (
  process: ChildProcess,
): Promise<[string, string]> => {
  let stdout = "";
  let stderr = "";
  process.stdout?.on("data", (data) => {
    stdout += data.toString();
  });
  process.stderr?.on("data", (data) => {
    stderr += data.toString();
  });
  return new Promise((resolve, _reject) => {
    process.on("exit", () => {
      resolve([stdout, stderr]);
    });
  });
};

describe("jump-start help", () => {
  it("should print help", async () => {
    const response = runCommand("npx jump-start --help");
    expect(response).toContain("Usage: jump-start");
  });

  it("should work in a tmp dir", async () => {
    const cwd = setupTmpdir();
    runCommand(`npm install ${root}`, cwd);
    const response = runCommand("./node_modules/.bin/jump-start --help", cwd);
    expect(response).toContain("Usage: jump-start");
  });
});

it("storybook should generate stories .mdx files", async () => {
  const cwd = setupTmpdir();
  console.log(`Running test in ${cwd}`);

  runCommand(`npm install ${root}`, cwd);
  runCommand(`cp -r ${root}/test/starters ./starters`, cwd);

  console.log("Spawning child process");
  const childProcess = spawn(
    "./node_modules/.bin/jump-start",
    ["storybook", "--starters-dir", "starters", "--no-watch", "--", "--ci"],
    {
      cwd,
    },
  );

  // Kill the process after 10 seconds
  setTimeout(() => {
    console.log("Killing child process");
    childProcess.kill("SIGKILL");
  }, 10000);

  const [stdout, stderr] = await collectProcessOutput(childProcess);
  console.log(stdout, stderr);

  // Honestly no idea why another setTimeout is needed but otherwise the
  // stories files do not exist yet
  setTimeout(() => {
    const story = "r/data-analysis/data-analysis.mdx";
    const actual = fileContents(
      join(cwd, `starters/.build/jump-start-tools/src/stories/${story}`),
    );
    const expected = fileContents(join(root, `test/expected/stories/${story}`));

    expect(actual).toEqual(expected);
  }, 1000);
}, 20000);

it("build-storybook should generate the site", async () => {
  const cwd = setupTmpdir();
  console.log(`Running test in ${cwd}`);

  runCommand(`npm install ${root}`, cwd);
  runCommand(`cp -r ${root}/test/starters ./starters`, cwd);

  console.log("Spawning child process");
  const childProcess = spawn(
    "./node_modules/.bin/jump-start",
    ["build-storybook", "--starters-dir", "starters"],
    {
      cwd,
    },
  );

  const [stdout, stderr] = await collectProcessOutput(childProcess);
  console.log(stdout, stderr);

  expect(stdout).toContain("Preview built");
}, 40000);
