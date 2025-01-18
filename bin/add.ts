import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { type Settings } from "./config";
import { parseStarterString } from "./util";

type MatchingStarter = {
  path: string;
  group: string;
  starter: string;
};

type File = {
  name: string;
  content: string;
};

const getDefaultInstanceName = (config: Settings) => {
  return (config.instances.find((d) => d.default) || config.instances[0]).name;
};

const add = async (config: Settings, starterString: string, files: string) => {
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

  if (existsSync(starter.path)) {
    console.error(`Starter already exists: ${starter.path}`);
    process.exit(1);
  }

  const filesData = JSON.parse(files) as File[]
  const jumpStartFile = filesData.find(d => d.name === "jump-start.yaml")
  if (!jumpStartFile) {
    console.error(`Missing jump-start.yaml which is required`);
    process.exit(1);
  }

  // Write the starter files
  for (const file of filesData) {
    const fullPath = join(starter.path, file.name)
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, "utf-8")
  }

  console.log('Starter written successfully!')
};
export default add;
