import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import yaml from "js-yaml";
import { type Settings } from "./config";
import { Starter } from "../src/types";
import { getStarterFiles } from "../src/util/parseStarters";
import { parseStarterString } from "./util";

type UseOpts = {
  out?: string;
};

type MatchingStarter = {
  path: string;
  group: string;
  starter: string;
};

const getDefaultDir = (starterPath: string) => {
  try {
    const starter = yaml.load(
      readFileSync(join(starterPath, "jump-start.yaml"), "utf8"),
    ) as Starter;
    return starter.defaultDir || ".";
  } catch (e) {
    if (e.code === "ENOENT") {
      console.error(`Starter not found: ${starterPath}`);
      process.exit(1);
    } else throw e;
  }
};

const getDefaultInstanceName = (config: Settings) => {
  return (config.instances.find((d) => d.default) || config.instances[0]).name;
};

const use = async (config: Settings, starterString: string, opts: UseOpts) => {
  const parsed = parseStarterString(starterString);
  if (!parsed.instanceName) {
    parsed.instanceName = getDefaultInstanceName(config);
  }

  const instance = config.instances.find((d) => d.name === parsed.instanceName);
  if (!instance) {
    console.error(`Instance not found: ${parsed.instanceName}`);
    process.exit(1);
  }

  const starter = {
    path: join(instance.path, parsed.groupName, parsed.starterName),
    group: parsed.groupName,
    starter: parsed.starterName,
  } as MatchingStarter;

  const cwd = process.cwd();
  const outDir = opts.out ? opts.out : getDefaultDir(starter.path);
  const files = getStarterFiles(starter.path);

  // TODO confirm defaultDir?

  for (const file of files) {
    if (file.contents) {
      const fullPath = join(cwd, outDir, file.path);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, file.contents);
      console.log(`Wrote ${fullPath}`);
    }
  }
};

export default use;
