import {
  parseStarters,
  type GroupLookup,
  type Starter,
} from "../../../../util/parseStarters";
import * as path from "path";
import { readFileSync, readdirSync, statSync } from "fs";
import CopyableCommand from "../../CopyableCommand";
import StarterFile from "../../StarterFile";
import PreviewWrap from "../../PreviewWrap";

type Params = {
  group: string;
  title: string;
};

export default async function Starter({ params }: { params: Params }) {
  const starter = await getStarter(params.group, params.title);
  if (!starter) {
    return null;
  } else {
    const files = await getStarterFiles(starter.dir);
    return (
      <>
        <h1>
          {params.group}/<b>{params.title}</b>
        </h1>

        <CopyableCommand
          command={`npx degit kevinschaul/jump-start/${starter.dir} ${starter.defaultDir || starter.dir}`}
        />

        <a
          href={`https://www.github.com/kevinschaul/jump-start/tree/main/${params.group}/${params.title}`}
        >
          View on GitHub
        </a>

        {starter.description?.split("\n").map((d, i) => {
          return <p key={i}>{d}</p>;
        })}

        <hr />

        <PreviewWrap dir={starter.dir} />

        <hr />

        <div>
          {files.map((d) => {
            return (
              <StarterFile key={d.path} path={d.path} contents={d.contents} />
            );
          })}
        </div>
      </>
    );
  }
}

async function getStarter(
  group: string,
  title: string,
): Promise<Starter | undefined> {
  const starters = parseStarters(path.join(process.cwd(), "./src/starters/"));
  return starters[group].find((d) => d.title === title);
}

async function getStarterFiles(dirPath: string) {
  const basePath = path.join(process.cwd(), "./src/starters/");
  const files = readdirSync(path.join(basePath, dirPath));
  let out = [];

  for (const file of files) {
    if (!["jump-start.yaml", "degit.json"].includes(file)) {
      const filePath = path.join(basePath, dirPath, file);
      const stats = statSync(filePath);
      if (stats.isDirectory()) {
        out.push({
          path: file,
          type: "dir",
        });
      } else {
        out.push({
          path: file,
          type: "file",
          contents: readFileSync(filePath, "utf8"),
        });
      }
    }
  }

  return out;
}

export async function generateStaticParams() {
  const starters = parseStarters(path.join(process.cwd(), "./src/starters/"));

  let combinations: Params[] = [];
  for (const key of Object.keys(starters)) {
    for (const starter of starters[key]) {
      combinations.push({ group: starter.group, title: starter.title });
    }
  }
  return combinations;
}
